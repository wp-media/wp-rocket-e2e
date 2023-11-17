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
import { createReference, compareReference } from "../../../utils/helpers";

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
When('I click on {string}', async function (this: ICustomWorld, button) {
    if (button === '.wpr-tools:nth-child(4) a') {
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
    await this.page.locator(button).click();
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
    if (process.env.npm_config_url === undefined) {
        return;
    }

    await createReference(process.env.npm_config_url);
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
    // Assert that there is no related error in debug.log
    await expect(this.page.locator('#wpr_debug_log_notice')).toBeHidden();
});

/**
 * Executes the step to clean up WP Rocket.
 */

Then('clean up', async function (this: ICustomWorld) {

    // Confirm Dialog Box.
    this.page.on('dialog', async(dialog) => {
        expect(dialog.type()).toContain('confirm');
        expect(dialog.message()).toContain('Are you sure you want to delete WP Rocket and its data?');
        await dialog.accept();
    });

    // Goto plugins page.
    await this.utils.gotoPlugin();

    if (!await this.page.getByRole('cell', { name: 'WP Rocket Settings | FAQ | Docs | Support | Deactivate WP Rocket' }).getByRole('strong').isVisible() && !await this.page.getByRole('cell', { name: 'Activate WP Rocket | Delete WP Rocket' }).getByRole('strong').isVisible()) {
        return;
    }

    // Ensure WPR is deactivated.
    await this.utils.togglePluginActivation('wp-rocket', false);

    // Check for deactivation modal.
    if (await this.page.locator('label[for=deactivate]').isVisible()) {
        await this.page.locator('label[for=deactivate]').click();
        await this.page.locator('text=Confirm').click();
    }

    await this.page.waitForLoadState('load', { timeout: 30000 });

    // Delete WPR.
    await this.page.locator( '#delete-wp-rocket' ).click();

    if (await this.page.getByRole('button', { name: 'Yes, delete these files and data' }).isVisible()) {
        await this.page.getByRole('button', { name: 'Yes, delete these files and data' }).click();
        await expect(this.page.locator('#activate-wp-rocket')).toBeHidden();
    }  

    // Assert that WPR is deleted successfully
    await this.page.waitForSelector('#wp-rocket-deleted');
    await expect(this.page.locator('#wp-rocket-deleted')).toBeVisible(); 
});

/**
 * Executes the step to check for visual regression.
 */
Then('I must not see any visual regression', async function (this: ICustomWorld) {
    await compareReference();
});