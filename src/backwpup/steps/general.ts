import {Then, When} from "@cucumber/cucumber";
import {ICustomWorld} from "../../common/custom-world";
import {expect, Page} from "@playwright/test";
import {BackupRowData} from "../utils/types";


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

    //Wait for 7 seconds, might be a lot but safer to avoid inconsistencies result
    await this.page.waitForLoadState('networkidle');

    await this.page.waitForSelector('.js-backwpup-open-modal');
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

    expect(currentBackups.length).toBe(initialBackups.length + parseInt(backupNumber));
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
