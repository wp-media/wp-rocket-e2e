/**
 * @fileoverview
 * This module contains Cucumber step definitions for checking that WP Rocket's cron events
 * don't trigger "Cron unschedule event error" entries in debug.log (wp-rocket#7797).
 *
 * WordPress logs these errors from wp-cron.php itself, so the steps below drive cron through
 * real HTTP requests (page visits and wp-cron.php) rather than WP-CLI's cron runner.
 *
 * @requires {@link ../../common/custom-world}
 * @requires {@link @playwright/test}
 * @requires {@link @cucumber/cucumber}
 * @requires {@link ../../../utils/commands}
 */
import { ICustomWorld } from "../../common/custom-world";
import { Browser, expect } from "@playwright/test";
import { Given, When, Then } from '@cucumber/cucumber';
import { randomBytes } from 'node:crypto';
import { WP_BASE_URL, WP_SSH_ROOT_DIR } from "../../../config/wp.config";
import { readFile, wpWithOutput } from "../../../utils/commands";

/**
 * Login of the subscriber created for the logged-in visits. Removed in the After hook.
 */
export const CRON_SUBSCRIBER = 'e2e-cron-subscriber';

/**
 * Matches the errors WordPress logs when it fails to unschedule/reschedule a WP Rocket cron event, e.g.
 * "Cron unschedule event error for hook: rocket_saas_pending_jobs, Error code: could_not_set, ...".
 */
const WPR_CRON_ERROR = /Cron (?:un|re)schedule event error for hook: rocket_[^\n]*/g;

// Preload goes through Action Scheduler at roughly 15 URLs per minute on the e2e sites.
const PRELOAD_TIMEOUT = Number(process.env.E2E_PRELOAD_TIMEOUT_MS) || 30 * 60 * 1000;
const PRELOAD_POLL_INTERVAL = 30 * 1000;

const debugLogPath = `${WP_SSH_ROOT_DIR}wp-content/debug.log`;

/**
 * Returns the debug.log lines written since the scenario checkpoint.
 *
 * @param {ICustomWorld} world - The Cucumber world.
 * @return {Promise<string>} The new debug.log contents.
 */
const getNewDebugLogContents = async (world: ICustomWorld): Promise<string> => {
    const contents = await readFile(debugLogPath);
    const offset = world.debugLogOffset ?? 0;

    // The log was removed or rotated since the checkpoint: everything in it is new.
    if (contents.length < offset) {
        return contents;
    }

    return contents.slice(offset);
}

/**
 * Returns a few published front-end URLs to visit.
 *
 * @return {Promise<string[]>} The URLs.
 */
const getSomeUrls = async (): Promise<string[]> => {
    const result = await wpWithOutput('post list --post_type=post --post_status=publish --posts_per_page=4 --field=url');
    const urls = result.stdout.split('\n').map(url => url.trim()).filter(url => url.startsWith('http'));

    return [WP_BASE_URL, ...urls];
}

/**
 * Reads the preload state in a single WP-CLI call, to keep SSH connections low while polling.
 *
 * @return {Promise<{running: boolean, unfinished: number}>} Whether WP Rocket flags preload as running, and the number of pending or in-progress rows.
 */
const getPreloadState = async (): Promise<{running: boolean, unfinished: number}> => {
    // WP Rocket sets this transient when the initial preload starts and deletes it once nothing is left to preload.
    const result = await wpWithOutput(`eval 'global $wpdb; echo get_transient( "wpr_preload_running" ) ? 1 : 0, " ", $wpdb->get_var( "SELECT COUNT(*) FROM {$wpdb->prefix}wpr_rocket_cache WHERE status IN (\\"pending\\", \\"in-progress\\")" );'`);
    const [running, unfinished] = result.stdout.trim().split(/\s+/).map(value => parseInt(value, 10));

    if (result.failed || isNaN(running) || isNaN(unfinished)) {
        throw new Error(`Could not read the preload state:\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`);
    }

    return { running: running === 1, unfinished };
}

