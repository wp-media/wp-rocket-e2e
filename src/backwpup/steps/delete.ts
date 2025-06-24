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
import { ICustomWorld } from "../../common/custom-world";
import { When } from '@cucumber/cucumber';

/**
 * Executes the step to delete the WP Rocket plugin.
 */
When('I delete backwpup plugin', async function (this: ICustomWorld) {

    // Goto plugins page.
    await this.utils.gotoPlugin();

    // Ensure BWU is deactivated.
    await this.utils.togglePluginActivation('backwpup-pro', false);

    // Check for deactivation modal.
    if (await this.page.locator('label[for=deactivate]').isVisible()) {
        await this.page.locator('label[for=deactivate]').click();
        await this.page.locator('text=Confirm').click();
    }

    // Delete BWU.
    await this.utils.removeBackWpViaUi();
});