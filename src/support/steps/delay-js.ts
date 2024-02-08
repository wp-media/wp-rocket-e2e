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

When('switch language', async function (this:ICustomWorld) {
    await this.page.getByRole('link', { name: 'العربية (Arabic)' }).click();
});

When('I click on link', async function (this:ICustomWorld) {
    await this.page.getByRole('link', { name: 'About Us' }).click()
});