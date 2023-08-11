import {expect} from "@playwright/test";
import {AfterAll, BeforeAll} from "@cucumber/cucumber";
import wp, {activatePlugin, cp, generateUsers, resetWP, rm, setTransient} from "../../../utils/commands";
import {configurations, getWPDir} from "../../../utils/configurations";

const { Given, When, Then } = require("@cucumber/cucumber");
Given('I have an {word} account', { timeout: 60 * 1000 }, async function (status) {


    const expiration = "unexpired" === status ? Date.now() + 9999999999 : Date.now() - 9999999999;

    if("unexpired" === status) {
        return
    }

    setTransient('wp_rocket_customer_data', JSON.stringify({
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
    }))

    this.page.reload();
});

Given('plugin {word} is activated', function (plugin) {
   activatePlugin(plugin)
});
Given(/^I have CPCSS turned on$/, async function () {
    this.sections.set('fileOptimization');
    await this.sections.state(true);
    await this.sections.toggle('cpcss');
    await this.page.click('#wpr-options-submit', {force: true})
});
Then('I must see the banner {string}', async function (text) {
    await expect(this.page.getByText(text)).toBeVisible();
});
When('click on {string}', function (text) {
    this.page.getByText(text).click();
});
Then('I must not see the banner {string}', async function (text) {
    await expect(this.page.getByText(text)).not.toBeVisible();
});

When(/^refresh the page$/, async function () {
    await this.page.reload();
});
When(/^turn on RUCSS$/, async function () {
    this.sections.set('fileOptimization');
    await this.sections.state(true);
    await this.sections.toggle('rucss');
    await this.page.click('#wpr-options-submit', {force: true})

});
When(/^save the option$/, async function () {
    await this.page.click('#wpr-options-submit', {force: true})
});
When(/^turn on CPCSS$/, async function () {
    if(! await this.page.locator('input#optimize_css_delivery').inputValue()) {
        await this.page.click('label[for="optimize_css_delivery"]', {force: true})
    }
    await this.page.click('#wpr-radio-async_css', {force: true})
});
When('I go {string}', async function (url) {
    await this.page.goto(`${configurations.baseUrl}${url}`);
});

When('I connect as {string}', async function (user) {
    await this.utils.wpAdminLogout();
    await this.utils.auth(user);
});

Given('I am on the page {string}', {timeout: 10 * 1000} , async function (url) {
    await this.page.goto(`${configurations.baseUrl}${url}`);
});

AfterAll(function () {
    const wpDir = getWPDir(configurations);
    rm(`${wpDir}/wp-content/plugins/wp-rocket`)
})