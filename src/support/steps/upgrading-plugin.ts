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
import { expect } from '@playwright/test';

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