import {Given, Then, When} from "@cucumber/cucumber";
import {ICustomWorld} from "../../common/custom-world";
import {expect, Page} from "@playwright/test";
import { clickContinueButton, configureWebServerStorage } from "../utils/helpers";
import { WP_BASE_URL } from "../../../config/wp.config";
import { waitForBackupJobCompletion } from "../utils/helpers";

/**
 * Given step to to do onboarding
 */
Given('First backup generated with default settings and local storage', async function (this: ICustomWorld) {
    await this.page.goto(WP_BASE_URL + '/wp-admin/admin.php?page=backwpup');
    await clickContinueButton(this.page, '.js-backwpup-onboarding-step-2');
    await clickContinueButton(this.page, '.js-backwpup-onboarding-step-3');
    await configureWebServerStorage(this.page);
    await this.page.goto(WP_BASE_URL + '/wp-admin/admin.php?page=backwpup');
});

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

Then('I save and submit the onboarding form', async function (this: ICustomWorld) {
    const closeButton = 'button#showworkingclose';
    //Save and submit onboarding form
    await this.page.click('.js-backwpup-onboarding-submit-form');
    await waitForBackupJobCompletion(this.page);
    await this.page.click(closeButton);
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

/**
 * Check Files tables
*/
Then('all files directory should be selected', async function (this: ICustomWorld) {
    await this.page.locator('button[data-content="select-files"][data-job-id="1"]').click();

    await validateCheckboxSelection(this.page, '.js-backwpup-tables-list [type="checkbox"]', true);

    await this.page.locator('button#file-exclusions-submit').click();
});

/**
 * Check database tables
 */
Then('all database tables should be selected', async function (this: ICustomWorld) {
    await this.page.locator('button[data-content="select-tables"][data-job-id="1"]').click();

    await validateCheckboxSelection(this.page, 'input[type="checkbox"].js-backwpup-toggle-exclude', true);

    await this.page.locator('button#save-excluded-tables').click();
});

When('I uncheck the {string} from files backup option', async function (this: ICustomWorld, value: string) {
    await this.page.locator('button[data-content="select-files"][data-job-id="1"]').click();
    await this.page.waitForSelector('#sidebar-select-files', { state: 'visible' });

    const checkbox = this.page.locator(`label:has(input[name="${value}"])`);
    await checkbox.scrollIntoViewIfNeeded();
    const isChecked = await checkbox.isChecked();

    if (isChecked) {
        await checkbox.click();
    }

    await expect(checkbox).not.toBeChecked();
    await this.page.locator('button#file-exclusions-submit').click();
    await expect(this.page.locator('#sidebar-select-files')).not.toBeInViewport();
});

When('I uncheck the {string} from database backup option', async function (this: ICustomWorld, value: string) {
    await this.page.locator('button[data-content="select-tables"][data-job-id="1"]').click();
    await this.page.waitForSelector('#sidebar-select-tables', { state: 'visible' });

    const checkbox = this.page.locator(`label:has(input[value="${value}"])`);
    await checkbox.scrollIntoViewIfNeeded();
    const isChecked = await checkbox.isChecked();

    if (isChecked) {
        await checkbox.click();
    }

    await expect(checkbox).not.toBeChecked();
    await this.page.locator('button#save-excluded-tables').click();
    await expect(this.page.locator('#sidebar-select-tables')).not.toBeInViewport();
});

const validateCheckboxSelection = async (page: Page, containerSelector: string, shouldBeChecked: boolean = true): Promise<void> => {
    const allCheckboxes = page.locator(`${containerSelector}`);
    const count = await allCheckboxes.count();

    for (let i = 0; i < count; i++) {
        const checkbox = allCheckboxes.nth(i);
        if (shouldBeChecked) {
            await expect(checkbox).toBeChecked();
        } else {
            await expect(checkbox).not.toBeChecked();
        }
    }
}
