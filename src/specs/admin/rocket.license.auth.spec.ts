/**
 * @fileOverview Rocket License Test Suite
 * @module RocketLicense
 * @requires {@link https://github.com/microsoft/playwright/blob/main/docs/test.md @playwright/test}
 * @requires {@link ../../utils/page.utils pageUtils}
 */

import { test, expect } from '@playwright/test';

/**
 * Local dependencies.
 */
 import { pageUtils } from '../../utils/page.utils';

/**
 * Represents the Rocket License test suite.
 * @function
 */
const rocketLicense = () => {
    let page;

    /**
     * Test setup before all tests in the suite.
     * @memberOf RocketLicense
     * @async
     * @param {Object} context - Playwright browser context.
     */
    test.beforeAll(async ({ browser }) => {
        const context = await browser.newContext();
        page = await context.newPage();
        const page_utils = new pageUtils(page);

        // Activate WPR if not active.
        await page_utils.goto_plugin();
        
        if (await page.locator('#activate-wp-rocket').isVisible()) {
            await page_utils.toggle_plugin_activation('wp-rocket');
        }

        // Goto WPR settings.
        await page_utils.goto_wpr();
    });

    /**
     * Test cleanup after all tests in the suite.
     * @memberOf RocketLicense
     * @async
     * @param {Object} context - Playwright browser context.
     */
    test.afterAll(async ({ browser }) => {
        browser.close;
    });

    test( 'should validate license if customer key is correct', async () => {

    /**
     * Test case to validate license if the customer key is correct.
     * @memberOf RocketLicense
     * @async
     */
        const validate_btn = 'text=Validate License';

        const locator = {
            'validate': page.locator( validate_btn ),
            'has_license': page.locator( 'span:has-text("License")' )
        };

        if (await locator.validate.isVisible()) {
            await page.waitForSelector( validate_btn, { timeout: 5000 } )
            await expect( locator.validate ).toBeVisible();
            // Validate license
            await locator.validate.click();

            // Expect validation to be successful
            await expect(locator.has_license).toBeVisible();
            return;
        }

        // Expect validation to be successful
        await expect(locator.has_license).toBeVisible();
    });

    test( 'Should display preload trigger message on first activation', async () => {
    /**
     * Test case to display preload trigger message on the first activation.
     * @memberOf RocketLicense
     * @async
     */
        await expect(page.locator('#rocket-notice-preload-processing')).toContainText('The preload service is now active');
    });
}

export default rocketLicense;