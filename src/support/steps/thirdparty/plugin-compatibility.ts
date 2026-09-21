import { Given, When } from '@cucumber/cucumber';

import { ICustomWorld } from "../../../common/custom-world";
import { WP_BASE_URL } from "../../../../config/wp.config";
import { activatePlugin, installRemotePlugin, isPluginInstalled } from "../../../../utils/commands";

/**
 * Installs (if needed) and activates a free, WordPress.org-hosted plugin via WP-CLI,
 * tracking it on the World so the matching @plugin-compatibility After hook can
 * deactivate/remove it once the scenario ends.
 */
Given('the {string} plugin is installed and activated', async function (this: ICustomWorld, plugin: string) {
    if (!(await isPluginInstalled(plugin))) {
        await installRemotePlugin(plugin);
    }

    // Track before activating, not after: activatePlugin() throws if the plugin fatals on
    // activation, and the After hook still needs to know what to clean up in that exact case.
    this.activatedPlugin = plugin;

    await activatePlugin(plugin);
});

/**
 * Visits a page and fails fast if it didn't load successfully (non-2xx/3xx or no response
 * at all), rather than letting a crashed/blank page fall through to "I must not see any
 * error in debug.log" - that step's #wpr_debug_log_notice locator counts a missing element
 * as hidden, so a page that failed to render at all would otherwise silently pass.
 */
When('I visit {string} and it must load successfully', async function (this: ICustomWorld, page: string) {
    const response = await this.page.goto(`${WP_BASE_URL}/${page}`);

    if (!response || !response.ok()) {
        throw new Error(
            `Page '${page}' did not load successfully after activating '${this.activatedPlugin}' ` +
            `(HTTP ${response?.status() ?? 'no response'}). This usually means the plugin caused a fatal error.`
        );
    }
});
