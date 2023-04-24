import { test, expect } from '@playwright/test';

/**
 * Local deps.
 */
import { pageUtils } from '../../utils/page.utils';

const deletePlugin = () => {
    test('Should successfully delete the plugin', async ( { page } ) => {
    
        const page_utils = new pageUtils( page );
 
        await page_utils.visit_page('wp-admin');
        await page_utils.goto_plugin();

        const locator = {
            'delete': page.locator( '#delete-wp-rocket' )
        };

        // With WPR deactivated, Delete WPR
        await page_utils.toggle_plugin_activation('wp-rocket', false);
        await locator.delete.click();

        // Check that WPR is deactivated
        await expect(page.locator('#activate-wp-rocket')).toBeHidden();
        // Check that there is no related error in debug.log
        await expect(page.locator('#wpr_debug_log_notice')).toBeHidden();

        // Upload WPR Zip Archive and Activate
        await page_utils.upload_new_plugin('../plugin/wp-rocket.zip');
        // Enable all settings and save, then deactivate.
    });
}

export default deletePlugin;