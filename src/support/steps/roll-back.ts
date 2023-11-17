/**
 * @fileoverview
 * This module contains Cucumber step definitions using Playwright for asserting the rollback version.
 * It includes a step for navigating to the helper plugin page, going to the tools tab, and checking the rollback version.
 *
 * @requires {@link ../../common/custom-world}
 * @requires {@link @playwright/test}
 * @requires {@link @cucumber/cucumber}
 */

import { ICustomWorld } from "../../common/custom-world";
import {expect} from "@playwright/test";
import { Then } from '@cucumber/cucumber';

/**
 * Executes the step to assert that the rollback version is the same as in the button.
 *
 * @function
 * @async
 * @param {ICustomWorld} this - The Cucumber world object.
 * @throws {Error} Throws an error if the rollback version does not match the button.
 * @returns {Promise<void>} - A Promise that resolves when the assertion is completed.
 */
Then('rollback version must be the same as in the button', async function (this: ICustomWorld) {
    // Navigate to helper plugin page.
    await this.utils.gotoHelper();
    // Go to tools tab
    await this.page.locator('#tools_tab').click();
    await this.page.waitForSelector('#wpr_last_major_version_equals_current');
    await expect(this.page.locator('#wpr_last_major_version_equals_current')).toHaveText(/Returned True/);
});