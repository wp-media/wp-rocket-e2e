/**
 * @fileoverview
 * This module contains Cucumber step definitions using Playwright for asserting successful page loading.
 * It includes a step for checking responses, navigating to the specified WP base URL, and authenticating.
 *
 * @requires {@link ../../common/custom-world}
 * @requires {@link @playwright/test}
 * @requires {@link @cucumber/cucumber}
 * @requires {@link ../../../config/wp.config}
 */

import { ICustomWorld } from "../../common/custom-world";
import { expect } from "@playwright/test";
import { Then } from '@cucumber/cucumber';

import { WP_BASE_URL } from '../../../config/wp.config';

/**
 * Executes the step to assert successful page loading.
 */
Then('page loads successfully', async function (this: ICustomWorld) {
    this.page.on('response', async (response) => {
        expect(response.status()).not.toEqual(500);
        expect(response.status()).not.toEqual(404);
    });
    await this.page.goto(WP_BASE_URL);
    await this.page.waitForLoadState('load', { timeout: 30000 });
});