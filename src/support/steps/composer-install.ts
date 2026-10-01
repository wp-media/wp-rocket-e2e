/**
 * @fileoverview
 * This module contains Cucumber step definitions for installing WP Rocket with a site-level Composer
 * install under the default "stable" minimum-stability (regression for wp-rocket#7812, where WP Rocket
 * required berlindb/core@dev-master).
 *
 * Composer runs on the server from the WordPress root with a composer.json matching the one used for
 * the manual test. The PHP version only changes the PHP CLI running Composer, not the PHP serving the site.
 *
 * @requires {@link ../../common/custom-world}
 * @requires {@link @playwright/test}
 * @requires {@link @cucumber/cucumber}
 * @requires {@link ../../../utils/commands}
 */
import { ICustomWorld } from "../../common/custom-world";
import { expect } from "@playwright/test";
import { Given, When, Then } from '@cucumber/cucumber';
import { execOnServer, isPluginActive, isPluginInstalled, readFile, rm, uninstallPlugin, writeFile } from "../../../utils/commands";
import { WP_SSH_ROOT_DIR } from "../../../config/wp.config";

/**
 * Name of the generated root package, used to recognize a composer.json written by these tests.
 */
export const COMPOSER_PROJECT_NAME = 'rocketlabsqa/wpr-e2e-composer-install';

/**
 * WP Rocket version constraint. The explicit stability flag lets Composer pick WP Rocket pre-releases
 * (the release being tested is tagged as a beta on Packagist) while every dependency must stay stable.
 */
const WPR_CONSTRAINT = process.env.E2E_WPR_COMPOSER_CONSTRAINT || '^3.22.1-alpha2';

/**
 * Composer release used to run the install, and where it is stored on the server.
 */
const COMPOSER_PHAR_URL = 'https://getcomposer.org/download/latest-stable/composer.phar';
const COMPOSER_PHAR = '/tmp/wpr-e2e-composer.phar';

/**
 * Output that means Composer did not complete cleanly, even with a zero exit code.
 */
const COMPOSER_ERRORS = /Your requirements could not be resolved|Problem \d+|PHP (?:Fatal error|Warning|Deprecated)|\[[\w\\]*Exception\]/;

/**
 * Executes the step to make sure WP Rocket isn't installed, so Composer installs it from scratch.
 */
Given('WP Rocket is not installed', async function (this: ICustomWorld) {
    await uninstallPlugin('wp-rocket');
    // Composer refuses to install over leftovers, e.g. a vendor folder from a previous run.
    await rm(`${WP_SSH_ROOT_DIR}wp-content/plugins/wp-rocket`);
});

/**
 * Executes the step to install WP Rocket with `composer update` from the WordPress root.
 */
When('I install WP Rocket with Composer using {string}', async function (this: ICustomWorld, php: string) {
    const existing = await readFile(`${WP_SSH_ROOT_DIR}composer.json`);
    if (existing !== '' && !existing.includes(COMPOSER_PROJECT_NAME)) {
        throw new Error('The site already has a composer.json at its root, refusing to overwrite it.');
    }

    const phpCheck = await execOnServer(`command -v ${php}`);
    if (phpCheck.code !== 0) {
        throw new Error(`${php} is not available on the server.`);
    }

    await writeFile(`${WP_SSH_ROOT_DIR}composer.json`, `{
    "name": "${COMPOSER_PROJECT_NAME}",
    "type": "project",
    "minimum-stability": "stable",
    "prefer-stable": true,
    "require": {
        "composer/installers": "^2.0",
        "wp-media/wp-rocket": "${WPR_CONSTRAINT}",
        "symfony/css-selector": "^5.4"
    },
    "extra": {
        "installer-paths": {
            "wp-content/plugins/{$name}/": ["type:wordpress-plugin"]
        }
    },
    "config": {
        "vendor-dir": "wp-content/plugins/wp-rocket/vendor",
        "allow-plugins": {
            "composer/installers": true
        }
    }
}
`);
    await rm(`${WP_SSH_ROOT_DIR}composer.lock`);

    // Use the official self-contained phar rather than the server's composer: distro packages
    // can depend on system libraries that don't run on older PHP versions.
    const download = await execOnServer(`curl -fsSL ${COMPOSER_PHAR_URL} -o ${COMPOSER_PHAR} && echo "$(curl -fsSL ${COMPOSER_PHAR_URL}.sha256)  ${COMPOSER_PHAR}" | sha256sum -c -`);
    if (download.code !== 0) {
        throw new Error(`Failed to download Composer:\n${download.stdout}\n${download.stderr}`);
    }

    const result = await execOnServer(`sudo chown $(id -un) composer.json && ${php} ${COMPOSER_PHAR} update --no-interaction --no-progress 2>&1`);
    this.attach(`Composer output (${php}):\n${result.stdout}`, 'text/plain');

    expect(result.code, `composer update failed with ${php}:\n${result.stdout}`).toBe(0);
    expect(result.stdout, `composer update reported errors with ${php}:\n${result.stdout}`).not.toMatch(COMPOSER_ERRORS);

    // Give the web server ownership back, so WP Rocket can be managed and deleted from the admin.
    await execOnServer('sudo chown -R www-data:www-data wp-content/plugins/wp-rocket composer.json composer.lock');

    expect(await isPluginInstalled('wp-rocket'), 'WP Rocket was not installed by Composer').toBe(true);
});

/**
 * Executes the step to assert that every locked package, except WP Rocket itself, is a stable release.
 */
Then('Composer installed only stable packages', async function (this: ICustomWorld) {
    const lock = JSON.parse(await readFile(`${WP_SSH_ROOT_DIR}composer.lock`));
    const packages: Array<{ name: string, version: string }> = lock.packages ?? [];

    const wpr = packages.find(p => p.name === 'wp-media/wp-rocket');
    expect(wpr, 'wp-media/wp-rocket is missing from composer.lock').toBeTruthy();
    this.attach(`Installed wp-media/wp-rocket ${wpr.version}`, 'text/plain');

    const unstable = packages
        .filter(p => p.name !== 'wp-media/wp-rocket')
        .filter(p => /^dev-|-dev$|-(?:alpha|beta|rc)/i.test(p.version))
        .map(p => `${p.name}@${p.version}`);

    expect(unstable, `Unstable dependencies were installed:\n${unstable.join('\n')}`).toHaveLength(0);
});

/**
 * Executes the step to activate WP Rocket from the plugins list.
 */
When('I activate WP Rocket from the plugins list', async function (this: ICustomWorld) {
    await this.utils.gotoPlugin();
    await this.utils.togglePluginActivation('wp-rocket');
    await expect(this.page.locator('#deactivate-wp-rocket')).toBeVisible({ timeout: 30000 });

    expect(await isPluginActive('wp-rocket'), 'WP Rocket is not active').toBe(true);
});

/**
 * Executes the step to assert that the WP Rocket settings page is displayed.
 */
Then('WP Rocket settings page is displayed', async function (this: ICustomWorld) {
    await expect(this.page.locator('#wpr-nav-dashboard')).toBeVisible();
    await expect(this.page.locator('#wpr-nav-tools')).toBeVisible();
});
