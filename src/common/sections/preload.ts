import type { Page } from '@playwright/test';

export class preload {
	readonly page: Page;
    readonly locators;
    readonly selectors;

    constructor( page: Page ){
        this.page = page;

        this.selectors = {
            'preload': {
                'checkbox': '#manual_preload',
                'enable': 'label[for=manual_preload]'
            },
            'preload_links': {
                'checkbox': '#preload_links',
                'enable': 'label[for=preload_links]'
            }
        }

        this.locators = {
            'section': this.page.locator('#wpr-nav-preload'),
            'preload': this.page.locator(this.selectors.preload.enable),
            'preload_links': this.page.locator(this.selectors.preload_links.enable),
        }
    }

    visit = async () => {
        await this.locators.section.click();
    }

    /**
     * Toggle Preload option. 
     */
    togglePreload = async (checked = false) => {
        // Bail if passed state is currently active.
        if (!checked) {
            if (!await this.page.locator(this.selectors.preload.checkbox).isChecked()) {
                return;
            }
        } else {
            if (await this.page.locator(this.selectors.preload.checkbox).isChecked()) {
                return;
            }
        }
        await this.locators.preload.click();
    }

    /**
     * Toggle Preload links option. 
     */
    togglePreloadLinks = async (checked = false) => {
        // Bail if passed state is currently active.
        if (!checked) {
            if (!await this.page.locator(this.selectors.preload_links.checkbox).isChecked()) {
                return;
            }
        } else {
            if (await this.page.locator(this.selectors.preload_links.checkbox).isChecked()) {
                return;
            }
        }
        await this.locators.preload_links.click();
    }

    /**
     * Mass toggle all settings
     */
    toggleEnableAll = async (enable_all = false) => {
        if (enable_all) {
            await this.togglePreload(true);
            await this.togglePreloadLinks(true);
            return;
        }

        await this.togglePreload();
        await this.togglePreloadLinks();
    }
}