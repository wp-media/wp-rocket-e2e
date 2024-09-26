import { ICustomWorld } from "../../common/custom-world";

import { Given } from '@cucumber/cucumber';
import { IMAGIFY_INFOS } from "../../../config/wp.config";
import {expect} from "@playwright/test";

Given('Imagify is set up', async function (this: ICustomWorld) {
    await this.utils.gotoImagify();

    // Check if the API key input field exists on the page
    const apiKeyInput = await this.page.$('input#api_key');

    if (apiKeyInput) {
        // Fill the API key input field with the API key from the config
        await this.page.fill('input#api_key', IMAGIFY_INFOS.apiKey);
        // Click the submit button to save the changes
        await this.page.click('div.submit.imagify-clearfix input#submit');
    }
});
Given('display next-gen is enabled on imagify', async function (this: ICustomWorld) {
    // Go to Imagify setting page
    await this.utils.gotoImagify();

    // Check the 'Display images in Next-Gen format on the site' checkbox
    await this.page.click('label[for="imagify_display_nextgen"]');

    // Click the submit button to save the changes
    await this.page.click('input#submit');

    await expect(this.page.getByText('Settings saved.')).toBeVisible();
});