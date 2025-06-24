import {Then, When} from "@cucumber/cucumber";
import {ICustomWorld} from "../../common/custom-world";
import {expect} from "@playwright/test";

/**
 * Click on save and continue button during onboarding.
 *
*/
When('I click {string} button to continue', async function (this: ICustomWorld, button) {

    await this.page.waitForSelector(button, {
        state: 'visible',
        timeout: 10000
    });

    await this.page.click(button);
});

When('I Configure web server storage', async function (this: ICustomWorld) {
    await this.page.locator('.js-backwpup-toggle-storage').first().click();
    await this.page.click('.js-backwpup-test-FOLDER-storage')

    //Save and submit onboarding form
    await this.page.click('.js-backwpup-onboarding-submit-form');

    await this.page.waitForTimeout(60000);

    const closeButton = '#showworkingclose'
    await this.page.waitForSelector(closeButton, {
        state: 'visible',
        timeout: 10000
    });
    await this.page.click(closeButton)
});


/**
 * Set backup frequency to a specific period
 * @step
 * @param {string} dataType - Backup type.
 * @param {string} period - Period option (Available options are monthly, hourly, weekly and daily).
*/
When('I set {string} backup frequency to {string}', async function (this: ICustomWorld, dataType: string, period: string) {
      const dataTypes: { [key: string]: string } = {
          files: 'job_2',
          database: 'job_3',
      };
      
      await this.page.selectOption(`select[name="${dataTypes[dataType]}_frequency"]`, period);
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