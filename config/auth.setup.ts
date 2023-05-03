import { test as setup } from '@playwright/test';

/**
 * Local deps.
 */
import { WP_BASE_URL } from '../config/wp.config';
import { pageUtils } from '../utils/page.utils';

const authFile = './config/storageState.json';

setup('authenticate', async ({ page }) => {
  const page_utils = new pageUtils( page );

  await page_utils.auth();
});