/**
 * @fileoverview
 * This module contains Query Monitor compatibility step definitions for WP Rocket activation.
 *
 * @requires {@link ../../common/custom-world}
 * @requires {@link @cucumber/cucumber}
 * @requires {@link @playwright/test}
 * @requires {@link ../../../utils/commands}
 */
import { Given, Then } from '@cucumber/cucumber';
import { ICustomWorld } from '../../common/custom-world';
import {
    activatePlugin,
    installRemotePlugin,
    isPluginInstalled,
    wpWithOutput,
} from '../../../utils/commands';

/**
 * Ensures WordPress core is on the latest version
 */
Given('WP is latest WP', async function (this: ICustomWorld) {
    const result = await wpWithOutput('core update');
    // Acceptable outcomes: already at latest, or successfully updated
    const success = !result.failed 
        || result.stdout.includes('WordPress is up to date')
        || result.stdout.includes('Success');
    if (!success) {
        throw new Error(`Failed to update WordPress core: ${result.stderr}`);
    }
});

/**
 * Ensures Query Monitor plugin is installed and active
 */
Given('Query monitor is active', async function (this: ICustomWorld) {
    const isInstalled = await isPluginInstalled('query-monitor');
    if (!isInstalled) {
        await installRemotePlugin('https://downloads.wordpress.org/plugin/query-monitor.latest-stable.zip');
    }
    await activatePlugin('query-monitor');
});

/**
 * Opens Query Monitor toolbar panel in wp-admin
 *
 * @return {Promise<void>}
 */
const openQueryMonitorToolbar = async function (this: ICustomWorld): Promise<void> {
    await this.utils.gotoWpr();
    await this.page.waitForLoadState('load', { timeout: 30000 });

    const qmToolbar = this.page.locator('#wp-admin-bar-query-monitor');
    await qmToolbar.waitFor({ state: 'visible', timeout: 10000 });

    await qmToolbar.locator('a.ab-item').first().click();

    // Wait for QM to render its panel container in the DOM (may remain visually hidden)
    const qmMain = this.page.locator('#query-monitor-main');
    await qmMain.waitFor({ state: 'attached', timeout: 10000 });
};

/**
 * Verifies Query Monitor has no WP Rocket related entries in the PHP errors panel
 */
Then('no PHP error in query monitor about WPR', async function (this: ICustomWorld) {
    await openQueryMonitorToolbar.call(this);

    // QM renders a hidden panel; expand it to make it accessible to Playwright
    const qmPanel = this.page.locator('#qm-php_errors');
    const panelExists = await qmPanel.count() > 0;
    if (!panelExists) {
        return; // No PHP errors panel = no errors
    }

    const errorText = await qmPanel.textContent();
    const wprRelated = errorText?.includes('/plugins/wp-rocket/') 
        || errorText?.includes('WP_Rocket');

    if (wprRelated) {
        throw new Error(`PHP errors from WP Rocket found in Query Monitor:\n${errorText}`);
    }
});

/**
 * Verifies Query Monitor has no WP Rocket related entries in the doing_it_wrong panel
 */
Then('no doing it wrong for WPR', async function (this: ICustomWorld) {
    await openQueryMonitorToolbar.call(this);

    const qmPanel = this.page.locator('#qm-doing_it_wrong');
    const panelExists = await qmPanel.count() > 0;
    if (!panelExists) {
        return; // No doing_it_wrong panel = no notices
    }

    const noticeText = await qmPanel.textContent();
    const wprRelated = noticeText?.includes('/plugins/wp-rocket/') 
        || noticeText?.includes('WP_Rocket');

    if (wprRelated) {
        throw new Error(`doing_it_wrong notices from WP Rocket found in Query Monitor:\n${noticeText}`);
    }
});