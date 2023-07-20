import wp, {activatePlugin, cp, generateUsers, rm, setTransient} from "../../utils/commands";
import world from "./hooks";
import {expect} from "@playwright/test";
import {AfterAll, BeforeAll} from "@cucumber/cucumber";
import {WP_BASE_URL, WP_ROOT_DIR} from "../../config/wp.config";
import { pageUtils } from '../../utils/page.utils';

const { Given, When, Then } = require("@cucumber/cucumber");
Given('I have an {word} account', { timeout: 60 * 1000 }, async function (status) {


    const expiration = "unexpired" === status ? Date.now() + 99999 : Date.now() - 99999;

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
});

Given('plugin {word} is activated', function (plugin) {
   activatePlugin(plugin)
});
Given(/^I have CPCSS turned on$/, async function () {
    await world.page.click('label[for="optimize_css_delivery"]', {force: true})
    await world.page.click('#wpr-radio-async_css', {force: true})
    await world.page.click('#wpr-options-submit', {force: true})
});
Then('I must see the banner {string}', async function (text) {
    await expect(world.page.getByText(text)).toBeVisible();
});
When('click on {string}', function (text) {
    world.page.getByText(text).click();
});
Then('I must not see the banner {string}', async function (text) {
    await expect(world.page.getByText(text)).not.toBeVisible();
});

When(/^refresh the page$/, async function () {
    await world.page.reload();
});
When(/^turn on RUCSS$/, async function () {
    if(! await world.page.locator('input#optimize_css_delivery').inputValue()) {
        await world.page.click('label[for="optimize_css_delivery"]', {force: true})
    }
    await world.page.getByText('Activate Remove Unused CSS').click({force: true})
});
When(/^save the option$/, async function () {
    await world.page.click('#wpr-options-submit', {force: true})
});
When(/^turn on CPCSS$/, async function () {
    if(! await world.page.locator('input#optimize_css_delivery').inputValue()) {
        await world.page.click('label[for="optimize_css_delivery"]', {force: true})
    }
    await world.page.click('#wpr-radio-async_css', {force: true})
});
When('I go {string}', async function (url) {
    await world.page.goto(`${WP_BASE_URL}${url}`);
});

When('I connect as {string}', async function (user) {
    const page_utils = new pageUtils( world.page );
    await page_utils.auth(user);
});

Given('I am on the page {string}', {timeout: 10 * 1000} , async function (url) {
    await world.page.goto(`${WP_BASE_URL}${url}`);
});

BeforeAll(async function () {
    wp('rewrite structure /%year%/%monthnum%/%postname%/')
    generateUsers([
        {
            name: 'admin2',
            email: 'administrator@email.org',
            role: 'administrator',
        },
        {
            name: 'subscriber',
            email: 'subscriber@email.org',
            role: 'subscriber',
        },
        {
            name: 'editor',
            email: 'editor@email.org',
            role: 'editor',
        },
        {
            name: 'author',
            email: 'author@email.org',
            role: 'author',
        },
        {
            name: 'contributor',
            email: 'contributor@email.org',
            role: 'contributor',
        },
    ])
    await cp(`${process.env.PWD}/plugin/wp-rocket`, `${WP_ROOT_DIR}/wp-content/plugins/wp-rocket`)
})

AfterAll(function () {
    rm(`${WP_ROOT_DIR}/wp-content/plugins/wp-rocket`)
})