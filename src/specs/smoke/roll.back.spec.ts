import { test, expect } from '../../common/fixtures';

const rollBack = (): void => {
    test('Should roll back to the last previous major version when using the roll back functionality', async ( { page, utils } ) => {

        // Upload WPR latest stable.
        await utils.uploadNewPlugin('./plugin/new_release.zip');
        await page.waitForLoadState('load', { timeout: 30000 });
        await expect(page).toHaveURL(/action=upload-plugin/); 

        // Replace current with uploaded
        await page.locator('a:has-text("Replace current with uploaded")').click();

        await page.waitForLoadState('load', { timeout: 30000 });
        await expect(page).toHaveURL(/overwrite=update-plugin/); 

        /**
         * Save WP Rocket last major version.
         */
        // Navigate to helper plugin page.
        await utils.gotoHelper();
        // Go to tools tab
        await page.locator('#tools_tab').click();
        await page.waitForSelector('#save_last_major_version');
        await page.locator('#save_last_major_version').click();
        await page.waitForLoadState('load', { timeout: 30000 });

        // Visit WPR settings page.
        await utils.gotoWpr();

        await page.locator('#wpr-nav-tools').click();
        // Click on the Reinstall Version 3.x.x.x button
        await page.locator('.wpr-tools:nth-child(4) a').click();
        await page.waitForLoadState('load', { timeout: 100000 });
        await expect(page.getByText('Plugin updated successfully.')).toBeVisible();

        // Navigate to helper plugin page.
        await utils.gotoHelper();
        // Go to tools tab
        await page.locator('#tools_tab').click();
        await page.waitForSelector('#wpr_last_major_version_equals_current');
        await expect(page.locator('#wpr_last_major_version_equals_current')).toHaveText(/Returned True/);

        // Check that there is no related error in debug.log
        await expect(page.locator('#wpr_debug_log_notice')).toBeHidden();
    });
}

export default rollBack;