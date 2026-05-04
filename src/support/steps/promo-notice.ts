import { ICustomWorld } from "../../common/custom-world";
import { When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';


// activate promo
When('promo is active',
    async function (this: ICustomWorld) {
        await this.page.locator('#filters_tab').click();
        const dropdown = this.page.locator('#transient_wp_rocket_pricing');
        await dropdown.scrollIntoViewIfNeeded();
        await dropdown.selectOption('enabled');
        await this.page.click('button[type="submit"]');
    }
);

// Validate promo banner is displayed
When('promo banner is displayed',
    async function (this: ICustomWorld) {
        await expect(this.page.locator('#rocket-promo-countdown')).toBeVisible();
    }
);

// set creation date
When('creation date is old',
    async function (this: ICustomWorld) {
        await this.page.locator('#filters_tab').click();
        const dropdown = this.page.locator('#license_creation_date_override');
        await dropdown.scrollIntoViewIfNeeded();
        await dropdown.selectOption('created_20_days_ago');
        await this.page.click('button[type="submit"]');
    }
);