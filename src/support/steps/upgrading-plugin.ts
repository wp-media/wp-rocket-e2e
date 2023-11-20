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
import { Given, When } from '@cucumber/cucumber';

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
 * Executes the step to go through the RUCSS beacon.
 */
When('I go through rucss beacon', async function (this: ICustomWorld) {
    const iframe = this.page.frameLocator('iframe[title="Help Scout Beacon - Live Chat, Contact Form, and Knowledge Base"]');

    await iframe.locator('#fullArticle').getByRole('link', { name: 'Feature benefits' }).click();
    await iframe.locator('#fullArticle').getByRole('link', { name: 'Feature overview' }).click();
    await iframe.locator('#fullArticle').getByRole('link', { name: 'Using Remove Unused CSS with Combine CSS files' }).click();
    await iframe.locator('#fullArticle').getByRole('link', { name: 'Using Remove Unused CSS with Autoptimize and Perfmatters' }).click();
    await iframe.locator('#fullArticle').getByRole('link', { name: 'How to exclude files from this optimization / retain selected CSS rules' }).click();

    await this.utils.gotoWpr();
    await this.page.waitForLoadState('load', { timeout: 30000 });
});