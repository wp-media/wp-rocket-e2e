import { ICustomWorld } from "../../common/custom-world";
import {expect} from "@playwright/test";
import { Then } from '@cucumber/cucumber';

Then('rollback version must be the same as in the button', async function (this: ICustomWorld) {
    // Navigate to helper plugin page.
    await this.utils.gotoHelper();
    // Go to tools tab
    await this.page.locator('#tools_tab').click();
    await this.page.waitForSelector('#wpr_last_major_version_equals_current');
    await expect(this.page.locator('#wpr_last_major_version_equals_current')).toHaveText(/Returned True/);
});