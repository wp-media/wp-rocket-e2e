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