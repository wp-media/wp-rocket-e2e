/**
 * @fileoverview
 * This module contains Cucumber step definitions using Playwright for various actions related to updating and downgrading the WP Rocket plugin.
 * It includes steps for installing a specific plugin version, opening a beacon, updating to the latest version, going through the beacon, and downgrading to the last stable version.
 *
 * @requires {@link ../../common/custom-world}
 * @requires {@link @playwright/test}
 * @requires {@link @cucumber/cucumber}
 */
import { ICustomWorld } from "../../common/custom-world";
import { Given, When, Then } from '@cucumber/cucumber';
import { ConsoleMessage, expect } from '@playwright/test';
import { exec } from 'shelljs';
import { WP_BASE_URL } from '../../../config/wp.config';
import { cp, execOnServer, isPluginActive, writeFile, wpWithOutput } from '../../../utils/commands';

/**
 * Where the update package is served from, relative to the WordPress root.
 */
export const UPDATE_PACKAGE_DIR = 'wp-content/uploads/wpr-e2e-update';

/**
 * The mu-plugin that answers WP Rocket's update check, relative to the WordPress root.
 */
export const UPDATE_MOCK_MU_PLUGIN = 'wp-content/mu-plugins/wpr-e2e-mock-update.php';

/**
 * Compares two release versions numerically, e.g. 3.23.4.1 < 3.23.5.
 *
 * @param {string} a - First version.
 * @param {string} b - Second version.
 * @return {number} Negative if a < b, positive if a > b, 0 if equal.
 */
const compareVersions = (a: string, b: string): number => {
    const partsA = a.split(/[.-]/).map(part => parseInt(part, 10) || 0);
    const partsB = b.split(/[.-]/).map(part => parseInt(part, 10) || 0);

    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
        const diff = (partsA[i] ?? 0) - (partsB[i] ?? 0);
        if (diff !== 0) {
            return diff;
        }
    }

    return 0;
}

/**
 * Executes the step to open the RUCSS beacon.
 */
Given('rucss beacon is opened', async function (this: ICustomWorld) {
    // Open file optimization section.
    this.sections.set("fileOptimization");

    // Enable Optimize CSS delivery option.
    await this.sections.state(true).toggle("rucss");

    await this.page.locator('iframe[title="Help Scout Beacon - Open"]').waitFor();
    await this.page.locator('a[data-beacon-article="6076083ff8c0ef2d98df1f97"]').click();

    await this.page.waitForSelector('iframe[title="Help Scout Beacon - Live Chat, Contact Form, and Knowledge Base"]');
});

/**
 * Verifies that the Help Scout Beacon loads properly and displays content.
 * This step ensures the beacon iframe opens and shows at least one article,
 * without depending on specific article content that may change externally.
 * 
 * @example
 * ```gherkin
 * When I go through rucss beacon
 * ```
 */
When('I go through rucss beacon', async function (this: ICustomWorld) {
	const iframe = this.page.frameLocator('iframe[title="Help Scout Beacon - Live Chat, Contact Form, and Knowledge Base"]');

	// Wait for the iframe content to load
	await iframe.locator('.InstantAnswerscss__WrapperUI-sc-v14wxf-0, .c-ArticleCard').first().waitFor();

	// Verify that at least one article is displayed (beacon is working)
	const articleCards = iframe.locator('.c-ArticleCard');
	const count = await articleCards.count();
	expect(count).toBeGreaterThan(0);

	await this.utils.gotoWpr();
	await this.page.waitForLoadState('load', { timeout: 30000 });
});

/**
 * Reads the WP Rocket version from a plugin zip in ./plugin.
 *
 * @param {string} pluginVersion - The zip name, e.g. 'new_release'.
 * @return {string} The plugin version.
 */
const getZipVersion = (pluginVersion: string): string => {
    const header = exec(`unzip -p ./plugin/${pluginVersion}.zip wp-rocket/wp-rocket.php`, { silent: true }).stdout;
    const version = header.match(/^\s*\*\s*Version:\s*(\S+)/m)?.[1];

    if (!version) {
        throw new Error(`Could not read the WP Rocket version from ./plugin/${pluginVersion}.zip`);
    }

    return version;
}

/**
 * Executes the step to make WP Rocket's update check offer a local zip as the new version.
 * The zip is served from the site itself, and an mu-plugin answers the update check with it,
 * the same way the manual test uses a snippet. Both are removed in the After hook.
 */
