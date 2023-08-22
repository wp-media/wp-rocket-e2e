import {expect} from "@playwright/test";
import { Given, When, Then } from '@cucumber/cucumber';
import { Dialog } from "playwright";

Given('I login', async function () {
    await this.utils.auth();
});

Given('plugin is installed', async function () {
    await this.utils.uploadNewPlugin('./plugin/new_release.zip');
    await this.page.waitForLoadState('load', { timeout: 30000 });
    await expect(this.page).toHaveURL(/action=upload-plugin/); 
});

Given('plugin is activated', async function () {
     // Activate WPR
     await this.page.waitForSelector('a:has-text("Activate Plugin")');
     await this.page.locator('a:has-text("Activate Plugin")').click();
});

When('I go to {string}', async function (page) {
    await this.utils.visitPage(page);
});

When('all settings is enabled', async function () {
    /**
     * Enable all settings and save, 
     * then deactivate.
     */
    await this.utils.enableAllOptions();
});

When('I delete plugin', async function () {
    // Confirm Dialog Box.
    this.page.on('dialog', async(dialog: Dialog) => {
        expect(dialog.type()).toContain('confirm');
        expect(dialog.message()).toContain('Are you sure you want to delete WP Rocket and its data?');
        await dialog.accept();
    });

    // Goto plugins page.
    await this.utils.gotoPlugin();

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
        return;
    }  
});

Then('plugin should delete successfully', async function () {
    // Assert that WPR is deleted successfully
    await this.page.waitForSelector('#wp-rocket-deleted');
    await expect(this.page.locator('#wp-rocket-deleted')).toBeVisible(); 
});

Then('no error in debug.log', async function (){
    // Assert that there is no related error in debug.log
    await expect(this.page.locator('#wpr_debug_log_notice')).toBeHidden();
});