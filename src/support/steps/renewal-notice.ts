import { ICustomWorld } from "../../common/custom-world";
import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';

/** Root element of the renewal banner (expiring soon and expired variants). */
const RENEWAL_BANNER = '.rocket-renewal-banner, #rocket-renewal-banner';

/** Title element of the renewal banner (expiring soon and expired variants). */
const RENEWAL_BANNER_TITLE = '.rocket-promo-title, .rocket-expired-title';

/** Message paragraphs of the banner; the title heading is deliberately excluded. */
const RENEWAL_BANNER_MESSAGE = '.rocket-renew-message p, .rocket-expired-message p';

/** Currency amount followed by the "(excl. taxes)" suffix, whatever the amount or currency. */
const RENEWAL_PRICE_PATTERN = /(?:[$€£]\s*\d[\d.,]*|\d[\d.,]*\s*[$€£])[^()]*\(excl\. taxes\)/;

/** Dates in the WordPress default "F j, Y" format or ISO "Y-m-d". */
const BANNER_DATE_PATTERN = /([A-Z][a-z]+ \d{1,2}, \d{4})|(\d{4}-\d{2}-\d{2})/;

// select license
When('{string} license is active',
    async function (this: ICustomWorld, licenseType: string) {
        // Navigate to helper plugin page.
        await this.utils.gotoHelper();
        await this.page.locator('#filters_tab').click();
        const dropdown = this.page.locator('#license_type_override');
        await dropdown.scrollIntoViewIfNeeded();
        await dropdown.selectOption(licenseType);
    }
);

// set auto renew
When('auto renew is disabled',
    async function (this: ICustomWorld) {
        // Navigate to helper plugin page.
        await this.utils.gotoHelper();
        await this.page.locator('#filters_tab').click();
        const dropdown = this.page.locator('#license_auto_renew_override');
        await dropdown.scrollIntoViewIfNeeded();
        await dropdown.selectOption('false');
        await this.page.click('button[type="submit"]');
    }
);

// set expiration 
When('license is {string}',
    async function (this: ICustomWorld, expirationStatus: string) {
        await this.page.locator('#filters_tab').click();
        const dropdown = this.page.locator('#license_expiration_override');
        await dropdown.scrollIntoViewIfNeeded();
        await dropdown.selectOption(expirationStatus);
        await this.page.click('button[type="submit"]');
    }
);

// Validate license
When('License is validated',
    async function (this: ICustomWorld) {
        const message = this.page.getByText(
            'WP Rocket was not able to automatically validate your license.'
        );

        // check quickly (no long timeout)
        if (await message.isVisible({ timeout: 3000 })) {
            await this.page.getByRole('button', { name: /validate license/i }).click();
        }

        if (await this.page.locator('#license').isVisible()) {
            await this.page.locator('#wpr-options-submit').scrollIntoViewIfNeeded();
            await this.page.locator('#wpr-options-submit').click();
        }
    }
);


// Validate expiring soon banner is displayed
When('expiring soon banner is displayed',
    async function (this: ICustomWorld) {
        await expect(this.page.locator('#rocket-renew-countdown')).toBeVisible();
    }
);


// Validate expired banner is displayed
When('expired banner is displayed',
    async function (this: ICustomWorld) {
        await expect(this.page.locator('#rocket-renewal-banner')).toBeVisible();
    }
);

/**
 * Selects the license creation year in the helper plugin and saves it.
 *
 * @param {string} year - Year suffix of the helper option `created_in_<year>`.
 * @returns {Promise<void>}
 */
When('license was created in {string}',
    async function (this: ICustomWorld, year: string): Promise<void> {
        await this.page.locator('#filters_tab').click();
        const dropdown = this.page.locator('#license_creation_date_override');
        await dropdown.scrollIntoViewIfNeeded();
        await dropdown.selectOption(`created_in_${year}`);
        await this.page.click('button[type="submit"]');
    }
);

/**
 * Asserts the saved state of Optimize CSS Delivery on the settings page.
 *
 * @param {string} state - Either "enabled" or "disabled".
 * @returns {Promise<void>}
 */
