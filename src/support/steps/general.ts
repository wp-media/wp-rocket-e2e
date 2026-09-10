/**
 * @fileoverview
 * This module contains Cucumber step definitions using Playwright for various actions and assertions related to WP Rocket.
 * It includes steps for logging in, installing, activating, logging out, visiting pages, clicking buttons, enabling settings,
 * creating references, checking for specific text, debugging, and cleaning up.
 *
 * @requires {@link ../../common/custom-world}
 * @requires {@link @playwright/test}
 * @requires {@link @cucumber/cucumber}
 * @requires {@link ../../../config/wp.config}
 * @requires {@link ../../../utils/helpers}
 */
import { expect } from "@playwright/test";
import { ICustomWorld } from "../../common/custom-world";

import { Given, When, Then } from '@cucumber/cucumber';
import {WP_BASE_URL} from '../../../config/wp.config';
import scenarioUrls from "./../../../config/scenarioUrls.json";
import { compareReference, isTagPresent, getScenarioTag, batchUpdateVRTestUrl} from "../../../utils/helpers";
import type { Section } from "../../../utils/types";
import { getConsoleMsg, getConsoleMsgWithMenuExpansion } from '../../../utils/page-utils';
import {
    deactivatePlugin, installRemotePlugin, wpWithOutput,switchTheme
} from "../../../utils/commands";
import backstop from 'backstopjs';

/**
 * Executes the step to log in.
 */
Given('I am logged in', async function (this: ICustomWorld) {
    await this.utils.auth();
});

/**
 * Executes the step to install the WP Rocket plugin.
 */
Given('plugin is installed {string}', async function (this: ICustomWorld, pluginVersion: string) {
    await this.utils.uploadNewPlugin(`./plugin/${pluginVersion}.zip`);
    await expect(this.page).toHaveURL(/action=upload-plugin/); 
});


/**
 * Executests the step to update WP Rocket plugin.
 */
Given('I updated plugin to {string}', async function (this: ICustomWorld, pluginVersion: string) {
    await this.utils.uploadNewPlugin(`./plugin/${pluginVersion}.zip`);
    await this.page.waitForLoadState('load', { timeout: 30000 });
    await expect(this.page).toHaveURL(/action=upload-plugin/); 
    
    // Replace current with uploaded
    await this.page.locator('a:has-text("Replace current with uploaded")').click();
    await this.page.waitForLoadState('load', { timeout: 30000 });
});

/**
 * Executes the step to activate the WP Rocket plugin.
 */
Given('plugin is activated', async function (this: ICustomWorld) {
    // Activate WPR
    await this.page.waitForSelector('a:has-text("Activate Plugin")');
    await this.page.locator('a:has-text("Activate Plugin")').click();

    // Wait for the activation request itself to finish server-side before doing
    // anything else. Steps that follow this one (e.g. "theme is activated via
    // WP-CLI") bootstrap WordPress independently over SSH; if that bootstrap's
    // `init` runs while the activation redirect is still being processed, both
    // requests can call WP Rocket's table-install logic concurrently and one of
    // them logs a spurious "table already exists" error to debug.log.
    await this.page.waitForLoadState('load', { timeout: 30000 });

    // Activation schedules WP Rocket's preload cron 1 minute out. Scenarios in this
    // suite reinstall the plugin fresh on every iteration, so if that event is still
    // pending when the pseudo-cron fires mid-reinstall, it races the plugin's own
    // file/table (re)creation and throws spurious errors into debug.log (e.g. "table
    // already exists", fatal "class not found"). Clear it immediately so it never fires.
    await wpWithOutput('cron event delete rocket_preload_process_pending');
    await wpWithOutput('cron event delete rocket_preload_revert_old_failed_rows');
});

/**
 * Performs an action to save a specific WP Rocket setting/option.
 * 
 * @step
 * @param {string} section - WP Rocket Section.
 * @param {string} element - Element attributes from selectors object.
 * 
 * @example
 * Given plugin is installed
 */
