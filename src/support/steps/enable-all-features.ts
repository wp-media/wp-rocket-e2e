import {expect} from "@playwright/test";
import { Response } from "playwright";
import { When, Then } from '@cucumber/cucumber';

import { WP_BASE_URL } from '../../../config/wp.config';

When('I visit site url', async function () {
    await this.page.goto(WP_BASE_URL);
});

Then('page loads successfully', async function () {
    this.page.on('response', async (response: Response) => {
        expect(response.status()).not.toEqual(500);
        expect(response.status()).not.toEqual(404);
    });
    await this.page.goto(WP_BASE_URL);
    await this.page.waitForLoadState('load', { timeout: 30000 });
    await this.utils.auth();
});