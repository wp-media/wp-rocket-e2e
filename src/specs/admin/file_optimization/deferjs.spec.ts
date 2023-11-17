/**
 * @fileoverview Test for displaying the Defer JS UI.
 * @requires {@link @playwright/test}
 * @requires {@link ../../../utils/page.utils}
 * @requires {@link ../../common/sections/file.optimization}
 */
import { test, expect } from '@playwright/test';

/**
 * Local dependencies.
 */
import { pageUtils } from '../../../utils/page.utils';
import { fileOptimization } from '../../common/sections/file.optimization';

/**
 * Test for displaying the Defer JS UI.
 */
const deferJs = () => {
    test('Should display the Defer JS UI', async ( { page } ) => {
        /**
         * Utility instance for page operations.
         * @type {pageUtils}
         */
        const page_utils = new pageUtils( page );

        /**
         * Instance for file optimization section.
         * @type {fileOptimization}
         */
        const fileOpt = new fileOptimization( page );

        /**
         * Text area selector for defer JS exclusion.
         * @type {string}
         */
        let txtarea = '#exclude_defer_js';

        // Visit WPR settings
        await page_utils.goto_wpr();

        // Goto file optimization section
        await fileOpt.visit();

        // Assert that deferjs exclusion textarea is not visible.
        await expect(page.locator(txtarea)).not.toBeVisible();

        // Check defer js option
        await fileOpt.toggleDeferJs();

        // Assert that deferjs exclusion textarea is now visible.
        await expect(page.locator(txtarea)).toBeVisible();

        // Uncheck defer js option
        await fileOpt.toggleDeferJs();

        // Assert that deferjs exclusion textarea is no longer visible.
        await expect(page.locator(txtarea)).not.toBeVisible();
    });
}

export default deferJs;