Given('I save settings {string} {string}', async function (this: ICustomWorld, section: Section, element: string) {
    // If section does not exist and element is cacheLoggedUser, toggle the element in addons section.
    if (!(await this.sections.doesSectionExist(section))) {
        if (element === 'cacheLoggedUser') {
            await this.sections.set('addons').visit();
            await this.sections.state(true).toggle(element);
            return;
        }

        throw new Error(`Cannot save setting '${element}': section '${section}' does not exist on the current page.`);
    }

    await this.sections.set(section).visit();
    await this.sections.state(true).toggle(element);
    await this.utils.saveSettings();

});

/**
 * Executes the step to save all WP Rocket settings.
 */
Given('I save all settings', async function (this: ICustomWorld) {
        await this.utils.saveSettings();
});


/**
 * Executes the step to activate the WP plugin.
 */
Given('activate {string} plugin', async function (this: ICustomWorld, plugin) {
    await this.utils.gotoPlugin();
    await this.utils.togglePluginActivation(plugin);
});

/**
 * Executes the step to activate a theme.
 */
Given('theme {string} is activated', async function (this:ICustomWorld, theme) {
    await this.utils.switchThemeViaUi(theme);

    // Check tags via pickle.
    if (! await isTagPresent(this.pickle, '@delayjs')) {
        return;
    }

    // Set the THEME environment variable to the current theme.
    process.env.THEME = theme;
});

/**
 * Executes the step to activate a theme via WP-CLI
 *  NOTE: We use WP-CLI-based theme activation (switchTheme) instead of UI-based switching (switchThemeViaUi)
 *  because it is faster and more reliable for automated tests. This approach may not trigger all the same
 *  WordPress hooks or actions as switching via the admin UI, but for this scenario, only the active theme
 *  state is required. If UI-specific side effects are needed, consider using the UI-based method instead.
 */
Given('theme {string} is activated via WP-CLI', async function (this:ICustomWorld, theme: string) {
    await switchTheme(theme);

    // Check tags via pickle.
    if (! await isTagPresent(this.pickle, '@delayjs')) {
        return;
    }

    // Set the THEME environment variable to the current theme.
    process.env.THEME = theme;
});

/**
 * Executes the step to generate visual regression reference via backstopjs.
 */
Given('visual regression reference is generated', async function (this:ICustomWorld) {
    return; // Skip VR tests.
    const tags = this.pickle.tags.map(tag => tag.name);
    const tag: string = await getScenarioTag(tags);
    
    // Array of tags to exclude from one time reference generation.
    const exclusion = [
        '@delayjs'
    ]

    // Bail out if there is already reference for the current tag.
    if (process.env.scenario_tag === tag && !exclusion.includes(tag)) {
        return;
    }

    try {
        await batchUpdateVRTestUrl({
            optimize: false,
            urls: scenarioUrls[tag]
        });
        await backstop('reference');
        // Update test url request page with wprocket optimizations.
        await batchUpdateVRTestUrl({
            optimize: true,
            urls: scenarioUrls[tag]
        });
    } catch (error) {
        console.error('Backstop reference generation failed: ', error.message);
    }

    process.env.scenario_tag = tag;
});

/**
 * Clear wpr cache
 */
Given('clear wpr cache', async function (this: ICustomWorld) {
    await this.utils.clearWPRCache();
});

/**
 * Executes the step to deactivate a specified WP plugin via CLI.
 */
Given('plugin {word} is deactivated', async function (plugin) {
    await deactivatePlugin(plugin)
});

/**
 * Executes the step to install a WP plugin from a remote url via CLI.
 */
Given('I install plugin {string}', async function (pluginUrl) {
    await installRemotePlugin(pluginUrl)
});

/**
 * Ensures WordPress core is latest stable or newer.
 * Fails only when current version is lower than latest stable.
 * Allows prerelease/dev builds (RC, beta, dev) as long as they're >= latest stable numeric release.
 */
