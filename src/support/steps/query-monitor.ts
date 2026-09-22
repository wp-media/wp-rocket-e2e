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
    isPluginInstalled,
    wpWithOutput,
} from '../../../utils/commands';

/**
 * Ensures Query Monitor plugin is installed and active
 */
Given('Query monitor is active', async function (this: ICustomWorld): Promise<void>  {
    const isInstalled = await isPluginInstalled('query-monitor');
    if (!isInstalled) {
        const result = await wpWithOutput('plugin install query-monitor');
        if (result.failed) {
            throw new Error(
                `Failed to install Query Monitor via "wp plugin install query-monitor".` +
                `\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`
            );
        }
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
 * Verifies Query Monitor shows no WP Rocket errors or warnings
 */
Then('Query monitor shows no WP Rocket errors or warnings', async function (this: ICustomWorld): Promise<void>  {
    await openQueryMonitorToolbar.call(this);

    const issues: string[] = [];

    // Check PHP errors panel
    const phpErrorPanel = this.page.locator('#qm-php_errors');
    const phpErrorExists = await phpErrorPanel.count() > 0;
    if (phpErrorExists) {
        const errorText = await phpErrorPanel.textContent();
        const wprRelated = (errorText?.includes('/plugins/wp-rocket/') 
            || errorText?.includes('WP_Rocket'))
        if (wprRelated) {
            issues.push(`PHP errors from WP Rocket:\n${errorText}`);
        }
    }

    // Check doing_it_wrong panel
    const doingWrongPanel = this.page.locator('#qm-doing_it_wrong');
    const doingWrongExists = await doingWrongPanel.count() > 0;
    if (doingWrongExists) {
        const noticeText = await doingWrongPanel.textContent();
        const wprRelated = noticeText?.includes('/plugins/wp-rocket/') 
            || noticeText?.includes('WP_Rocket');
        if (wprRelated) {
            issues.push(`doing_it_wrong notices from WP Rocket:\n${noticeText}`);
        }
    }

    if (issues.length > 0) {
        throw new Error(`Query Monitor detected WP Rocket issues:\n\n${issues.join('\n\n')}`);
    }
});