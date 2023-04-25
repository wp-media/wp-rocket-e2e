import type { Page } from '@playwright/test';

export class Cache {
	readonly page: Page;
    readonly locators;
    readonly selectors;

    constructor( page: Page ){
        this.page = page;
        this.selectors = {
            'mobile_device_cache': {
                'checkbox': '#cache_mobile',
                'enable': 'label[for=cache_mobile]'
            },
            'mobile_device_separate_cache': {
                'checkbox': '#do_caching_mobile_files',
                'enable': 'label[for=do_caching_mobile_files]'
            },
            'cache_logged_user': {
                'checkbox': '#cache_logged_user',
                'enable': 'label[for=cache_logged_user]'
            }
        };
        this.locators = {
            'section': this.page.locator('#wpr-nav-cache'),
            'mobile_device_cache': this.page.locator(this.selectors.mobile_device_cache.enable),
            'mobile_device_separate_cache': this.page.locator(this.selectors.mobile_device_separate_cache.enable),
            'cache_logged_user': this.page.locator(this.selectors.cache_logged_user.enable)
        }
    }

    visit = async () => {
        await this.locators.section.click();
    }

    /**
     * Toggle Caching for mobile device option. 
     */
    toggleMobileDeviceCache = async (checked = false) => {
        if (!checked) {
            if (!await this.page.locator(this.selectors.mobile_device_cache.checkbox).isChecked()) {
                return;
            }
        } else {
            if (await this.page.locator(this.selectors.mobile_device_cache.checkbox).isChecked()) {
                return;
            }
        }
        await this.locators.mobile_device_cache.click();
    }

    /**
     * Toggle Separate caching for mobile device option. 
     */
    toggleMobileDeviceSeparateCache = async (checked = false) => {
        if (!checked) {
            if (!await this.page.locator(this.selectors.mobile_device_separate_cache.checkbox).isChecked()) {
                return;
            }
        } else {
            if (await this.page.locator(this.selectors.mobile_device_separate_cache.checkbox).isChecked()) {
                return;
            }
        }
        await this.locators.mobile_device_separate_cache.click();
    }

    /**
     * Toggle Caching logged user option. 
     */
    toggleCacheLoggedUser = async (checked = false) => {
        if (!checked) {
            if (!await this.page.locator(this.selectors.cache_logged_user.checkbox).isChecked()) {
                return;
            }
        } else {
            if (await this.page.locator(this.selectors.cache_logged_user.checkbox).isChecked()) {
                return;
            }
        }
        await this.locators.cache_logged_user.click();
    }

    /**
     * 
     */
    toggleEnableAll = async (enable_all = false) => {
        if (enable_all) {
            await this.toggleMobileDeviceCache(true);
            await this.toggleMobileDeviceSeparateCache(true);
            await this.toggleCacheLoggedUser(true);
            return;
        }

        await this.toggleMobileDeviceCache();
        await this.toggleMobileDeviceSeparateCache();
        await this.toggleCacheLoggedUser();
    }
}