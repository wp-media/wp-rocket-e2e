import {Then, When} from "@cucumber/cucumber";
import {ICustomWorld} from "../common/custom-world";
import {expect, Page} from "@playwright/test";
import {BackupRowData} from "../utils/types";
import { waitForBackupJobCompletion, extractLastMeaningfulLine, normalizeCellText } from "../utils/helpers";
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
    const currentBackups = await captureBackupTableData(this.page);
    const failedBackups = currentBackups.filter(backup => backup.failed);
    
    if (failedBackups.length > 0) {
        throw new Error(`Expected no failed backups, but found ${failedBackups.length} failed backup(s). Failed backups details: ${JSON.stringify(failedBackups)}`);
    }
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
        s3: () => this.storage.setupS3(),
        glacier: () => this.storage.setupGlacier(),
        rsc: () => this.storage.setupRackspace(),
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
    await this.page.locator('header:has(h1:has-text("Select Files")) button.js-backwpup-close-sidebar').click();
});

When('{string} is unchecked from database options', async function (this: ICustomWorld, value: string) {
    await this.page.locator('button[data-content="settings-data-type"]').click();
    await this.page.locator('button[data-mixed-data-content="database"]').click();
    const checkbox = this.page.locator(`label:has(input[value="${value}"])`);

    await expect(checkbox).not.toBeChecked();
    await this.page.locator('header:has(h1:has-text("Select Tables")) button.js-backwpup-close-sidebar').click();
});

When('I click on manual backup of a job', async function (this: ICustomWorld) {
    this.initialBackups = await captureBackupTableData(this.page)
    await this.page.locator('button[data-content="backup-job"].js-backwpup-load-and-open-modal').click();
    await this.page.waitForSelector('#sidebar-backup-job', { state: 'visible' });

    await this.page.locator('button.js-backwpup-start-backup-job').click();

    await this.page.waitForLoadState('networkidle');
});

When('I create one job', async function (this: ICustomWorld) {
    await this.page.goto(
        `${configurations.baseUrl}/wp-admin/admin.php?page=backwpup`,
        {
            waitUntil: 'load'
        }
    );
    const createJobButton = this.page.locator(
        'div#backwup-next-scheduled-backups div#js_backwpup_add_new_backup button'
    );
    await expect(createJobButton).toBeVisible();
    await createJobButton.click();
});
When('I Schedule backup', async function (this: ICustomWorld) {
    this.initialBackups = await captureBackupTableData(this.page)
    const timeText = await this.page.locator('#wp-admin-bar-current_time_display .ab-item').textContent();
    const timeMatch = timeText.match(/(\d{2}):(\d{2}):(\d{2})/);
    const currentHours = parseInt(timeMatch[1], 10);
    const currentMinutes = parseInt(timeMatch[2], 10);

    const totalMinutes = currentHours * 60 + currentMinutes + 2;
    const scheduleHours = Math.floor(totalMinutes / 60) % 24;
    const scheduleMinutes = totalMinutes % 60;

    const timeValue = `${scheduleHours.toString().padStart(2, '0')}:${scheduleMinutes.toString().padStart(2, '0')}`;

    await this.page.locator('button[data-content="frequency"].js-backwpup-load-and-open-sidebar').first().click();
    await this.page.waitForSelector('#sidebar-frequency', { state: 'visible' });
    await this.page.selectOption('#backwpup_frequency', 'daily');
    await this.page.fill('input[name="start_time"]', timeValue);

    await this.page.locator('button#save-job-settings').click();

    await this.page.waitForLoadState('networkidle');

    await this.page.waitForTimeout(3 * 60 * 1000);
});

