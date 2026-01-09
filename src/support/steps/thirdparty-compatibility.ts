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
    try {
        await this.utils.gotoCloudflare();

        const { email, apiKey } = CLOUDFLARE_INFOS;

        if (typeof email !== 'string' || email.trim() === '' || typeof apiKey !== 'string' || apiKey.trim() === '') {
            throw new Error('Cloudflare credentials not configured. Please set CLOUDFLARE_INFOS.email and CLOUDFLARE_INFOS.apiKey in wp.config.ts.');
        }

        await expect(this.page.locator('[href="#/login"]')).toBeVisible({ timeout: 30000 });
        await this.page.locator('[href="#/login"]').click();

        await this.page.locator('[name="email"]').fill(email);
        await this.page.locator('[name="apiKey"]').fill(apiKey);
        await this.page.locator('button[type="submit"]').click();

        // Verify that page navigated to Cloudflare settings page
        await expect(this.page).toHaveURL(`${WP_BASE_URL}/wp-admin/options-general.php?page=cloudflare#/home`);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to set up Cloudflare: ${errorMessage}`);
    }
});