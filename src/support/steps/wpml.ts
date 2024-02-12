/**
 * @fileoverview
 * This module contains Cucumber step definitions using Playwright for various actions and assertions related to WordPress (WP) and WP Rocket plugin.
 * It includes steps for managing WP accounts, activating and interacting with plugins, handling banners, refreshing pages, saving options, turning on specific settings,
 * navigating to pages, connecting as a user, and performing cleanup after all scenarios are executed.
 *
 * @requires {@link @playwright/test}
 * @requires {@link @cucumber/cucumber}
 * @requires {@link ../../../utils/commands}
 * @requires {@link ../../../utils/configurations}
 */
import { Given, When } from '@cucumber/cucumber';
import {expect} from "@playwright/test";
import {ICustomWorld} from "../../common/custom-world";

/**
 * Save directory for wpml language setting
 */
Given('wpml directory is enabled', async function(this:ICustomWorld) {
    await this.page.waitForSelector('#lang-sec-2');
    await this.page.locator('input[name="icl_language_negotiation_type"]').nth(0).check()

    await this.page.locator('input[type="submit"]').nth(0).click();

    await this.page.waitForLoadState('load', { timeout: 30000 });
});

/**
 * Save query string for wpml language setting
 */
Given('wpml query string is enabled', async function (this:ICustomWorld) {
    await this.utils.visitPage('wp-admin/admin.php?page=sitepress-multilingual-cms%2Fmenu%2Flanguages.php');
    await this.page.getByRole('link', {name: 'Language URL format'}).click()

    await this.page.locator('input[name="icl_language_negotiation_type"]').nth(2).check()
    await this.page.locator('input[type="submit"]').nth(0).click();

    await this.page.waitForLoadState('load', { timeout: 30000 });
});

/**
 * Save languages settings
 */
Given('I save wpml language settings', async function (this:ICustomWorld) {
    await this.page.waitForSelector('#icl_save_language_selection');
    await this.page.locator('#icl_save_language_selection').click();

    await this.page.waitForLoadState('load', { timeout: 50000 });
});

/**
 * Check WPML has multiple languages activated.
 */
Given('wpml has more than one languages', async function (this:ICustomWorld) {
    await this.utils.visitPage('wp-admin/admin.php?page=sitepress-multilingual-cms%2Fmenu%2Flanguages.php');
    const languages = await this.page.locator('.enabled-languages li').all()

    if(languages.length >= 3) {
        return
    }

    const checkBoxesLength = await this.page.locator('.available-languages li input[type=checkbox]').all()

    await this.page.locator( '#icl_add_remove_button' ).click();
    let count = 0;

    for (let i = 0; i < checkBoxesLength.length; ++i) {
        const randomNumber = Math.floor(Math.random() * checkBoxesLength.length)

        if(count > 3) {
            break;
        }

        await this.page.locator('.available-languages li input[type=checkbox]').nth(randomNumber).check()
        count++;
    }

    await this.page.locator('#icl_save_language_selection').click();
});

/**
 * Switch to another language
 */
When('switch to another language', async function () {
    const getNextLanguageAnchor = await this.page.locator('.wpml-ls-slot-footer a:not(.wpml-ls-current-language)').first()
    const getLink = await getNextLanguageAnchor.getAttribute('href');
    await this.page.goto(getLink)

    await this.page.waitForLoadState('load', { timeout: 30000 });

    const consoleMsg: string[] = [];
    const consoleHandler = (msg): void => {
        consoleMsg.push(msg.text());
    };
    const pageErrorHandler = (error: Error): void => {
        consoleMsg.push(error.message);
    };

    await this.page.evaluate(async () => {
        // Scroll to the bottom of page.
        const scrollPage: Promise<void> = new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 150;
            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if(totalHeight >= scrollHeight){
                    clearInterval(timer);
                    resolve();
                }
            }, 500);
        });

        await scrollPage;
    });

    // Remove the event listeners to prevent duplicate messages.
    this.page.off('console', consoleHandler);
    this.page.off('pageerror', pageErrorHandler);

    expect(consoleMsg.length).toEqual(0);
});