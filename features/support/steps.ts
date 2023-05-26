import wp from "../../utils/commands";

const { Given, When, Then } = require("@cucumber/cucumber");
Given('I have an {word} account', { timeout: 60 * 1000 }, async function (status) {
    const data = await wp('transient get test');
});

Given(/^plugin wp\-rocket is activated$/, function () {

});
Given(/^I have CPCSS turned on$/, function () {

});
Then('I must see the banner {string}', function (text) {

});
When('click on {string}', function (text) {

});
Then('I must not see the banner {string}', function (text) {

});

When(/^refresh the page$/, function () {

});
When(/^turn on RUCSS$/, function () {

});
When(/^save the option$/, function () {

});
When(/^turn on CPCSS$/, function () {

});
When('I go {string}', function () {

});

When('I connect as {string}', function (user) {

});