import { test, expect } from '@playwright/test';

/**
 * Local deps.
 */
import { pageUtils } from '../../utils/page.utils';
import { cache as Cache } from '../common/sections/cache';
import { save_settings } from '../../utils/helpers';
import { fileOptimization } from '../common/sections/file.optimization';
import { media as Media } from '../common/sections/media';
import { preload as Preload } from '../common/sections/preload';
import { database as Database } from '../common/sections/database';
import { cdn as Cdn } from '../common/sections/cdn';
import { heartbeat as Heartbeat } from '../common/sections/heartbeat';
import { addons as Addons } from '../common/sections/addons';

const deletePlugin = () => {
    test('Should successfully delete the plugin', async ( { page } ) => {
    
        const page_utils = new pageUtils(page);
        const cache = new Cache(page);
        const fileOpt = new fileOptimization( page );
        const media = new Media( page );
        const preload = new Preload( page );
        const database = new Database( page );
        const cdn = new Cdn( page );
        const heartbeat = new Heartbeat( page );
        const addons = new Addons( page );

        const locator = {
            'delete': page.locator( '#delete-wp-rocket' ),
            'select_deactivate': page.locator( 'label[for=deactivate]' ),
        };

        // Confirm Dialog Box.
        page.on('dialog', async(dialog) => {
            expect(dialog.type()).toContain('confirm');
            expect(dialog.message()).toContain('Are you sure you want to delete WP Rocket and its data?');
            await dialog.accept();
        })
        // Remove WPR
        await removePlugin(page_utils, locator, page);
        // Check that there is no related error in debug.log
        await expect(page.locator('#wpr_debug_log_notice')).toBeHidden();

        // Upload WPR Zip Archive to start second phase of test
        await page_utils.upload_new_plugin('./plugin/wp-rocket_3.13.1.zip');
        await expect(page).toHaveURL(/action\=upload\-plugin/);      

        // 2nd test Phase

        // Activate WPR
        await page.waitForSelector('a:has-text("Activate Plugin")');
        await page.locator('a:has-text("Activate Plugin")').click();

        /**
         * Enable all settings and save, 
         * then deactivate.
         */
        await page_utils.goto_wpr();

        await page.waitForLoadState('load', { timeout: 30000 });

        // Enable all settings for cache section.
        await cache.visit();
        await cache.toggleEnableAll(true);
        await save_settings(page);

        await page.waitForLoadState('load', { timeout: 30000 });

        // Enable all settings for file optimization section.
        await fileOpt.visit();
        await fileOpt.toggleEnableAll(true);
        await save_settings(page);

        await page.waitForLoadState('load', { timeout: 30000 });

        // Enable all settings for Media section.
        await media.visit();
        await media.toggleEnableAll(true);
        await save_settings(page);

        await page.waitForLoadState('load', { timeout: 30000 });

        // Enable all settings for Preload section.
        await preload.visit();
        await preload.toggleEnableAll(true);
        await save_settings(page);

        await page.waitForLoadState('load', { timeout: 30000 });

        // Enable all settings for Database.
        await database.visit();
        await database.toggleEnableAll(true);
        await page.getByRole('button', { name: 'Save Changes and Optimize' }).click();

        await page.waitForLoadState('load', { timeout: 30000 });

         // Enable all settings for CDN.
         await cdn.visit();
         await cdn.toggleEnableAll(true);
         await save_settings(page);

         await page.waitForLoadState('load', { timeout: 30000 });

         // Enable all settings for Heartbeat.
         await heartbeat.visit();
         await heartbeat.toggleEnableAll(true);
         await save_settings(page);

         await page.waitForLoadState('load', { timeout: 30000 });

         // Enable all settings for Addons.
         await addons.visit();
         await addons.toggleEnableAll(true);

         // Remove WPR
        await removePlugin(page_utils, locator, page);

         // Reload plugins page.
        await page_utils.goto_plugin();
        
        // Check that there is no related error in debug.log
        await expect(page.locator('#wpr_debug_log_notice')).toBeHidden();
    });
}

const removePlugin = async (page_utils, locator, page) => {
    // Goto plugins page.
    await page_utils.goto_plugin();

    // Ensure WPR is deactivated.
    await page_utils.toggle_plugin_activation('wp-rocket', false);

    // Check for deactivation modal.
    if (await locator.select_deactivate.isVisible()) {
        await locator.select_deactivate.click();
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