/**
 * Executes the step to remember where debug.log ends, so later checks only look at what this scenario logged.
 */
Given('debug.log is checkpointed', async function (this: ICustomWorld) {
    this.debugLogOffset = (await readFile(debugLogPath)).length;
});

/**
 * Executes the step to assert that WordPress logged no cron (un)schedule error for a WP Rocket hook.
 */
Then('I must not see cron event errors for WP Rocket hooks in debug.log', async function (this: ICustomWorld) {
    const errors = (await getNewDebugLogContents(this)).match(WPR_CRON_ERROR) ?? [];

    expect(errors, `Cron event errors for WP Rocket hooks found in debug.log:\n${errors.join('\n')}`).toHaveLength(0);
});

/**
 * Executes the step to wait until preload has processed every URL.
 * wp-cron.php is requested on every poll, like visitor traffic would do, to keep cron running.
 */
When('preload is finished', { timeout: PRELOAD_TIMEOUT + 5 * 60 * 1000 }, async function (this: ICustomWorld) {
    const deadline = Date.now() + PRELOAD_TIMEOUT;
    let started = false;
    let state = await getPreloadState();

    // Rows completed early (e.g. the homepage) don't mean the sitemap URLs were processed: wait for preload to have started.
    while (!started || state.running || state.unfinished > 0) {
        started = started || state.running || state.unfinished > 0;

        if (Date.now() > deadline) {
            throw new Error(`Preload did not finish within ${PRELOAD_TIMEOUT / 1000}s: ${state.unfinished} URLs still pending or in progress.`);
        }

        await this.page.request.get(`${WP_BASE_URL}/wp-cron.php?doing_wp_cron`, { timeout: 60000 });
        await this.page.waitForTimeout(PRELOAD_POLL_INTERVAL);
        state = await getPreloadState();
    }
});

/**
 * Executes the step to clear priority elements from the WP Rocket admin bar menu.
 */
When('I clear priority elements', async function (this: ICustomWorld) {
    await this.utils.gotoWpr();

    const href = await this.page.locator('#wp-admin-bar-clear-performance-hints a').getAttribute('href');
    expect(href, 'Clear Priority Elements is missing from the admin bar').toBeTruthy();

    await this.page.goto(href);
    await this.page.waitForLoadState('load', { timeout: 30000 });
});

/**
 * Executes the step to visit some pages in a fresh, logged-out browser context.
 */
When('I visit some pages as a visitor', async function (this: ICustomWorld) {
    const context = await this.context.browser().newContext();

    try {
        const page = await context.newPage();
        for (const url of await getSomeUrls()) {
            await page.goto(url);
            await page.waitForLoadState('load', { timeout: 30000 });
        }
    } finally {
        await context.close();
    }
});

/**
 * Executes the step to visit some pages as a subscriber logged in from another browser context.
 */
When('I visit some pages as a logged in subscriber', async function (this: ICustomWorld) {
    const password = randomBytes(12).toString('hex');

    // Recreate the subscriber so its password is known, whatever a previous run left behind.
    await wpWithOutput(`user delete ${CRON_SUBSCRIBER} --yes`);
    const created = await wpWithOutput(`user create ${CRON_SUBSCRIBER} ${CRON_SUBSCRIBER}@example.org --role=subscriber --user_pass=${password}`);
    if (created.failed) {
        throw new Error(`Failed to create the subscriber:\n${created.stderr}`);
    }

    const browser: Browser = this.context.browser();
    const context = await browser.newContext();

    try {
        const page = await context.newPage();
        await page.goto(`${WP_BASE_URL}/wp-login.php`);
        await page.locator('#user_login').fill(CRON_SUBSCRIBER);
        await page.locator('#user_pass').fill(password);
        await page.locator('#wp-submit').click();
        await expect(page.locator('#loginform')).toBeHidden({ timeout: 30000 });

        for (const url of await getSomeUrls()) {
            await page.goto(url);
            await page.waitForLoadState('load', { timeout: 30000 });
        }
    } finally {
        await context.close();
    }
});
