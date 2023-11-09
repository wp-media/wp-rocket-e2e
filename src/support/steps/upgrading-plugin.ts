import { ICustomWorld } from "../../common/custom-world";
import { Given, When } from '@cucumber/cucumber';

Given('rucss beacon is opened', async function (this: ICustomWorld) {
    // Open file optimization section.
    this.sections.set("fileOptimization");

    // Enable Optimize CSS delivery option.
    await this.sections.state(true).toggle("rucss");

    await this.page.locator('iframe[title="Help Scout Beacon - Open"]').waitFor();
    await this.page.locator('a[data-beacon-article="6076083ff8c0ef2d98df1f97"]').click();

    await this.page.waitForSelector('iframe[title="Help Scout Beacon - Live Chat, Contact Form, and Knowledge Base"]');
});

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