Given('{string} is offered as a WP Rocket update', async function (this: ICustomWorld, pluginVersion: string) {
    const version = getZipVersion(pluginVersion);
    const installedVersion = (await wpWithOutput('plugin get wp-rocket --field=version')).stdout.trim();

    // version_compare() semantics are close enough for X.Y.Z(.W) release versions.
    expect(compareVersions(installedVersion, version), `${pluginVersion} (${version}) is not newer than the installed WP Rocket (${installedVersion})`).toBeLessThan(0);

    const zipName = `wp-rocket_${version}.zip`;
    const created = await execOnServer(`sudo mkdir -p ${UPDATE_PACKAGE_DIR}`);
    if (created.code !== 0) {
        throw new Error(`Failed to create ${UPDATE_PACKAGE_DIR}:\n${created.stderr}`);
    }
    await cp(`./plugin/${pluginVersion}.zip`, `/tmp/${zipName}`);
    const moved = await execOnServer(`sudo mv /tmp/${zipName} ${UPDATE_PACKAGE_DIR}/${zipName} && sudo chown -R www-data:www-data ${UPDATE_PACKAGE_DIR}`);
    if (moved.code !== 0) {
        throw new Error(`Failed to upload ${zipName}:\n${moved.stderr}`);
    }

    const packageUrl = `${WP_BASE_URL}/${UPDATE_PACKAGE_DIR}/${zipName}`;
    await writeFile(UPDATE_MOCK_MU_PLUGIN, `<?php
// Added by wp-rocket-e2e (C22325): answers WP Rocket's update check with a local package.
add_filter( 'pre_http_request', function( $pre, $parsed_args, $url ) {
	if ( false !== strpos( $url, 'https://api.wp-rocket.me/check_update.php' ) ) {
		return [
			'headers'  => [],
			'body'     => '${version}|${packageUrl}|${version}',
			'response' => [ 'code' => 200, 'message' => 'OK' ],
			'cookies'  => [],
			'filename' => null,
		];
	}
	return $pre;
}, 10, 3 );
`);

    // Force WordPress and WP Rocket to check for updates again.
    await wpWithOutput('transient delete update_plugins --network');
    await wpWithOutput('transient delete wp_rocket_update_data --network');
});

/**
 * Executes the step to assert that the WP Rocket update banner is displayed on the plugins list.
 */
Then('I should see the WP Rocket update banner', async function (this: ICustomWorld) {
    await expect(this.page.locator('#wp-rocket-update .update-link')).toBeVisible();
});

/**
 * Executes the step to update WP Rocket by clicking the update banner, failing on WP Rocket console errors.
 */
When('I update WP Rocket from the update banner', async function (this: ICustomWorld) {
    const consoleErrors: string[] = [];
    const onConsole = (msg: ConsoleMessage): void => {
        if (msg.type() === 'error' && /rocket/i.test(msg.text())) {
            consoleErrors.push(msg.text());
        }
    };
    const onPageError = (error: Error): void => {
        if (/rocket/i.test(`${error.message}\n${error.stack}`)) {
            consoleErrors.push(error.message);
        }
    };

    this.page.on('console', onConsole);
    this.page.on('pageerror', onPageError);

    try {
        await this.page.locator('#wp-rocket-update .update-link').click();
        await expect(this.page.locator('#wp-rocket-update .updated-message')).toBeVisible({ timeout: 180000 });
        await expect(this.page.locator('#wp-rocket-update .notice-error')).toHaveCount(0);

        // Reload so WP Rocket runs its upgrade routine with the new code.
        await this.utils.gotoPlugin();
        await this.page.waitForLoadState('load', { timeout: 30000 });
    } finally {
        this.page.off('console', onConsole);
        this.page.off('pageerror', onPageError);
    }

    expect(consoleErrors, `WP Rocket console errors during the update:\n${consoleErrors.join('\n')}`).toHaveLength(0);
});

/**
 * Executes the step to assert that the installed WP Rocket version is the one from a plugin zip.
 */
Then('WP Rocket should be updated to {string}', async function (this: ICustomWorld, pluginVersion: string) {
    const installedVersion = (await wpWithOutput('plugin get wp-rocket --field=version')).stdout.trim();

    expect(installedVersion).toBe(getZipVersion(pluginVersion));
    expect(await isPluginActive('wp-rocket'), 'WP Rocket is no longer active after the update').toBe(true);
});
