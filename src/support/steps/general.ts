import { expect } from "@playwright/test";
import { ICustomWorld } from "../../common/custom-world";

import { Given, When, Then } from '@cucumber/cucumber';
import { WP_BASE_URL } from '../../../config/wp.config';
import { createReference, compareReference } from "../../../utils/helpers";

Given('I am logged in', async function (this: ICustomWorld) {
    await this.utils.auth();
});

Given('plugin is installed {string}', async function (this: ICustomWorld, pluginVersion: string) {
    await this.utils.uploadNewPlugin(`./plugin/${pluginVersion}.zip`);
    await this.page.waitForLoadState('load', { timeout: 30000 });
    await expect(this.page).toHaveURL(/action=upload-plugin/); 
});

Given('I updated plugin to {string}', async function (this: ICustomWorld, pluginVersion: string) {
    await this.utils.uploadNewPlugin(`./plugin/${pluginVersion}.zip`);
    await this.page.waitForLoadState('load', { timeout: 30000 });
    await expect(this.page).toHaveURL(/action=upload-plugin/); 
    
    // Replace current with uploaded
    await this.page.locator('a:has-text("Replace current with uploaded")').click();
    await this.page.waitForLoadState('load', { timeout: 30000 });
});

Given('plugin is activated', async function (this: ICustomWorld) {
    // Activate WPR
    await this.page.waitForSelector('a:has-text("Activate Plugin")');
    await this.page.locator('a:has-text("Activate Plugin")').click();
});

When('I log in', async function (this: ICustomWorld) {
    await this.utils.auth();
});

When('I go to {string}', async function (this: ICustomWorld, page) {
    await this.utils.visitPage(page);
    await this.page.waitForLoadState('load', { timeout: 100000 });
});

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

When('I enable all settings', async function (this: ICustomWorld) {
    /**
     * Enable all settings and save, 
     */
    await this.utils.enableAllOptions();
});

When('I log out', async function (this: ICustomWorld) {
    await this.utils.wpAdminLogout();
    await this.page.waitForLoadState('load', { timeout: 30000 });
});

When('I visit site url', async function (this: ICustomWorld) {
    await this.page.goto(WP_BASE_URL);
});

When('I create reference', async function (this:ICustomWorld) {
    if (process.env.npm_config_url === undefined) {
        return;
    }

    await createReference(process.env.npm_config_url);
});

Then('I should see {string}', async function (this: ICustomWorld, text) {
    await expect(this.page.getByText(text)).toBeVisible();
});

Then('I must not see any error in debug.log', async function (this: ICustomWorld){
    // Assert that there is no related error in debug.log
    await expect(this.page.locator('#wpr_debug_log_notice')).toBeHidden();
});

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

Then('I must not see any visual regression', async function (this: ICustomWorld) {
    await compareReference();
});