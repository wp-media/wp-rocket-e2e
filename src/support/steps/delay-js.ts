/**
 * @fileoverview
 * This module contains Cucumber step definitions using Playwright for performing actions with Delayjs option enabled on WP Rocket.
 * 
 * 
 *
 * @requires {@link ../../common/custom-world}
 * @requires {@link @cucumber/cucumber}
 */
import { ICustomWorld } from "../../common/custom-world";
import { When, Given } from '@cucumber/cucumber';

/**
 * Executes the step to move the mouse.
 */
When('move the mouse', async function (this: ICustomWorld) {
    await this.page.mouse.down();
    await this.page.mouse.up();
});

/**
 * Executes the step to click on about us link.
 */
When('I click on link', async function (this:ICustomWorld) {
    await this.page.getByRole('link', { name: 'About Us' }).click()
});

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
 * Enables "one click exclusions" for the Delay JS feature in WP Rocket by selecting all detected scripts for exclusion.
 *
 * In WP Rocket, "one click exclusions" is a UI feature under the Delay JavaScript Execution option that allows users to quickly exclude all detected JavaScript files from being delayed, improving compatibility with themes and plugins.
 *
 * This step expands the exclusions list and selects all available scripts for exclusion, then saves the settings.
 *
 * @param {ICustomWorld} this - Cucumber World context object providing Playwright page and utilities.
 * @return {Promise<void>}
 * @requires {@link ../../common/custom-world}
 * 
 */
Given('one click exclusions are enabled if exists', async function(this:ICustomWorld) {
    const exclusionHeader = '#wpr_djs_oneclick_exclusions_themes > div.wpr-list-header > div.wpr-list-header-data > span.wpr-multiple-select-title';
    const theme = process.env.THEME || 'unknown';
    
    try {
        // Scroll to the element to ensure it's visible
        try {
            await this.page.locator(exclusionHeader).scrollIntoViewIfNeeded({ timeout: 5000 });
        } catch {
            // Element doesn't exist or can't be scrolled into view
            console.log(`Theme '${theme}' does not have one-click exclusion available`);
            return;
        }
        
        // Check if the element exists
        if (await this.page.locator(exclusionHeader).isVisible()) {
            // Click on the header to expand
            await this.page.locator(exclusionHeader).click();
            
            // Toggle select all
            await this.page.locator('#wpr_djs_oneclick_exclusions_themes .wpr-select-all label').click();
            
            await this.utils.saveSettings();
        }
   
    } catch (error) {
        // Log any error encountered while setting up one-click exclusions and continue
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Error while configuring one-click exclusions for theme '${theme}': ${errorMessage}`);
    }
});

