/**
 * @fileoverview
 * This module contains Cucumber step definitions using Playwright for various actions and assertions related to WP Rocket.
 * It includes steps for logging in, installing, activating, logging out, visiting pages, clicking buttons, enabling settings,
 * creating references, checking for specific text, debugging, and cleaning up.
 *
 * @requires {@link ../../common/custom-world}
 * @requires {@link @playwright/test}
 * @requires {@link @cucumber/cucumber}
 * @requires {@link ../../../config/wp.config}
 * @requires {@link ../../../utils/helpers}
 */
import { expect } from "@playwright/test";
import { ICustomWorld } from "../../common/custom-world";

import { Given, When, Then } from '@cucumber/cucumber';
import { WP_BASE_URL } from '../../../config/wp.config';
import { SCENARIO_URLS } from "../../../config/wp.config";
import { createReference, compareReference } from "../../../utils/helpers";
import type { Section } from "../../../utils/types";
import { Page } from '@playwright/test';

/**
 * Executes the step to log in.
 */
Given('I am logged in', async function (this: ICustomWorld) {
    await this.utils.auth();
});

/**
 * Executes the step to install the WP Rocket plugin.
 */
Given('plugin is installed {string}', async function (this: ICustomWorld, pluginVersion: string) {
    await this.utils.uploadNewPlugin(`./plugin/${pluginVersion}.zip`);
    await this.page.waitForLoadState('load', { timeout: 30000 });
    await expect(this.page).toHaveURL(/action=upload-plugin/); 
});

/**
 * Executests the step to update WP Rocket plugin.
 */
Given('I updated plugin to {string}', async function (this: ICustomWorld, pluginVersion: string) {
    await this.utils.uploadNewPlugin(`./plugin/${pluginVersion}.zip`);
    await this.page.waitForLoadState('load', { timeout: 30000 });
    await expect(this.page).toHaveURL(/action=upload-plugin/); 
    
    // Replace current with uploaded
    await this.page.locator('a:has-text("Replace current with uploaded")').click();
    await this.page.waitForLoadState('load', { timeout: 30000 });
});

/**
 * Executes the step to activate the WP Rocket plugin.
 */
Given('plugin is activated', async function (this: ICustomWorld) {
    // Activate WPR
    await this.page.waitForSelector('a:has-text("Activate Plugin")');
    await this.page.locator('a:has-text("Activate Plugin")').click();
});

/**
 * Executes the step to activate the WP plugin.
 */
Given('activate {string} plugin', async function (plugin) {
    await this.utils.gotoPlugin();
    await this.utils.togglePluginActivation(plugin, true);
});

/**
 * Performs an action to save a specific WP Rocket setting/option.
 * 
 * @step
 * @param {string} section - WP Rocket Section.
 * @param {string} element - Element attributes from selectors object.
 * 
 * @example
 * Given plugin is installed
 */
Given('I save settings {string} {string}', async function (this: ICustomWorld, section: Section, element: string) {
    await this.sections.set(section).visit();
    await this.sections.state(true).toggle(element);
    await this.utils.saveSettings();

    await this.page.waitForLoadState('load', { timeout: 30000 });
});


/**
 * Executes the step to log in.
 */
When('I log in', async function (this: ICustomWorld) {
    await this.utils.auth();
});

/**
 * Executes the step to visit a specific page.
 */
When('I go to {string}', async function (this: ICustomWorld, page) {
    await this.utils.visitPage(page);
    await this.page.waitForLoadState('load', { timeout: 100000 });
});

/**
 * Executes the step to click on a specific button.
 */
When('I click on {string}', async function (this: ICustomWorld, selector) {
    if (selector === '.wpr-tools:nth-child(4) a') {
        /**
         * Save WP Rocket last major version.
         */
        // Navigate to helper plugin page.
        await this.utils.gotoHelper();
        // Go to tools tab
        await this.page.locator('#tools_tab').click();
        await this.page.waitForSelector('#save_last_major_version');
        await this.page.locator('#save_last_major_version').click();
        await this.page.waitForLoadState('load', { timeout: 30000 });
        await this.utils.gotoWpr();
        await this.page.locator('#wpr-nav-tools').click();
    }
    await this.page.locator(selector).click();
    await this.page.waitForLoadState('load', { timeout: 100000 });
});

/**
 * Executes the step to enable all settings.
 */
When('I enable all settings', async function (this: ICustomWorld) {
    /**
     * Enable all settings and save, 
     */
    await this.utils.enableAllOptions();
});

/**
 * Executes the step to log out.
 */
When('I log out', async function (this: ICustomWorld) {
    await this.utils.wpAdminLogout();
    await this.page.waitForLoadState('load', { timeout: 30000 });
});

/**
 * Executes the step to visit the site URL.
 */
When('I visit site url', async function (this: ICustomWorld) {
    await this.page.goto(WP_BASE_URL);
});

/**
 * Executes the step to create a reference.
 */
When('I create reference', async function (this:ICustomWorld) {
    if (process.env.npm_config_vrurl === undefined) {
        return;
    }

    await createReference(process.env.npm_config_vrurl);
});

/**
 * Executes the step to assert the presence of specific text.
 */
Then('I should see {string}', async function (this: ICustomWorld, text) {
    await expect(this.page.getByText(text)).toBeVisible();
});

/**
 * Executes the step to check for errors in debug.log.
 */
Then('I must not see any error in debug.log', async function (this: ICustomWorld){
    // Goto WP Rocket dashboard
    await this.utils.gotoWpr();
    await this.page.waitForLoadState('load', { timeout: 30000 });
    // Assert that there is no related error in debug.log
    await expect(this.page.locator('#wpr_debug_log_notice')).toBeHidden();
});

/**
 * Executes the step to clean up WP Rocket.
 */

Then('clean up', async function (this: ICustomWorld) {
    await this.utils.cleanUp();
});

/**
 * Executes the step to check for visual regression.
 */
Then('I must not see any visual regression {string}', async function (this: ICustomWorld, label: string) {
    await compareReference(label);
});

/**
 * Executes the step to check for that there is no console error different from the nowprocket page version.
 */
Then('no error in the console different than nowprocket page {string}', async function (this: ICustomWorld, label: string) {
    const consoleMsg1 = await getConsoleMsg(this.page, `${WP_BASE_URL}/${SCENARIO_URLS[label]}?nowprocket`);
    const consoleMsg2 = await getConsoleMsg(this.page, `${WP_BASE_URL}/${SCENARIO_URLS[label]}`);

    if (consoleMsg2.length !== 0) {
        expect(consoleMsg2).toEqual(consoleMsg1);
    }
});

const getConsoleMsg = async (page: Page, url: string): Promise<Array<string>> => {
    const consoleMsg: string[] = [];

    const consoleHandler = (msg): void => {
        consoleMsg.push(msg.text());
    };

    const pageErrorHandler = (error: Error): void => {
        consoleMsg.push(error.message);
    };

    // Listen for console messages.
    page.on('console', consoleHandler);

    // Listen for page errors.
    page.on('pageerror', pageErrorHandler);

    await page.goto(url);
    await page.waitForLoadState('load', { timeout: 30000 });

    await page.evaluate(async () => {
        // Scroll to the bottom of page.
        const scrollPage: Promise<void> = new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 100;
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
    page.off('console', consoleHandler);
    page.off('pageerror', pageErrorHandler);

    return consoleMsg;
}
