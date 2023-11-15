/**
 * @fileOverview Safe Mode Test Suite
 * @module SafeMode
 * @requires {@link https://github.com/microsoft/playwright/blob/main/docs/test.md @playwright/test}
 * @requires ../common/safe.mode.disabled.options
 * @requires ../common/deactivation.modal
 * @requires ../common/safe.mode.disabled.options.check
 */

import { test, expect } from '@playwright/test';

/**
 * Local dependencies.
 */
import { toggleSafeModeDisabledOptions } from '../common/safe.mode.disabled.options';
import { deactivationModal } from '../common/deactivation.modal';
import { checkDisabledOptions } from '../common/safe.mode.disabled.options.check';

/**
 * Represents the Safe Mode test suite.
 * @function
 */
const safeMode = () => {
    test('should disable specific options on safe mode', async ( { page } ) => {
    /**
     * Test case to disable specific options on safe mode.
     * @memberOf SafeMode
     * @async
     * @param {Object} context - Playwright browser context.
     */

        await page.goto('/wp-admin/options-general.php?page=wprocket#dashboard');

        // Enable safe mode disabled options.
        await toggleSafeModeDisabledOptions( page );

        const locator = page.locator('#setting-error-settings_updated');
        await expect(locator).toContainText('Settings saved');

        // Engage Deactivation Modal
        await deactivationModal( page );

        // Check #safe_mode
        await page.locator('#safe_mode').check();
        await page.locator( 'label[for=export_settings]' ).click();
        await page.locator('text=Confirm').click();

        await page.goto('/wp-admin/options-general.php?page=wprocket#dashboard');

        const check_options = await checkDisabledOptions(page);
        expect(check_options).toBeFalsy();
    });
}

export default safeMode;