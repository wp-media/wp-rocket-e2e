/**
 * @fileoverview
 * This file defines Playwright test cases for deactivating WP Rocket in WP admin.
 *
 * @typedef {import('@playwright/test').Page} Page - Playwright Page type.
 * @typedef {import('@playwright/test').TestArgs} TestArgs - Playwright TestArgs type.
 *
 * @function
 * @name deactivation
 * @description Test case to ensure successful deactivation of WP Rocket.
 */

import { test, expect } from '@playwright/test';

/**
 * Local dependencies.
 */
import { file_exist } from '../../utils/helpers';
import { pageUtils } from '../../utils/page.utils';

let config_file_exist:boolean = false;

/**
 * Test case: Should deactivate WP Rocket successfully.
 */
const deactivation = () => {
    test('should deactivate WP Rocket successfully', async ( { page } ) => {
    
        const page_utils = new pageUtils( page );
 
    /**
     * @function
     * @name deactivation.ShouldDeactivateWPRSuccessfully
     * @description Test case to ensure successful deactivation of WP Rocket.
     */
        await page_utils.visit_page('wp-admin');
        await page_utils.goto_plugin();

        const locator = {
            'deactivate': page.locator( '[aria-label="Deactivate WP Rocket"]' ),
            'select_deactivate': page.locator( 'label[for=deactivate]' ),
        };

        // Deactivate WP Rocket.
        await locator.deactivate.click();

        await locator.select_deactivate.click();
        await page.locator('text=Confirm').click();
        
        if (await page.locator('a:has-text("Force deactivation")').isVisible()) {
            // Force deactivation - No .Htaccess file.
            await page.locator('a:has-text("Force deactivation")').click();
        }

        // Check deactivation notification.
        await expect(page.locator('text=Plugin deactivated.')).toBeVisible();

        config_file_exist = await file_exist('wp-content/wp-rocket-config/localhost.php');
        expect(config_file_exist).toBeFalsy();
    });
}

export default deactivation;