import type { Page } from '@playwright/test';

export class cdn {
	readonly page: Page;
    readonly locators;

    constructor( page: Page ){
        this.page = page;
        this.locators = {
            'section': this.page.locator('#wpr-nav-page_cdn'),
            'cdn': this.page.locator('label[for=cdn]'),
        }
    }

    visit = async () => {
        await this.locators.section.click();
    }

    /**
     * Toggle CDN option. 
     */
    toggleCDN = async (checked = false) => {
        // Bail if passed state is currently active.
        if (!checked) {
            if (!await this.page.locator('#cdn').isChecked()) {
                return;
            }
        } else {
            if (await this.page.locator('#cdn').isChecked()) {
                return;
            }
        }
        await this.locators.cdn.click();
    }

    /**
     * Return default: false when no option in section is enabled
     */
     checkAnyEnabledOption = async () => {
        if (await this.page.isChecked('#cdn')) {
            return true;
        }

        return false;
    }

    /**
     * Mass toggle all settings
     */
    toggleEnableAll = async (enable_all = false) => {
        if (enable_all) {
            await this.toggleCDN(true);
            await this.page.getByRole('textbox', { name: 'cdn.example.com' }).fill('test.example.com');
            return;
        }

        await this.toggleCDN();
        await this.page.getByRole('textbox', { name: 'cdn.example.com' }).fill('');
    }

    /**
     * Check that all options are disabled.
     */
    areAllOptionDisabled = async () => {
        if (await this.page.locator('#cdn').isChecked()) {
            return false;
        }

        if (await this.page.getByRole('textbox', { name: 'cdn.example.com' }).inputValue() !== '') {
            return false;
        }

        return true;
    }
}