When('Optimize CSS Delivery is {string}',
    async function (this: ICustomWorld, state: string): Promise<void> {
        if (state !== 'enabled' && state !== 'disabled') {
            throw new Error(`Unsupported Optimize CSS Delivery state "${state}", use "enabled" or "disabled".`);
        }

        this.sections.set('fileOptimization');
        await this.sections.visit();

        const checkbox = this.page.locator(this.sections.getStringProperty('rucss', 'element'));

        if (state === 'enabled') {
            await expect(checkbox).toBeChecked();
            return;
        }

        await expect(checkbox).not.toBeChecked();
    }
);

/**
 * Asserts the exact title of the renewal banner.
 *
 * @param {string} title - Expected title text.
 * @returns {Promise<void>}
 */
Then('renew banner title is {string}',
    async function (this: ICustomWorld, title: string): Promise<void> {
        await expect(this.page.locator(RENEWAL_BANNER).locator(RENEWAL_BANNER_TITLE)).toHaveText(title);
    }
);

/**
 * Escapes a string for literal use inside a regular expression.
 *
 * @param {string} text - Text to escape.
 * @returns {string} The escaped text.
 */
function escapeRegExp(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Asserts a banner message paragraph contains the given text (case-sensitive, whitespace normalised).
 *
 * The title heading is not part of the message paragraphs, so text found only in the title does not match.
 *
 * @param {string} text - Expected text.
 * @returns {Promise<void>}
 */
Then('renew banner message contains {string}',
    async function (this: ICustomWorld, text: string): Promise<void> {
        const paragraphs = this.page.locator(RENEWAL_BANNER).locator(RENEWAL_BANNER_MESSAGE);

        await expect(paragraphs.filter({ hasText: new RegExp(escapeRegExp(text)) })).not.toHaveCount(0);
    }
);

/**
 * Asserts no banner message paragraph contains the given text (case-insensitive, whitespace normalised).
 *
 * @param {string} text - Text that must be absent.
 * @returns {Promise<void>}
 */
Then('renew banner message does not contain {string}',
    async function (this: ICustomWorld, text: string): Promise<void> {
        const paragraphs = this.page.locator(RENEWAL_BANNER).locator(RENEWAL_BANNER_MESSAGE);

        await expect(paragraphs.first()).toBeVisible();
        await expect(paragraphs.filter({ hasText: text })).toHaveCount(0);
    }
);

/**
 * Asserts a banner message paragraph shows a price (currency amount followed by "(excl. taxes)").
 *
 * @returns {Promise<void>}
 */
Then('renew banner shows the renewal price',
    async function (this: ICustomWorld): Promise<void> {
        const paragraphs = this.page.locator(RENEWAL_BANNER).locator(RENEWAL_BANNER_MESSAGE);

        await expect(paragraphs.filter({ hasText: RENEWAL_PRICE_PATTERN })).not.toHaveCount(0);
    }
);

/**
 * Asserts the banner message shows a date 12 to 14 days after today (UTC).
 *
 * The window absorbs the site timezone offset around the expected 13 days. Only the WordPress
 * "F j, Y" and ISO "Y-m-d" formats are parsed; any other site date_format fails with an explicit error.
 *
 * @returns {Promise<void>}
 */
Then('renew banner shows a date 12 to 14 days from today',
    async function (this: ICustomWorld): Promise<void> {
        const paragraphs = this.page.locator(RENEWAL_BANNER).locator(RENEWAL_BANNER_MESSAGE);

        await expect(paragraphs.filter({ hasText: BANNER_DATE_PATTERN })).not.toHaveCount(0);

        const text = (await paragraphs.allInnerTexts()).join(' ');
        const found = text.match(BANNER_DATE_PATTERN)?.[0];
        const bannerDate = Date.parse(`${found} UTC`);

        expect(Number.isNaN(bannerDate), `Banner date "${found}" could not be parsed`).toBe(false);

        const now = new Date();
        const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
        const days = Math.round((bannerDate - todayUtc) / 86400000);

        expect(days, `Banner date "${found}" is ${days} days from today, expected 12 to 14`).toBeGreaterThanOrEqual(12);
        expect(days, `Banner date "${found}" is ${days} days from today, expected 12 to 14`).toBeLessThanOrEqual(14);
    }
);
