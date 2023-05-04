import { test, expect, chromium } from '@playwright/test';

/**
 * Local deps.
 */
import { WP_BASE_URL } from '../../config/wp.config';
import { pageUtils } from '../../utils/page.utils';
import { save_settings } from '../../utils/helpers';

import { cache as Cache } from '../common/sections/cache';
import { fileOptimization } from '../common/sections/file.optimization';
import { media as Media } from '../common/sections/media';
import { preload as Preload } from '../common/sections/preload';
import { advancedRules } from '../common/sections/advanced.rules';
import { database as Database } from '../common/sections/database';
import { cdn as Cdn } from '../common/sections/cdn';
import { heartbeat as Heartbeat } from '../common/sections/heartbeat';
import { addons as Addons } from '../common/sections/addons';

const enableAllFeatures = () => {
    test('Enabling all WP Rocket features should not throw any fatal errors', async ( { page } ) => {
    
        const page_utils = new pageUtils(page);
        const cache = new Cache(page);
        const fileOpt = new fileOptimization(page);
        const media = new Media(page);
        const preload = new Preload(page);
        const advanced_rules = new advancedRules(page);
        const database = new Database( page );
        const cdn = new Cdn(page);
        const heartbeat = new Heartbeat(page);
        const addons = new Addons(page);

        // Install and activated wpr.
        await page_utils.upload_new_plugin('./plugin/new_release.zip');
        await page.waitForLoadState('load', { timeout: 30000 });

        if (await page.locator('a:has-text("Activate Plugin")').isHidden()) {
            await page.locator('a:has-text("Replace current with uploaded")').click();
        } else {
            await page.locator('a:has-text("Activate Plugin")').click();
        }

        /**
         * Enable all settings and save, 
         * then deactivate.
         */
        await page_utils.goto_wpr();

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

        // Advanced rules section.
        await advanced_rules.visit();
        await advanced_rules.addRule('cache_reject_uri', '/test\n/.*\n/test2');
        await advanced_rules.addRule('cache_reject_cookies', 'woocommerce_items_in_cart');
        await advanced_rules.addRule('cache_reject_ua', 'Mobile(.*)Safari(.*)');
        await advanced_rules.addRule('cache_purge_pages', '/hello-world/');
        await advanced_rules.addRule('cache_query_strings', 'country');
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

         // visit the site url
         await page_utils.wp_admin_logout();

        page.on('response', async (response) => {
            expect(response.status()).not.toEqual(500);
            expect(response.status()).not.toEqual(404);
        });

        await page.goto(WP_BASE_URL);
        await page_utils.auth();

         // Navigate to helper plugin.
        await page_utils.goto_helper();

        // Check that there is no related error in debug.log
        await expect(page.locator('#wpr_debug_log_notice')).toBeHidden();
    });
}

export default enableAllFeatures;