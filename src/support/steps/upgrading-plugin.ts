import {expect} from "@playwright/test";
import { Given, When } from '@cucumber/cucumber';

Given('plugin 3.10.9 is installed', async function () {
    // Upload WPR version 3.10.9
    await this.utils.uploadNewPlugin('./plugin/wp-rocket_3.10.9.zip');
    await expect(this.page).toHaveURL(/action=upload-plugin/); 
});

Given('rucss beacon is opened', async function () {
    // Open file optimization section.
    await this.sections.set("fileOptimization");

    // Enable Optimize CSS delivery option.
    await this.sections.state(true).toggle("rucss");

    await this.page.waitForSelector('iframe[title="Help Scout Beacon - Open"]');

    // Click the RUCSS Beacon
    await this.page.locator('a[data-beacon-article="6076083ff8c0ef2d98df1f97"]').click();
    await this.page.waitForSelector('iframe[title="Help Scout Beacon - Live Chat, Contact Form, and Knowledge Base"]');
});

When('I update to latest version', async function () {
    await this.utils.uploadNewPlugin('./plugin/new_release.zip');
    await this.page.waitForLoadState('load', { timeout: 30000 });
    await expect(this.page).toHaveURL(/action=upload-plugin/); 
    
    // Replace current with uploaded
    await this.page.locator('a:has-text("Replace current with uploaded")').click();

    await this.page.waitForLoadState('load', { timeout: 30000 });
    await expect(this.page).toHaveURL(/overwrite=update-plugin/); 
});

When('I go through rucss beacon', async function () {
    const iframe = this.page.frameLocator('iframe[title="Help Scout Beacon - Live Chat, Contact Form, and Knowledge Base"]');

    await iframe.locator('#fullArticle').getByRole('link', { name: 'Feature benefits' }).click();
    await iframe.locator('#fullArticle').getByRole('link', { name: 'Feature overview' }).click();
    await iframe.locator('#fullArticle').getByRole('link', { name: 'Using Remove Unused CSS with Combine CSS files' }).click();
    await iframe.locator('#fullArticle').getByRole('link', { name: 'Using Remove Unused CSS with Autoptimize and Perfmatters' }).click();
    await iframe.locator('#fullArticle').getByRole('link', { name: 'How to exclude files from this optimization / retain selected CSS rules' }).click();

    await this.utils.gotoWpr();
    await this.page.waitForLoadState('load', { timeout: 30000 });
});

When('I downgrade to the last stable version', async function () {
    await this.utils.uploadNewPlugin('./plugin/previous_stable.zip');
    await this.page.waitForLoadState('load', { timeout: 30000 });
    await expect(this.page).toHaveURL(/action=upload-plugin/); 

    // Replace current with uploaded
    await this.page.locator('a:has-text("Replace current with uploaded")').click();
    await this.page.waitForLoadState('load', { timeout: 30000 });
});