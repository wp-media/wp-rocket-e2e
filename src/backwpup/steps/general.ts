import {Then, When} from "@cucumber/cucumber";
import {ICustomWorld} from "../../common/custom-world";
import {expect, Page} from "@playwright/test";
import {BackupRowData} from "../utils/types";

/**
 * Executes the step to enable all settings.
 */
When('I click on common backup now button', async function (this: ICustomWorld) {
    this.initialBackups = await captureBackupTableData(this.page)

    await this.page.locator('#backwpup-backup-now').click();
    await this.page.click('.js-backwpup-start-backup-now')

    await this.page.waitForLoadState('networkidle');

    await this.page.waitForSelector('.js-backwpup-open-modal');
});

Then('the backup should be added to the table', async function (this: ICustomWorld) {
    await this.page.reload();
    await this.page.waitForLoadState('networkidle');

    const newRowCount = await this.page.locator('table#backwpup-backup-history tbody tr').count();
    expect(newRowCount).toBe(1);
});

Then('{string} backup is generated and added to history', async function (this: ICustomWorld, backupNumber: string) {
    await this.page.reload();
    await this.page.waitForLoadState('networkidle');

    const progressBar = this.page.locator('.progress-bar');
    const progressText = this.page.locator('.progress-step span');
    await progressBar.waitFor({ state: 'visible', timeout: 10000 });

    await expect(progressText).toHaveText('100%', { timeout: 30000 });
    await progressBar.waitFor({ state: 'hidden', timeout: 10000 });

    const currentBackups = await captureBackupTableData(this.page)
    expect(currentBackups.length).toBe(this.initialBackups.length + parseInt(backupNumber));
});

When('{string} is unchecked from files options', async function (this: ICustomWorld, value: string) {
    await this.page.locator('button[data-content="settings-data-type"]').click();
    await this.page.locator('button[data-mixed-data-content="files"]').click();
    const checkbox = this.page.locator(`label:has(input[name="${value}"])`);

    await expect(checkbox).not.toBeChecked();
    await this.page.locator('button#file-exclusions-submit').click();
    await waitForToastMessage(this.page , 'File exclusions saved successfully.')
});

When('{string} is unchecked from database options', async function (this: ICustomWorld, value: string) {
    await this.page.locator('button[data-content="settings-data-type"]').click();
    await this.page.locator('button[data-mixed-data-content="database"]').click();
    const checkbox = this.page.locator(`label:has(input[value="${value}"])`);

    await expect(checkbox).not.toBeChecked();
    await this.page.locator('button#save-excluded-tables').click();
    await waitForToastMessage(this.page , 'Excluded tables saved successfully.')
});


const captureBackupTableData = async (page: Page): Promise<BackupRowData[]> => {
    const rows = await page.locator('table tbody tr').all();
    const backups: BackupRowData[] = [];

    for (const row of rows) {
        const date = await row.locator('td:nth-child(1)').textContent() || '';
        const type = await row.locator('td:nth-child(2)').textContent() || '';
        const storedOn = await row.locator('td:nth-child(3)').textContent() || '';

        backups.push({ date, type, storedOn });
    }

    return backups;
}

const waitForToastMessage = async (page: Page, expectedMessage = null, timeout = 3000): Promise<boolean> => {
    const toastContainer = page.locator('#bwp-settings-toast');

    await toastContainer.locator('div').first().waitFor({
        state: 'visible',
        timeout
    });

    if (expectedMessage) {
        const messageLocator = toastContainer.locator('p.text-sm.font-medium');
        await expect(messageLocator).toContainText(expectedMessage);
    }

    return true;
}
