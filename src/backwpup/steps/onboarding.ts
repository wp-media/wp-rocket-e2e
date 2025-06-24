import {Then, When} from "@cucumber/cucumber";
import {ICustomWorld} from "../../common/custom-world";
import {expect} from "@playwright/test";
import { clickContinueButton, configureWebServerStorage } from "../utils/helpers";

/**
 * Click on save and continue button during onboarding.
 *
*/
When('I click {string} button to continue', async function (this: ICustomWorld, button) {
    await clickContinueButton(this.page, button);
});

When('I Configure web server storage', async function (this: ICustomWorld) {
    await configureWebServerStorage(this.page);
});


/**
 * Set backup frequency to a specific period
 * @step
 * @param {string} dataType - Backup type.
 * @param {string} period - Period option (Available options are monthly, hourly, weekly and daily).
*/
When('I set {string} backup frequency to {string}', async function (this: ICustomWorld, dataType: string, period: string) {
    if(dataType === 'files') {
        await this.page.selectOption('select[name="job_2_frequency"]', period);
    }

    if(dataType === 'database') {
        await this.page.selectOption('select[name="job_3_frequency"]', period);
    }
})

/**
 * Set backup advanced frequency to a specific period
 * @step
 * @param {string} dataType - Backup type.
 * @param {string} period - Period option (Available options are monthly, hourly, weekly and daily).
 */
When('I set {string} backup advanced frequency to {string}', async function (this: ICustomWorld, dataType: string, period: string) {
    if(dataType === 'files') {
        await this.page.locator('button[data-content="frequency"][data-job-id="2"]').click();
        await this.page.selectOption('select[name="frequency"]#backwpup_frequency', period);
    }

    if(dataType === 'database') {
        await this.page.locator('button[data-content="frequency"][data-job-id="3"]').click();
        await this.page.selectOption('select[name="frequency"]#backwpup_frequency', period);
    }

    await this.page.locator('button.save_job_settings').click();
})


/**
 * See data type in
*/
Then('I should see {string} job cards', async function (this: ICustomWorld, dataType: string) {
    if(dataType === 'files') {
        await expect(this.page.locator('div.backwpup-job-files')).toBeVisible();
    }

    if(dataType === 'database') {
        await expect(this.page.locator('div.backwpup-job-database')).toBeVisible();
    }

    if(dataType === 'both') {
        await expect(this.page.locator('div.backwpup-job-database')).toBeVisible();
        await expect(this.page.locator('div.backwpup-job-files')).toBeVisible();
    }

    if(dataType === 'mixed') {
        await expect(this.page.locator('div.backwpup-job-mixed')).toBeVisible();
    }
});