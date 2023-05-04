import type { Page } from '@playwright/test';

export class addons {
	readonly page: Page;
    readonly locators;
    readonly selectors;

    constructor( page: Page ){
        this.page = page;
        this.selectors = {
            'varnish_auto_purge': {
                'checkbox': '#varnish_auto_purge',
                'enable': 'label[for=varnish_auto_purge]'
            },
            'cache_webp': {
                'checkbox': '#cache_webp',
                'enable': 'label[for=cache_webp]'
            },
            'do_cloudflare': {
                'checkbox': '#do_cloudflare',
                'enable': 'label[for=do_cloudflare]'
            },
            'sucury_waf_cache_sync': {
                'checkbox': '#sucury_waf_cache_sync',
                'enable': 'label[for=sucury_waf_cache_sync]'
            }
        };
        this.locators = {
            'section': this.page.locator('#wpr-nav-addons'),
            'varnish_auto_purge': this.page.locator(this.selectors.varnish_auto_purge.enable),
            'cache_webp': this.page.locator(this.selectors.cache_webp.enable),
            'do_cloudflare': this.page.locator(this.selectors.do_cloudflare.enable),
            'sucury_waf_cache_sync': this.page.locator(this.selectors.sucury_waf_cache_sync.enable)
        }
    }

    visit = async () => {
        await this.locators.section.click();
    }

    /**
     * Toggle Varnish auto purge option. 
     */
    toggleVarnishAutoPurge = async (checked = false) => {
        if (!checked) {
            if (!await this.page.locator(this.selectors.varnish_auto_purge.checkbox).isChecked()) {
                return;
            }
        } else {
            if (await this.page.locator(this.selectors.varnish_auto_purge.checkbox).isChecked()) {
                return;
            }
        }
        await this.locators.varnish_auto_purge.click();
    }

    /**
     * Toggle Webp caching option. 
     */
    toggleCacheWebp = async (checked = false) => {
        if (!checked) {
            if (!await this.page.locator(this.selectors.cache_webp.checkbox).isChecked()) {
                return;
            }
        } else {
            if (await this.page.locator(this.selectors.cache_webp.checkbox).isChecked()) {
                return;
            }
        }
        await this.locators.cache_webp.click();
    }

    /**
     * Toggle cloudflare option. 
     */
    toggleCloudflare = async (checked = false) => {
        if (!checked) {
            if (!await this.page.locator(this.selectors.do_cloudflare.checkbox).isChecked()) {
                return;
            }
        } else {
            if (await this.page.locator(this.selectors.do_cloudflare.checkbox).isChecked()) {
                return;
            }
        }
        await this.locators.do_cloudflare.click();
    }

    /**
     * Toggle Sucuri cache sync option. 
     */
    toggleSucuriCacheSync = async (checked = false) => {
        if (!checked) {
            if (!await this.page.locator(this.selectors.sucury_waf_cache_sync.checkbox).isChecked()) {
                return;
            }
        } else {
            if (await this.page.locator(this.selectors.sucury_waf_cache_sync.checkbox).isChecked()) {
                return;
            }
        }
        await this.locators.sucury_waf_cache_sync.click();
    }

    /**
     * Mass toggle all settings
     */
    toggleEnableAll = async (enable_all = false) => {
        if (enable_all) {
            await this.toggleVarnishAutoPurge(true);
            await this.toggleCacheWebp(true);
            await this.toggleCloudflare(true);
            await this.toggleSucuriCacheSync(true);
            return;
        }

        await this.toggleVarnishAutoPurge();
        await this.toggleCacheWebp();
        await this.toggleCloudflare();
        await this.toggleSucuriCacheSync();
    }

     /**
     * Check that all options are disabled.
     */
    areAllOptionDisabled = async () => {
        if (await this.page.locator(this.selectors.varnish_auto_purge.checkbox).isChecked()) {
            return false;
        }

        if (await this.page.locator(this.selectors.cache_webp.checkbox).isChecked()) {
            return false;
        }

        if (await this.page.locator(this.selectors.do_cloudflare.checkbox).isChecked()) {
            return false;
        }

        if (await this.page.locator(this.selectors.sucury_waf_cache_sync.checkbox).isChecked()) {
            return false;
        }

        return true;
    }
}