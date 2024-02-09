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
import { When } from '@cucumber/cucumber';

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
 * Executes the step to save url format to directory for wpml.
 */
When('save directory url format', async function (this:ICustomWorld) {
    await this.page.getByText('Different languages in directories ( (https://e2e.rocketlabsqa.ovh/ - English, h').click();
    await this.page.locator('#icl_save_language_negotiation_type').getByRole('button', { name: 'Save' }).click();
});