/**
 * Captures backup row data from the BackWPup backup history table.
 *
 * Reads each row of `table#backwpup-backup-history` and returns structured data.
 *
 * **Supports two table layouts:**
 *
 * - **Pre-5.6.9 (old layout):** Failed rows merge columns 3 ("Stored on") and 4 ("Data")
 *   into a single `<td colspan="2">` containing the failure message. In this layout,
 *   `td:nth-child(5)` does not exist on failed rows, and failure is detected from col 4.
 *
 * - **5.6.9+ (new layout):** All columns remain separate. Column 4 always contains
 *   the "Stored on" icon/tooltip (even on failure), and column 5 ("Data"/"Status")
 *   contains the failure message (e.g., "FTP backup failed"). The failure text now
 *   includes the storage provider name.
 *
 * **Version detection:** We count the `<td>` elements in each row. If there are 6 columns
 * (checkbox, date, type, stored on, data, actions), it's the new layout. If fewer
 * (due to colspan merging), it's the old layout.
 *
 * **Text extraction strategy (important — do not change without testing):**
 *
 * - **Date (column 2)** → `innerText()`:
 *   The date is rendered as visible text, so `innerText()` returns it cleanly.
 *   See: {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/innerText MDN: innerText}
 *
 * - **Type (column 3)** and **Stored on (column 4)** → `textContent()`:
 *   These columns render their values as **icons with CSS-hidden text** (e.g., `sr-only`
 *   spans or tooltip containers). `innerText()` returns empty for hidden elements,
 *   but `textContent()` captures ALL text nodes regardless of CSS visibility.
 *   The raw output includes a hidden column header on the first line and the data
 *   value on the last (e.g., `"Type\n...\nManual"`), so `extractLastMeaningfulLine()`
 *   strips the header and returns only the value.
 *   See: {@link https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent MDN: textContent}
 *
 * @param page - The Playwright Page instance to read the table from.
 * @returns An array of {@link BackupRowData} objects, one per visible table row.
 */
const captureBackupTableData = async (page: Page): Promise<BackupRowData[]> => {
    const selector = 'table#backwpup-backup-history tbody tr';
    await page.locator(selector).first().waitFor({ state: 'visible' }).catch(() => null);
    const rows = await page.locator(selector).all();
    const backups: BackupRowData[] = [];

    for (const row of rows) {
        // Date is visually rendered text → innerText() returns it cleanly.
        const rawDate = await row.locator('td:nth-child(2)').innerText();

        // Type and Stored-on columns display icons, not visible text.
        // The actual values live in CSS-hidden elements (sr-only spans, tooltip containers).
        // textContent() captures ALL text nodes regardless of visibility — including the
        // hidden column header on the first line and the data value on the last line.
        const rawType = (await row.locator('td:nth-child(3)').textContent()) || '';

        // Detect layout version by counting <td> elements in this row.
        // New layout (5.6.9+): 6 columns (checkbox, date, type, stored on, data/status, actions).
        // Old layout (pre-5.6.9): Failed rows have 5 columns due to colspan="2" merging cols 3+4.
        const tdCount = await row.locator('td').count();
        const isNewLayout = tdCount >= 6;

        let failed: boolean;
        let storedOn: string;

        if (isNewLayout) {
            // New layout: col 4 = Stored on (always present), col 5 = Data/Status.
            const rawStoredOn = (await row.locator('td:nth-child(4)').textContent()) || '';
            const rawStatus = (await row.locator('td:nth-child(5)').textContent()) || '';

            failed = rawStatus.toLowerCase().includes('failed');
            storedOn = extractLastMeaningfulLine(rawStoredOn);
        } else {
            // Old layout: on failed rows, cols 3+4 are merged (colspan="2") into td:nth-child(4).
            // On success rows, col 4 = Stored on.
            const rawStoredOnOrError = (await row.locator('td:nth-child(4)').textContent()) || '';

            failed = rawStoredOnOrError.toLowerCase().includes('failed');
            storedOn = !failed ? extractLastMeaningfulLine(rawStoredOnOrError) : '';
        }

        // Date may span multiple lines ("Apr 13, 2026\nat 10:09pm") — collapse to one line.
        const date = normalizeCellText(rawDate);
        // Type raw text: first line = column header label, last line = actual value.
        const type = extractLastMeaningfulLine(rawType);

        backups.push({ date, type, storedOn, failed });
    }
    return backups;
}

/**
 * Optional: strict toast validator to reuse when we need exact message matching.
 * Commented out to avoid unused lint errors while keeping the implementation handy.
*/

/**
const waitForToastMessage = async (page: Page, expectedMessage = null, timeout = 3000): Promise<boolean> => {
    const toastContainer = page.locator('#bwp-settings-toast');

    await toastContainer.locator('div').first().waitFor({
        state: 'visible',
        timeout
    });

    if (expectedMessage) {
        const messageLocator = toastContainer.locator(
            'p.text-sm.font-medium',
            { hasText: expectedMessage }
        );

        await expect(messageLocator).toBeVisible();
        await expect(messageLocator).toHaveText(expectedMessage);
    }

    return true;
}
 */