import { test, expect } from '../../common/fixtures';
import type { Locators } from '../../../utils/types';
import type { PageUtils } from '../../../utils/page-utils';
import type { Page } from '@playwright/test';

const deletePlugin = (): void => {
    test('Should successfully delete the plugin', async ( { page, utils } ) => {

        const locator: Locators = {
            'delete': page.locator( '#delete-wp-rocket' ),
            'selectDeactivate': page.locator( 'label[for=deactivate]' ),
        };

        // Confirm Dialog Box.
        page.on('dialog', async(dialog) => {
            expect(dialog.type()).toContain('confirm');
            expect(dialog.message()).toContain('Are you sure you want to delete WP Rocket and its data?');
            await dialog.accept();
        });

        // Install and activated wpr.
        await utils.uploadNewPlugin('./plugin/new_release.zip');
        await page.waitForLoadState('load', { timeout: 30000 });
        await expect(page).toHaveURL(/action=upload-plugin/); 

        // Remove WPR
        await removePlugin(utils, locator, page);
        // Check that there is no related error in debug.log
        await expect(page.locator('#wpr_debug_log_notice')).toBeHidden();

        // Upload WPR Zip Archive to start second phase of test
        await utils.uploadNewPlugin('./plugin/new_release.zip');
        await expect(page).toHaveURL(/action=upload-plugin/);      

        // 2nd test Phase

        // Activate WPR
        await page.waitForSelector('a:has-text("Activate Plugin")');
        await page.locator('a:has-text("Activate Plugin")').click();

        await page.waitForLoadState('load', { timeout: 30000 });

        /**
         * Enable all settings and save, 
         * then deactivate.
         */
        utils.enableAllOptions();

         // Remove WPR
        await removePlugin(utils, locator, page);

         // Reload plugins page.
        await utils.gotoPlugin();

        // Check that there is no related error in debug.log
        await expect(page.locator('#wpr_debug_log_notice')).toBeHidden();
    });
}

const removePlugin = async (utils: PageUtils, locator: Locators, page: Page): Promise<void> => {
    // Goto plugins page.
    await utils.gotoPlugin();

    // Ensure WPR is deactivated.
    await utils.togglePluginActivation('wp-rocket', false);

    // Check for deactivation modal.
    if (await locator.selectDeactivate.isVisible()) {
        await locator.selectDeactivate.click();
        await page.locator('text=Confirm').click();
    }

    await page.waitForLoadState('load', { timeout: 30000 });

    // Delete WPR.
    await locator.delete.click();

    if (await page.getByRole('button', { name: 'Yes, delete these files and data' }).isVisible()) {
        await page.getByRole('button', { name: 'Yes, delete these files and data' }).click();
        await expect(page.locator('#activate-wp-rocket')).toBeHidden();
        return;
    }

    // Check that WPR is deleted successfully
    await page.waitForSelector('#wp-rocket-deleted');
    await expect(page.locator('#wp-rocket-deleted')).toBeVisible();   
}

export default deletePlugin;