import {Then, When} from "@cucumber/cucumber";
import {ICustomWorld} from "../common/custom-world";
import {expect, Page} from "@playwright/test";
import {BackupRowData} from "../utils/types";
import { waitForBackupJobCompletion } from "../utils/helpers";
import { configurations } from '../../../utils/configurations';

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
    await waitForBackupJobCompletion(this.page, { clickCloseButton: false });
    // Make sure we are on the backup history page (Dashboard) and the new backups are visible (After page loads)
    await this.page.goto(
        `${configurations.baseUrl}/wp-admin/admin.php?page=backwpup`, {
            waitUntil: 'networkidle'
        }
    );
    const currentBackups = await captureBackupTableData(this.page)
    expect(currentBackups.length).toBe(this.initialBackups.length + parseInt(backupNumber));
});

When('I set up {string} storage for first backup',
    async function (this: ICustomWorld, storageProvider: string) {
        await this.storage.setupStorageOnboarding(storageProvider);
    }
);
When('I set up {string} storage', async function (this: ICustomWorld, storageProvider: string) {
    await this.page.locator('.backwpup-job-card button[data-content="storages"]').first().click();
    const storageType = storageProvider.toUpperCase();
    const storageHandlers: Record<string, () => Promise<void>> = {
        msazure: () => this.storage.setupMSAzure(),
        ftp: () => this.storage.setupFTP(),
        sugarsync: () => this.storage.setupSugarSync(),
    } as const;

    const configureButton = this.page.locator(`button[data-storage="${storageType}"].js-backwpup-toggle-storage`);

    await expect(configureButton).toBeVisible();
    await configureButton.click();

    await this.page.waitForResponse(response =>
        response.url().includes('/backwpup/v1/getblock') &&
        response.status() === 200
    );

    const handler = storageHandlers[storageType.toLowerCase()];
    if (!handler) throw new Error(`No handler found for storage type: ${storageType}`);
    await handler();
});
Then('{string} storage should be selected for first backup', async function (this: ICustomWorld, storageProvider: string) {
    const storageType = storageProvider.toUpperCase();
    const isChecked  = await this.page.isChecked(`#destination-${storageType}`);
    expect(isChecked).toBe(true);
});
Then('{string} storage should be selected', async function (this: ICustomWorld, storageProvider: string) {
    const storageType = storageProvider.toUpperCase();
    await this.page.locator('.backwpup-job-card button[data-content="storages"]').first().click();

    const isChecked  = await this.page.isChecked(`#destination-${storageType}`);
    expect(isChecked).toBe(true);

    await this.page.locator('#sidebar-storages button.js-backwpup-close-sidebar').first().click()
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

When('I click on manual backup of a job', async function (this: ICustomWorld) {
    this.initialBackups = await captureBackupTableData(this.page)
    await this.page.locator('button[data-content="backup-job"].js-backwpup-load-and-open-modal').click();
    await this.page.waitForSelector('#sidebar-backup-job', { state: 'visible' });

    await this.page.locator('button.js-backwpup-start-backup-job').click();

    await this.page.waitForLoadState('networkidle');
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