Given('WordPress core is up to date', async function (): Promise<void> {
    const currentResult = await wpWithOutput('core version');
    if (currentResult.failed) {
        throw new Error(
            `Failed to read current WordPress version via "wp core version".` +
            `\nSTDOUT:\n${currentResult.stdout}\nSTDERR:\n${currentResult.stderr}`
        );
    }

    const current = (currentResult.stdout ?? '').trim();
    if (!current) {
        throw new Error(
            `Current WordPress version is empty.` +
            `\nSTDOUT:\n${currentResult.stdout}\nSTDERR:\n${currentResult.stderr}`
        );
    }

    const updatesResult = await wpWithOutput("core check-update --field=version");
    if (updatesResult.failed) {
        throw new Error(
            `Failed to check available WordPress updates via "wp core check-update --field=version".` +
            `\nSTDOUT:\n${updatesResult.stdout}\nSTDERR:\n${updatesResult.stderr}`
        );
    }

    const latestStable = (updatesResult.stdout ?? '')
        .split('\n')
        .map(v => v.trim())
        .filter(v => v && !v.includes('-'))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
        .pop();

    if (!latestStable) return;

    const compare = await wpWithOutput(
        `eval "echo version_compare('${current.replace(/'/g, "\\'")}', '${latestStable.replace(/'/g, "\\'")}', '>=') ? '1' : '0';"`
    );

    if (compare.failed) {
        throw new Error(
            `Failed to compare WordPress core version against latest stable.` +
            `\nCurrent: ${current}\nLatest stable: ${latestStable}` +
            `\nComparison STDOUT:\n${compare.stdout}` +
            `\nComparison STDERR:\n${compare.stderr}`
        );
    }

    if ((compare.stdout ?? '').trim() !== '1') {
        throw new Error(
            `WordPress core is below the latest stable version.` +
            `\nCurrent: ${current}\nLatest stable: ${latestStable}` +
            `\nComparison STDOUT:\n${compare.stdout}` +
            `\nComparison STDERR:\n${compare.stderr}`
        );
    }
});

/**
 * Executes the step to visit a specific page.
 */
When('I go to {string}', async function (this: ICustomWorld, page) {
    await this.utils.visitPage(page);
});

/**
 * Executes the step to click on a specific button.
 */
When('I click on {string}', async function (this: ICustomWorld, selector) {
    if (selector === 'a[href*="action=rocket_rollback"]') {
        /**
         * Save WP Rocket last major version.
         */
        // Navigate to helper plugin page.
        await this.utils.gotoHelper();
        // Go to tools tab
        await this.page.locator('#tools_tab').click();
        await this.page.waitForSelector('#save_last_major_version');
        await this.page.locator('#save_last_major_version').click();
        await this.utils.gotoWpr();
        await this.page.locator('#wpr-nav-tools').click();
        await this.page.locator(selector).click();
        await this.page.waitForLoadState('load', { timeout: 70000 });
    }
    else{
        await this.page.locator(selector).click();
    }
    
});

/**
 * Executes the step to click on an element with specific text and wait for network requests to complete.
 * This step is useful when clicking triggers AJAX requests or network activity that needs to complete
 * before proceeding to the next step.
 * 
 * @param {string} text - The text content of the element to click on
 * 
 * @remarks
 * - Uses Playwright's text-based selector to find clickable elements
 * - Waits for 'networkidle' state (no network requests for 500ms) after clicking
 * - Ideal for dismiss actions, form submissions, or AJAX-heavy interactions
 * - More reliable than simple click when network activity is expected
 * 
 * @see {@link https://playwright.dev/docs/api/class-page#page-wait-for-load-state|waitForLoadState}
 */
When('I click on {string} and wait for request', async function (this: ICustomWorld, text: string) {
    await this.page.getByText(text).click();
    await this.page.waitForLoadState('networkidle');
});

