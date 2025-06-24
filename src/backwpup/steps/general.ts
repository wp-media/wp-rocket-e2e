import {Then, When} from "@cucumber/cucumber";
import {ICustomWorld} from "../../common/custom-world";
import {expect, Page} from "@playwright/test";
import {BackupRowData} from "../../../utils/types";

let initialRowCount = 0,
    initialBackups;
/**
 * Executes the step to enable all settings.
 */
When('I click on common backup now button', async function (this: ICustomWorld) {
    initialBackups = await captureBackupTableData(this.page)
    await this.page.locator('#backwpup-backup-now').click();
    await this.page.click('.js-backwpup-start-backup-now')
    initialRowCount = await this.page.locator('table#backwpup-backup-history tbody tr').count();

    console.log('initial backup number -- ' + initialBackups.length)
    //Wait for 7 seconds, might be a lot but safer to avoid inconsistencies result
    await this.page.waitForTimeout(70000);
});

Then('the backup should be added to the table', async function (this: ICustomWorld) {
    await this.page.reload();
    await this.page.waitForLoadState('networkidle');

    const newRowCount = await this.page.locator('table#backwpup-backup-history tbody tr').count();
    expect(newRowCount).toBe(initialRowCount + 1);
});

Then('{string} backup is generated and added to history', async function (this: ICustomWorld, backupNumber: string) {
    await this.page.reload();
    await this.page.waitForLoadState('networkidle');

    //Validate the number of backup generated and added to history.
    const currentBackups = await captureBackupTableData(this.page)

    console.log('initial backup number after generation -- ' + initialBackups.length)

    expect(currentBackups.length).toBe(initialBackups.length + parseInt(backupNumber));
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