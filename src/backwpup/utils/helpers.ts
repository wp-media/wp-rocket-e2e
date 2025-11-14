import { configurations } from "../../../utils/configurations";
import { ICustomWorld } from "../../common/custom-world";
import { Page } from '@playwright/test';
import { wpWithOutput } from '../../../utils/commands';

/**
 * Waits for a BackWPup backup job to complete by monitoring job status indicators on the page.
 * 
 * @param page - The Playwright Page instance to interact with
 * @param options - Optional configuration for the wait operation
 * @param options.timeout - Maximum time to wait for job completion in milliseconds. Defaults to 100000ms (100 seconds)
 * @param options.clickCloseButton - Whether to automatically click the close button after job completion. Defaults to `true`
 * 
 * @returns A Promise that resolves when the backup job completes or the function determines completion status
 * 
 * @throws Will throw an error if the job doesn't complete within the timeout period and the page is not on the BackWPup admin page
 * 
 * @remarks
 * This function monitors the visibility of specific UI elements to determine job completion:
 * - Waits for the running job indicator to appear
 * - Waits for the close button to become visible
 * - Waits for the abort button to become hidden (indicating job completion)
 * 
 * If the job completes quickly or the page is already on the BackWPup admin page without showing indicators,
 * the function will gracefully handle this scenario and return successfully.
 * 
 * @example
 * ```typescript
 * // Wait with default settings
 * await waitForBackupJobCompletion(page);
 * 
 * // Wait with custom timeout and don't click close button
 * await waitForBackupJobCompletion(page, { 
 *   timeout: 60000, 
 *   clickCloseButton: false 
 * });
 * ```
 */
export const waitForBackupJobCompletion = async (
    page: Page,
    options?: { timeout?: number; clickCloseButton?: boolean }
): Promise<void> => {
    const { timeout = 100000, clickCloseButton = true } = options || {};
    const runningJob = '#runningjob';
    const closeButton = 'button#showworkingclose';
    const abortButton = 'button#abortbutton';
    await page.waitForLoadState('networkidle');
    try {
        await page.waitForSelector(runningJob, {
            state: 'visible',
            timeout: 30000
        });
        await page.waitForSelector(closeButton, {
            state: 'visible',
            timeout: 10000
        });
        await page.waitForSelector(abortButton, {
            state: 'hidden',
            timeout
        });
        if (clickCloseButton) {
            await page.click(closeButton);
        }
    } catch (error) {
        // Check if we're on the backup jobs page
        const currentUrl = page.url();
        if (currentUrl.includes('/wp-admin/admin.php?page=backwpup')) {
            // If we're on the main BackWPup page, the job might have completed without showing indicators
            console.log(
                'Backup job may have completed quickly or indicators not shown on main page'
            );
            return;
        }
        // Re-throw the error if we're not on the expected page
        throw error;
    }
    await page.waitForLoadState('networkidle');
};

/**
 * Waits for the specified onboarding continue button selector to become visible and then clicks it.
 *
 * @param page - The Playwright page instance used for interaction.
 * @param button - A selector string identifying the button element to click.
 * @returns A promise that resolves once the click action is completed.
 */
export const clickContinueButton = async (page: ICustomWorld['page'], button: string): Promise<void> => {
    await page.waitForSelector(button, {
        state: 'visible',
        timeout: 10000
    });

    return await page.click(button);
};

/**
 * Configures the web server storage in the onboarding process
 *
 * @param page - The Playwright Page instance used to perform UI interactions.
 * @returns A promise that resolves when the web server storage configuration is fully applied.
 */
export const configureWebServerStorage = async (page: ICustomWorld['page']): Promise<void> => {
        await page.locator('.js-backwpup-toggle-storage').first().click();
        await page.click('.js-backwpup-test-FOLDER-storage')
        // Wait for sidebar closing animation
        await page.waitForTimeout(2000);
    
        //Save and submit onboarding form
        await page.click('.js-backwpup-onboarding-submit-form');
        await waitForBackupJobCompletion(page);
};

/**
 * Generates a filesystem-friendly folder name derived from the configured base URL's hostname.
 *
 * The function parses `configurations.baseUrl`, extracts the hostname portion, and replaces
 * all dot characters ('.') with hyphens ('-') to produce a directory-safe name.
 *
 * Examples:
 * - "https://example.com"         -> "example-com"
 * - "https://sub.domain.co.uk"    -> "sub-domain-co-uk"
 *
 * @returns The directory name based on the hostname with dots replaced by hyphens.
 * @throws {TypeError} If `configurations.baseUrl` is not a valid URL and the URL constructor fails.
 * @remarks Relies on the global/module `configurations.baseUrl` value being available.
 */
export const getFolderNameFromHost = (): string => {
    const domain = new URL(configurations.baseUrl).hostname;
    const directoryName = domain.replace(/\./g, '-');
    return directoryName;
}

export const listBackWPupJobsWPCLI = async (json?: boolean): Promise<string> => {
    const useJson = json ? ' --format=json' : '';
    const result = await wpWithOutput(`backwpup jobs${useJson}`);
    if (result.failed) {
        throw new Error(`WP-CLI Error: ${result.stdout}\n${result.stderr}`);
    }
    return JSON.parse(result.stdout);
};