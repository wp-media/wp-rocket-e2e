/**
 * @fileoverview
 * This file contains a Playwright test script for deactivating WP Rocket in a WordPress admin environment.
 * It utilizes Playwright's testing framework and custom utility functions.
 *
 * @typedef {import('@playwright/test').expect} expect
 * @typedef {import('@playwright/test').Page} Page
 * @typedef {import('../../config/wp.config').WP_BASE_URL} WP_BASE_URL
 * @typedef {import('../../utils/page.utils').pageUtils} pageUtils
 *
 * @param {Page} page - The Playwright page instance.
 */
import { expect, Page } from '@playwright/test';

/**
 * Local dependencies.
 */
import { WP_BASE_URL } from '../../config/wp.config';
import { pageUtils } from '../../utils/page.utils';

/**
 * Function to handle deactivation modal for WP Rocket.
 *
 * @function
 * @async
 * @param {Page} page - The Playwright page instance.
 * @returns {Promise<void>}
 */
export const deactivationModal = async (page: Page) => {
  const page_utils = new pageUtils(page);

  const locator = {
      'deactivate': page.locator( '[aria-label="Deactivate WP Rocket"]' ),
      'safe_mode': page.locator( '#safe_mode' ),
  };

  await page_utils.visit_page( 'wp-admin' );

  await page.waitForSelector( page_utils.selectors.plugins )
  // Expect plugins link to be in view.
  await expect( page_utils.locators.plugin ).toBeVisible();

  // Navigate to plugins page.
  await page_utils.goto_plugin();
  await expect( page ).toHaveURL( WP_BASE_URL + '/wp-admin/plugins.php' );

  // Expect WPR to be active: Deactivate link to be visible.
  await expect( locator.deactivate ).toBeVisible();
  await locator.deactivate.click();

  // Expect Deactivation Modal to be visible
  await expect( locator.safe_mode ).toBeVisible();
}









