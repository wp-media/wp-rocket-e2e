/**
 * @fileoverview
 * This module contains Cucumber step definitions using Playwright for cache-related assertions,
 * relying on the e2e test helper plugin's Cache tab to observe whether the homepage cache file
 * exists and whether it was preserved (not regenerated) across an admin request.
 *
 * @requires {@link ../../common/custom-world}
 * @requires {@link @playwright/test}
 * @requires {@link @cucumber/cucumber}
 */
import { expect } from "@playwright/test";
import { ICustomWorld } from "../../common/custom-world";
import { Then, When } from '@cucumber/cucumber';

/**
 * Executes the step to refresh the WP Rocket settings page.
 */
When('I refresh WP Rocket settings', async function (this: ICustomWorld) {
    await this.utils.gotoWpr();
});

/**
 * Executes the step to assert that the homepage cache file exists.
 */
Then('homepage cache should exist', async function (this: ICustomWorld) {
    // Navigate to helper plugin page.
    await this.utils.gotoHelper();
    // Go to cache tab
    await this.page.locator('#cache_tab').click();
    await expect(this.page.getByText('Cached', { exact: true })).toBeVisible();
});

/**
 * Executes the step to assert that the homepage cache was not regenerated.
 */
Then('homepage cache should not be regenerated', async function (this: ICustomWorld) {
    // Navigate to helper plugin page.
    await this.utils.gotoHelper();
    // Go to cache tab
    await this.page.locator('#cache_tab').click();
    await expect(this.page.locator('#should_not_regenerate_cache_on_admin_refresh')).toHaveText(/Preserved/);
});
