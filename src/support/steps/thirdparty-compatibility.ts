import { ICustomWorld } from "../../common/custom-world";

import {Given } from '@cucumber/cucumber';
import { CLOUDFLARE_INFOS, WP_BASE_URL } from "../../../config/wp.config";
import {expect} from "@playwright/test";

/**
 * Deactivates and removes the Cloudflare plugin via the WordPress admin UI.
 *
 * @param {ICustomWorld} world - The custom Cucumber World instance providing page and utilities.
 * @return {Promise<void>} - A Promise that resolves when the plugin has been deactivated and removed.
 */
export async function removeCloudflareViaUi(world: ICustomWorld): Promise<void> {
    // Navigate to plugins page
    await world.utils.gotoPlugin();

    // Deactivate Cloudflare plugin
    await world.utils.togglePluginActivation('cloudflare', false);

    // Check for deactivation modal and handle it
    if (await world.page.locator('label[for=deactivate]').isVisible()) {
        await world.page.locator('label[for=deactivate]').click();
        await world.page.locator('text=Confirm').click();
    }

    await world.page.waitForLoadState('load', { timeout: 30000 });

    // Delete Cloudflare plugin
    world.page.once('dialog', async (dialog) => {
        expect(dialog.type()).toContain('confirm');
        await dialog.accept();
    });

    await world.page.locator('#delete-cloudflare').click();

   // Verify successful deletion by waiting for confirmation element
    await expect(world.page.locator('#cloudflare-deleted')).toBeVisible({ timeout: 30000 });
}



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