/**
 * Executes the step to enable all settings.
 */
When('I enable all settings', async function (this: ICustomWorld) {
    /**
     * Enable all settings and save, 
     */
    await this.utils.enableAllOptions();
});

/**
 * Executes the step to log out.
 */
When('I log out', async function (this: ICustomWorld) {
    await this.utils.wpAdminLogout();
});

/**
 * Executes the step to visit the site URL.
 */
When('I visit site url', async function (this: ICustomWorld) {
    await this.page.goto(WP_BASE_URL);
});

/**
 * Executes the step visit a page in mobile view.
 */
When('I visit {string} in mobile view', async function (this:ICustomWorld, page) {
    await this.page.setViewportSize({
        width: 500,
        height: 480,
    });

    await this.utils.visitPage(page);
});



/**
 * Executes the step to expand mobile menu and validate no console error compared to nowprocket
 */
When('expand mobile menu and validate no console error nor warning', async function (this:ICustomWorld) {
    const theme = process.env.THEME ? process.env.THEME : '';

    // Get console messages when expanding menu on both versions
    const consoleMsg2 = await getConsoleMsgWithMenuExpansion(this.page, `${WP_BASE_URL}/`);
    const consoleMsg1 = await getConsoleMsgWithMenuExpansion(this.page, `${WP_BASE_URL}/?nowprocket`);
    
    // Compare console messages
    try {
        const uniqueMsg1 = [...new Set(consoleMsg1)].sort();
        const uniqueMsg2 = [...new Set(consoleMsg2)].sort();
        expect(uniqueMsg2).toEqual(uniqueMsg1);
    } catch (e) {
        throw new Error(
            `\x1b[41m\x1b[37mConsole difference detected when expanding mobile menu for theme '${theme}'\x1b[0m\n` +
            `nowprocket console: ${consoleMsg1}\nactual console: ${consoleMsg2}`
        );
    }
});
When('I clear cache', async function (this:ICustomWorld) {
    // Goto WP Rocket dashboard
    await this.utils.gotoWpr();

    this.sections.set('dashboard');

    const cacheButton = this.page.getByRole('link', { name: 'Clear and preload' });
    await cacheButton.click();

    await expect(this.page.getByText('WP Rocket: Cache cleared.')).toBeVisible();
});

/**
 * Executes the step to visit page in a specific browser dimension.
 */
When('I visit page {string} with browser dimension {int} x {int}', async function (this:ICustomWorld, page, width, height) {
    await this.page.setViewportSize({
        width: width,
        height: height,
    });

    await this.utils.visitPage(page);
});

/**
 * Executes the step to visit scenario urls for visual regression testing in a specific browser dimension.
 */
When('I visit scenario urls', async function (this:ICustomWorld) {
    await this.page.setViewportSize({
        width: 1600,
        height: 700,
    });
    const tags = this.pickle.tags.map(tag => tag.name);
    const tag: string = await getScenarioTag(tags);
    const liveUrl = scenarioUrls[tag];

    for (const key in liveUrl) {

        await this.page.goto(`${WP_BASE_URL}/${liveUrl[key].path}`,{
          waitUntil: 'load', 
          timeout: 90000 // Fixes #213 , if page loads fast, it won't wait the 90s
        }); 
    }
});
/**
 * Executes the step to visit beacon driven page in a specific browser dimension.
 */
When('I visit beacon driven page {string} with browser dimension {int} x {int}', async function (this:ICustomWorld, page, width, height) {
    await this.page.setViewportSize({
        width: width,
        height: height,
    });

    await this.utils.visitPage(page);

    // Wait the beacon to add an attribute `beacon-complete` to true before fetching from DB.
    await this.page.waitForFunction(() => {
        const beacon = document.querySelector('[data-name="wpr-wpr-beacon"]');
        return beacon && beacon.getAttribute('beacon-completed') === 'true';
    });
});

