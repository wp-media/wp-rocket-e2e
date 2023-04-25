import { test, expect } from '@playwright/test';

/**
 * Local deps.
 */
import { pageUtils } from '../../utils/page.utils';

const deletePlugin = () => {
    test('Should successfully delete the plugin', async ( { page } ) => {
    
        const page_utils = new pageUtils( page );
 
        await page_utils.goto_plugin();

        const locator = {
            'delete': page.locator( '#delete-wp-rocket' ),
            'select_deactivate': page.locator( 'label[for=deactivate]' ),
        };

        // Ensure WPR is deactivated.
        await page_utils.toggle_plugin_activation('wp-rocket', false);

        // Check for deactivation modal.
        if (await locator.select_deactivate.isVisible()) {
            await locator.select_deactivate.click();
            await page.locator('text=Confirm').click();
        }

        // Confirm Dialog Box.
        page.on('dialog', dialog => dialog.accept());

        // Delete WPR.
        await locator.delete.click();

        // Check that WPR is deactivated
        await expect(page.locator('#activate-wp-rocket')).toBeHidden();
        // Check that there is no related error in debug.log
        await expect(page.locator('#wpr_debug_log_notice')).toBeHidden();

        // Upload WPR Zip Archive and Activate
        await page_utils.upload_new_plugin('./plugin/wp-rocket.zip');
        // Enable all settings and save, then deactivate.
    });
}

export default deletePlugin;