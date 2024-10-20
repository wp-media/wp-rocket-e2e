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
import {SCENARIO_URLS, WP_BASE_URL} from '../../../config/wp.config';
import { createReference, compareReference } from "../../../utils/helpers";
import type { Section } from "../../../utils/types";
import { Page } from '@playwright/test';
import {
    deactivatePlugin, installRemotePlugin,
} from "../../../utils/commands";
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
    // If section does not exist and element is cacheLoggedUser, toggle the element in addons section.
    if (!(await this.sections.doesSectionExist(section))) {
        if (element === 'cacheLoggedUser') {
            await this.sections.set('addons').visit();
            await this.sections.state(true).toggle(element);
        }

        return;
    }   

    await this.sections.set(section).visit();
    await this.sections.state(true).toggle(element);
    await this.utils.saveSettings();

});

/**
 * Executes the step to activate the WP plugin.
 */
Given('activate {string} plugin', async function (this: ICustomWorld, plugin) {
    await this.utils.gotoPlugin();
    await this.utils.togglePluginActivation(plugin);
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
});

/**
 * Clear wpr cache
 */
Given('clear wpr cache', async function (this: ICustomWorld) {
    await this.utils.clearWPRCache();
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
        await this.utils.gotoWpr();
        await this.page.locator('#wpr-nav-tools').click();
        await this.page.locator(selector).click();
        await this.page.waitForLoadState('load', { timeout: 70000 });
    }
    else{
        await this.page.locator(selector).click();
    }
    
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
 * Executes the step to activate a theme.
 */
When('theme {string} is activated', async function (this:ICustomWorld, theme) {
    await this.utils.switchTheme(theme);
});

/**
 * Executes the step to activate a theme set from the CLI.
 */
When('theme is activated', async function (this:ICustomWorld) {
    const theme = process.env.THEME ? process.env.THEME : '';

    if (theme === '') {
        return;
    }

    await this.utils.switchTheme(theme);
});

/**
 * Executes the step visit a page in mobile view.
 */
When('I visit {string} in mobile view', async function (this:ICustomWorld, page) {
    await this.page.setViewportSize({
        width: 500,
        height: 480,
    });

    await this.utils.visitPage(page);
});

/**
 * Executes the step to expand the mobile menu.
 */
When('expand mobile menu', async function (this:ICustomWorld) {
    let target: string;
    const theme = process.env.THEME ? process.env.THEME : '';

    if (theme === '') {
        return;
    }

    switch (theme) {
        case 'genesis-sample-develop':
            target = '#genesis-mobile-nav-primary';
            break;
        case 'flatsome':
            target = '[data-open="#main-menu"]';
            break;
        case 'Divi':
            target = '#et_mobile_nav_menu';
            break;
        case 'astra':
            target = '.ast-mobile-menu-trigger-minimal';
            break;
    }

    await this.page.locator(target).click();
});

/**
 * Executes the step to clear wp rocket cache.
 */
When('I clear cache', async function (this:ICustomWorld) {
    // Goto WP Rocket dashboard
    await this.utils.gotoWpr();

    this.sections.set('dashboard');
    const cacheButton = this.page.locator('p:has-text("This action will clear") + a').first();
    await cacheButton.click();
    await expect(this.page.getByText('WP Rocket: Cache cleared.')).toBeVisible();
});

/**
 * Executes the step to visit page in a specific browser dimension.
 */
When('I visit page {string} with browser dimension {int} x {int}', async function (this:ICustomWorld, page, width, height) {
    await this.page.setViewportSize({
        width: width,
        height: height,
    });

    await this.utils.visitPage(page);
});

/**
 * Executes the step to visit scenario urls for visual regression testing in a specific browser dimension.
 */
When('I visit scenario urls', async function (this:ICustomWorld) {
    await this.page.setViewportSize({
        width: 1600,
        height: 700,
    });
    const liveUrl = SCENARIO_URLS;

    for (const key in liveUrl) {
        await this.utils.visitPage(liveUrl[key].path);
    }
});
/**
 * Executes the step to visit beacon driven page in a specific browser dimension.
 */
When('I visit beacon driven page {string} with browser dimension {int} x {int}', async function (this:ICustomWorld, page, width, height) {
    await this.page.setViewportSize({
        width: width,
        height: height,
    });

    await this.utils.visitPage(page);

    // Wait the beacon to add an attribute `beacon-complete` to true before fetching from DB.
    await this.page.waitForFunction(() => {
        const beacon = document.querySelector('[data-name="wpr-wpr-beacon"]');
        return beacon && beacon.getAttribute('beacon-completed') === 'true';
    });
});

/**
 * Executes the step to scroll to the bottom of the page.
 */
When('I scroll to bottom of page', async function (this:ICustomWorld) {
    await this.utils.scrollDownBottomOfAPage();
});

/**
 * Executes the step to change permalink structure.
 */
When('permalink structure is changed to {string}', async function (this: ICustomWorld, structure: string) {
    await this.utils.permalinkChanged(structure);
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
    await this.utils.gotoPlugin();

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
 * Executes the step to check for LRC visual regression.
 */
Then('I must not see any visual regression in scenario urls', async function (this: ICustomWorld) {
    const liveUrl = SCENARIO_URLS;

    for (const key in liveUrl) {
        await compareReference(key);
    }
});

/**
 * Executes the step to check for that there is no console error different from the nowprocket page version.
 */
Then('no error in the console different than nowprocket page {string}', async function (this: ICustomWorld, path: string) {
    const consoleMsg1 = await getConsoleMsg(this.page, `${WP_BASE_URL}/${path}?nowprocket`);
    const consoleMsg2 = await getConsoleMsg(this.page, `${WP_BASE_URL}/${path}`);

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

/**
 * Executes the step to assert that page navigation.
 */
Then('page navigated to the new page {string}', async function (this: ICustomWorld, path) {
    const url = `${WP_BASE_URL}/${path}`;
    const regex = new RegExp(url);
    await expect(this.page).toHaveURL(regex);
});

/**
 * Executes the step to deactivate a specified WP plugin via CLI.
 */
Given('plugin {word} is deactivated', async function (plugin) {
    await deactivatePlugin(plugin)
});

/**
 * Executes the step to install a WP plugin from a remote url via CLI.
 */
Given('I install plugin {string}', async function (pluginUrl) {
    await installRemotePlugin(pluginUrl)
});