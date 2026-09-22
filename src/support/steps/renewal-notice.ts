import { ICustomWorld } from "../../common/custom-world";
import { When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';

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
        await expect(this.page.getByText('Your WP Rocket license is expired!')).toBeVisible();
    }
);

