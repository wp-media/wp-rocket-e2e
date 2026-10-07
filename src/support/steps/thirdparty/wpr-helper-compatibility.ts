import { Given } from '@cucumber/cucumber';

import { ICustomWorld } from "../../../common/custom-world";
import { activatePlugin, wpWithOutput } from "../../../../utils/commands";

/**
 * Activates a WP Rocket helper plugin that is pre-installed on the e2e environment, tracking it
 * on the World so the matching @wpr-helper-compatibility After hook can deactivate it.
 *
 * Unlike 'the {string} plugin is installed and activated', this never deletes or installs: helpers
 * are not on WordPress.org, so a delete + reinstall would leave the helper gone until the
 * environment is re-provisioned.
 */
Given('the WP Rocket helper {string} is pre-installed and activated', async function (this: ICustomWorld, plugin: string) {
    // Not isPluginInstalled(): it bootstraps without --skip-plugins, so any plugin fataling on
    // every bootstrap would make it report "not installed". --skip-plugins keeps the check reliable.
    const installed = await wpWithOutput(`plugin is-installed ${plugin} --skip-plugins=${plugin}`);

    // Only 0 (installed) and 1 (not installed) are answers. Anything else, e.g. 255 when WPR or
    // another still-loaded plugin fatals during WP-CLI bootstrap, means the check itself crashed:
    // surface it here instead of letting activatePlugin() fail with a confusing error.
    if (installed.code !== 0 && installed.code !== 1) {
        throw new Error(
            `Could not check whether WP Rocket helper "${plugin}" is installed: WP-CLI exited with ` +
            `code ${installed.code}. stderr: ${installed.stderr || '(empty)'}`
        );
    }

    if (installed.failed) {
        throw new Error(
            `WP Rocket helper "${plugin}" is not installed. Helpers are not on WordPress.org: ` +
            `it must be pre-installed (inactive) on the e2e environment.`
        );
    }

    // Track before activating, not after: activatePlugin() throws if the plugin fatals on
    // activation, and the After hook still needs to know what to clean up in that exact case.
    this.activatedPlugin = plugin;

    await activatePlugin(plugin);
});
