import { Given } from '@cucumber/cucumber';
import { expect } from '@playwright/test';

import { ICustomWorld } from "../../common/custom-world";
import { CLOUDFLARE_INFOS, WP_BASE_URL } from "../../../config/wp.config";

/**
 * Sets up Cloudflare by logging in with the configured credentials.
 *
 * @param {ICustomWorld} this - The custom Cucumber World instance providing page and utilities.
 * @return {Promise<void>} - A Promise that resolves when Cloudflare has been set up.
 */
Given ('Cloudflare is set up', async function (this: ICustomWorld) {
    await this.utils.gotoCloudflare();

    await expect(this.page.locator('[href="#/login"]')).toBeVisible({ timeout: 30000 });
    await this.page.locator('[href="#/login"]').click();

    await this.page.locator('[name="email"]').fill(CLOUDFLARE_INFOS.email);
    await this.page.locator('[name="apiKey"]').fill(CLOUDFLARE_INFOS.apiKey);
    await this.page.locator('button[type="submit"]').click();

    // Verify that page navigated to Cloudflare settings page
    await expect(this.page).toHaveURL(`${WP_BASE_URL}/wp-admin/options-general.php?page=cloudflare#/home`);
});