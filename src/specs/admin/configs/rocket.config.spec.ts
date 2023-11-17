/**
 * @fileoverview
 * This file defines a Playwright test case for verifying the presence and status codes
 * of WP Rocket configuration file.
 *
 * @typedef {import('@playwright/test').Page} Page
 * @typedef {import('@playwright/test').TestArgs} TestArgs
 *
 * @function configFile
 * @description Test case for checking the presence and status codes of the WP Rocket configuration file.
 * @param {TestArgs} param0 - Test context object.
 */
import { test, expect } from '@playwright/test';

/**
 * Test case for verifying the presence and status codes of the WP Rocket configuration file.
 * @param {TestArgs} param0 - Test context object.
 */
const configFile = () => {
    let allowed_status = [301, 200];
    
    /**
     * Array of allowed HTTP status codes.
     * @type {number[]}
     */
    /**
     * Test: Should have config file.
     * @param {TestArgs} param1 - Test context object.
     */
    test('should have config file', async ({ page }) => {

        /**
         * Event handler for responses to check status codes.
         * @param {import('@playwright/test').Response} response - The response object.
         */
        page.on('response', async (response) => {
            expect(allowed_status).toContain(response.status());
        });

        await page.goto('/wp-content/wp-rocket-config/localhost.php');
    });
}


export default configFile;