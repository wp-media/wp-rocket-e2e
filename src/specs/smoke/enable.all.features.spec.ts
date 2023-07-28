import { test, expect } from '../../common/fixtures';

/**
 * Local deps.
 */
import { WP_BASE_URL } from '../../../config/wp.config';

const enableAllFeatures = (): void => {
    test('Enabling all WP Rocket features should not throw any fatal errors', async ( { page, utils } ) => {

        // Install and activated wpr.
        await utils.uploadNewPlugin('./plugin/new_release.zip');
        await page.waitForLoadState('load', { timeout: 30000 });

        if (await page.locator('a:has-text("Activate Plugin")').isHidden()) {
            await page.locator('a:has-text("Replace current with uploaded")').click();
        } else {
            await page.locator('a:has-text("Activate Plugin")').click();
        }

        await page.waitForLoadState('load', { timeout: 30000 });

        /**
         * Enable all settings and save, 
         * then deactivate.
         */
        utils.enableAllOptions();

         // visit the site url
         await utils.wpAdminLogout();

         await page.waitForLoadState('load', { timeout: 30000 });

        page.on('response', async (response) => {
            expect(response.status()).not.toEqual(500);
            expect(response.status()).not.toEqual(404);
        });

        await page.goto(WP_BASE_URL);
        await utils.auth();

         // Navigate to helper plugin.
        await utils.gotoHelper();

        // Check that there is no related error in debug.log
        await expect(page.locator('#wpr_debug_log_notice')).toBeHidden();
    });
}

export default enableAllFeatures;