/**
 * @fileoverview
 * This module contains Cucumber step definitions using Playwright for various actions and assertions related to WordPress (WP) and WP Rocket plugin.
 * It includes steps for managing WP accounts, activating and interacting with plugins, handling banners, refreshing pages, saving options, turning on specific settings,
 * navigating to pages, connecting as a user, and performing cleanup after all scenarios are executed.
 *
 * @requires {@link @playwright/test}
 * @requires {@link @cucumber/cucumber}
 * @requires {@link ../../../utils/commands}
 * @requires {@link ../../../utils/configurations}
 */
import {expect} from "@playwright/test";
import {AfterAll, BeforeAll} from "@cucumber/cucumber";
import wp, {
    activatePlugin,
    cp,
    generateUsers,
    resetWP,
    rm,
    setTransient
} from "../../../utils/commands";
import {configurations, getWPDir} from "../../../utils/configurations";
import {match} from "ts-pattern";

const { Given, When, Then } = require("@cucumber/cucumber");

/**
 * Executes the step to set up a WP account based on the provided status.
 */
Given('I have an {word} account', { timeout: 60 * 1000 }, async function (status) {


    const expiration = "unexpired" === status ? Date.now() + 9999999999 : Date.now() - 9999999999;

    if("unexpired" === status) {
        return
    }

    await setTransient('wp_rocket_customer_data', JSON.stringify({
        'ID' : 1,
        'firstname' : 'Rocket',
        'email' : 'example@example.org',
        'date_created' : '0',
        'licence_account' : -1,
        'licence_version' : '3.12.3',
        'licence_expiration' : expiration,
        'consumer_key' : '012345678',
        'is_blocked' : false,
        'is_staggered' : false,
        'has_auto_renew' : false,
        'status' : "active",
        'has_one-com_account' : false,
        'renewal_url' : 'https://example.org/renewal',
        'upgrade_plus_url' : 'https://example.org/upgrade_plus_url',
        'upgrade_infinite_url' : 'https://example.org/upgrade_infinite_url'
    }).replaceAll('"', '\\"')
        .replaceAll('}', '\\}'))

    await this.page.reload();
});

/**
 * Executes the step to activate a specified WP plugin.
 */
Given('plugin {word} is activated', async function (plugin) {
    await activatePlugin(plugin)
});

/**
 * Executes the step to assert the visibility of a banner with specific text.
 */
Then('I must see the banner {string}', async function (text) {
    await expect(this.page.getByText(text)).toBeVisible();
});

/**
 * Executes the step to click on an element with specific text.
 */
When('click on {string}', function (text) {
    this.page.getByText(text).click();
});

/**
 * Executes the step to assert the non-visibility of a banner with specific text.
 */
Then('I must not see the banner {string}', async function (text) {
    await expect(this.page.getByText(text)).not.toBeVisible();
});

/**
 * Executes the step to refresh the current page.
 */
When(/^refresh the page$/, async function () {
    await this.page.reload();
});

/**
 * Executes the step to save the options on the page.
 */
When(/^save the option$/, async function () {
    await this.page.click('#wpr-options-submit', {force: true})
});

/**
 * Executes the step to turn on a specific setting.
 */
When('turn on {string}', async function (option) {

    const optionName = match(option)
        .with('CPCSS', () => 'cpcss')
        .otherwise(() => 'rucss')

    this.sections.set('fileOptimization');
    await this.sections.state(true);
    await this.sections.toggle(optionName);
    await this.page.click('#wpr-options-submit', {force: true})
});

/**
 * Executes the step to navigate to a specific URL.
 */
When('I go {string}', async function (url) {
    await this.page.goto(`${configurations.baseUrl}${url}`);
});

/**
 * Executes the step to connect as a specific user.
 */
When('I connect as {string}', async function (user) {
    await this.utils.wpAdminLogout();
    await this.utils.auth(user);
});

/**
 * Executes the step to navigate to a specific page.
 */
Given('I am on the page {string}', {timeout: 10 * 1000} , async function (url) {
    await this.page.goto(`${configurations.baseUrl}${url}`);
});