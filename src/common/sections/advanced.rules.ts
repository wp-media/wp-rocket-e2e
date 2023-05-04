import type { Page } from '@playwright/test';

export class advancedRules {
	readonly page: Page;
    readonly locators;

    constructor( page: Page ){
        this.page = page;
        this.locators = {
            'section': this.page.locator('#wpr-nav-advanced_cache'),
            'cache_reject_uri': this.page.locator('#cache_reject_uri'),
            'cache_reject_cookies': this.page.locator('#cache_reject_cookies'),
            'cache_reject_ua': this.page.locator('#cache_reject_ua'),
            'cache_purge_pages': this.page.locator('#cache_purge_pages'),
            'cache_query_strings': this.page.locator('#cache_query_strings'),
        }
    }

    visit = async () => {
        await this.locators.section.click();
    }

    /**
     * Add rules
     */
    addRule = async (id:string, pattern:string) => {
        await this.locators[id].fill(pattern);
    }

     /**
     * Check that all rules are empty.
     */
    areAllRulesEmpty = async () => {
        if (await this.locators.cache_reject_uri.inputValue() !== '') {
            return false;
        }

        if (await this.locators.cache_reject_cookies.inputValue() !== '') {
            return false;
        }

        if (await this.locators.cache_reject_ua.inputValue() !== '') {
            return false;
        }

        if (await this.locators.cache_purge_pages.inputValue() !== '') {
            return false;
        }

        if (await this.locators.cache_query_strings.inputValue() !== '') {
            return false;
        }

        return true;
    }
} 