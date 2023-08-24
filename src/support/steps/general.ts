import {expect} from "@playwright/test";
import { Given, When, Then } from '@cucumber/cucumber';

Given('I am logged in', async function () {
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
    await this.page.waitForLoadState('load', { timeout: 100000 });
});

When('I click on {string}', async function (button) {
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

When('I enable all settings', async function () {
    /**
     * Enable all settings and save, 
     * then deactivate.
     */
    await this.utils.enableAllOptions();
});

When('I log out', async function () {
    await this.utils.wpAdminLogout();
    await this.page.waitForLoadState('load', { timeout: 30000 });
});

Then('I should see {string}', async function (text) {
    await expect(this.page.getByText(text)).toBeVisible();
});

Then('I must not see any error in debug.log', async function (){
    // Assert that there is no related error in debug.log
    await expect(this.page.locator('#wpr_debug_log_notice')).toBeHidden();
});