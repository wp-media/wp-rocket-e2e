import { Given } from '@cucumber/cucumber';

import { ICustomWorld } from "../../../common/custom-world";
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
    await activatePlugin(plugin);

    this.activatedPlugin = plugin;
});
