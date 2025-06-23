/**
 * @fileoverview
 * This module contains Cucumber step definitions using Playwright for deleting the WP Rocket plugin.
 * It includes steps for confirming the deletion, navigating to the plugins page, deactivating the plugin,
 * handling deactivation modal, initiating the deletion process, and asserting successful deletion.
 *
 * @requires {@link ../../common/custom-world}
 * @requires {@link @playwright/test}
 * @requires {@link @cucumber/cucumber}
 */
import { ICustomWorld } from '../../common/custom-world';
import { expect } from '@playwright/test';
import { When, Then } from '@cucumber/cucumber';

/**
 * Executes the step to delete the WP Rocket plugin.
 */
When('I delete backwpup plugin', async function (this: ICustomWorld) {
    // Goto plugins page.
    await this.utils.gotoPlugin();

    // Ensure WPR is deactivated.
    await this.utils.togglePluginActivation('backwpup-pro', false);

    // Check for deactivation modal.
    if (await this.page.locator('label[for=deactivate]').isVisible()) {
        await this.page.locator('label[for=deactivate]').click();
        await this.page.locator('text=Confirm').click();
    }

    // Delete WPR.
    await this.utils.removeBackWpViaUi();
});

/**
 * Executes the step to assert successful deletion of the BackWPup plugin.
 */
Then(
    'backwpup should delete successfully',
    async function (this: ICustomWorld) {
        // Assert that BackWPup is deleted successfully
        await this.page.waitForSelector('#backwpup-pro-deleted');
        await expect(this.page.locator('#backwpup-pro-deleted')).toBeVisible();
    }
);