/**
 * Executes the step to scroll to the bottom of the page.
 */
When('I scroll to bottom of page', async function (this:ICustomWorld) {
    await this.utils.scrollDownBottomOfAPage();
});

/**
 * Executes the step to change permalink structure.
 */
When('permalink structure is changed to {string}', async function (this: ICustomWorld, structure: string) {
    await this.utils.permalinkChanged(structure);
});

When('I enable option', async function (this: ICustomWorld) {
    // If section does not exist and element is cacheLoggedUser, toggle the element in addons section.
    if (!(await this.sections.doesSectionExist(this.wprSection))) {
        if (this.wprOption === 'cacheLoggedUser') {
            await this.sections.set('addons').visit();
            await this.sections.state(true).toggle(this.wprOption);
        }

        return;
    }   

    await this.sections.set(this.wprSection).visit();
    await this.sections.state(true).toggle(this.wprOption);
    await this.utils.saveSettings();

});
/**
 * Executes the step to assert the presence of specific text.
 */
Then('I should see {string}', async function (this: ICustomWorld, text) {
    await expect(this.page.getByText(text)).toBeVisible();
});

/**
 * Executes the step to check for errors in debug.log.
 */
Then('I must not see any error in debug.log', async function (this: ICustomWorld){
    // Goto WP Rocket dashboard
    await this.utils.gotoPlugin();

    // Assert that there is no related error in debug.log
    await expect(this.page.locator('#wpr_debug_log_notice')).toBeHidden();
});

/**
 * Executes the step to clean up WP Rocket.
 */
Then('clean up', async function (this: ICustomWorld) {
    await this.utils.cleanUp();
});

/**
 * Executes the step to check for visual regression.
 */
Then('I must not see any visual regression {string}', async function (this: ICustomWorld, label: string) {
    return; // Skip VR tests.
    await compareReference(label);
});

/**
 * Executes the step to check for LRC visual regression.
 */
Then('I must not see any visual regression in scenario urls', async function (this: ICustomWorld) {
    return; // Skip VR tests.
    const tags = this.pickle.tags.map(tag => tag.name);
    const tag: string = await getScenarioTag(tags);
    const liveUrl = scenarioUrls[tag];

    for (const key in liveUrl) {
        await compareReference(key);
    }
});

/**
 * Executes the step to check for that there is no console error different from the nowprocket page version.
 */
Then('no error nor warning in the console different than nowprocket page {string}', async function (this: ICustomWorld, path: string) {
    const consoleMsg1 = await getConsoleMsg(this.page, `${WP_BASE_URL}/${path}?nowprocket`);
    const consoleMsg2 = await getConsoleMsg(this.page, `${WP_BASE_URL}/${path}`);

    if (consoleMsg2.length !== 0) {
         try {
                // Get unique messages from both versions
                const uniqueMsg1 = [...new Set(consoleMsg1)].sort();
                const uniqueMsg2 = [...new Set(consoleMsg2)].sort();

                // Fail only when the actual (cached/optimized) page logs a message that isn't
                // present on the nowprocket baseline. A message present on nowprocket but
                // missing from actual is not a regression introduced by WP Rocket.
                const newMessages = uniqueMsg2.filter((msg) => !uniqueMsg1.includes(msg));
                expect(newMessages).toEqual([]);
            } catch (e) {
                throw new Error(
                    `\x1b[41m\x1b[37mConsole difference detected for: ${WP_BASE_URL}/${path}\x1b[0m\n` +
                    `nowprocket console: ${consoleMsg1}\nactual console: ${consoleMsg2}`
                );
            }
    }
});


/**
 * Executes the step to assert that page navigation.
 */
Then('page navigated to the new page {string}', async function (this: ICustomWorld, path) {
    const url = `${WP_BASE_URL}/${path}`;
    const regex = new RegExp(url);
    await expect(this.page).toHaveURL(regex);
});