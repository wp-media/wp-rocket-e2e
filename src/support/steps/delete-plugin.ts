import { ICustomWorld } from "../../common/custom-world";
import {expect} from "@playwright/test";
import { When, Then } from '@cucumber/cucumber';

When('I delete plugin', async function (this: ICustomWorld) {

    // Confirm Dialog Box.
    this.page.on('dialog', async(dialog) => {
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

Then('plugin should delete successfully', async function (this: ICustomWorld) {
    // Assert that WPR is deleted successfully
    await this.page.waitForSelector('#wp-rocket-deleted');
    await expect(this.page.locator('#wp-rocket-deleted')).toBeVisible(); 
});