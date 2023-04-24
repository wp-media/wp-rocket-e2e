import { test as setup } from '@playwright/test';

/**
 * Local deps.
 */
import { WP_BASE_URL } from '../config/wp.config';
import { pageUtils } from '../utils/page.utils';

const authFile = './config/storageState.json';

setup('authenticate', async ({ page }) => {
  const page_utils = new pageUtils( page );

  await page_utils.visit_page('wp-admin');
  await page_utils.wp_admin_login();
  // Wait until the page receives the cookies.
  //
  // Sometimes login flow sets cookies in the process of several redirects.
  // Wait for the final URL to ensure that the cookies are actually set.
  await page.waitForURL(WP_BASE_URL + '/wp-admin/');

  // End of authentication steps.
  await page.context().storageState({ path: authFile });
});