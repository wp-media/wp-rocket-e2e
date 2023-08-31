import { ICustomWorld } from "../../common/custom-world";
import {expect} from "@playwright/test";
import { Then } from '@cucumber/cucumber';

import { WP_BASE_URL } from '../../../config/wp.config';

Then('page loads successfully', async function (this: ICustomWorld) {
    this.page.on('response', async (response) => {
        expect(response.status()).not.toEqual(500);
        expect(response.status()).not.toEqual(404);
    });
    await this.page.goto(WP_BASE_URL);
    await this.page.waitForLoadState('load', { timeout: 30000 });
    await this.utils.auth();
});