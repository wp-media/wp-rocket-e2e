import { Page } from "@playwright/test";

/**
 * Waits for a backup job to complete by monitoring the job status indicators.
 * 
 * This function monitors the backup job execution by waiting for specific UI elements
 * to appear and disappear, indicating the job's progress and completion.
 * 
 * @param page - The Playwright Page instance to interact with
 * @returns A Promise that resolves when the backup job has completed
 * 
 * @remarks
 * The function waits for the following sequence:
 * 1. Network to be idle
 * 2. Running job indicator to be visible
 * 3. Close button to become visible
 * 4. Abort button to become hidden (indicating job completion)
 * 5. Network to be idle again (No more requests to check job status)
 * 
 * Each selector wait has a timeout of 100 seconds to accommodate long-running backup operations.
 * 
 * @throws Will throw if any of the expected elements don't appear/disappear within the timeout period
 */
export const waitForBackupJobCompletion = async (page: Page): Promise<void> => {
    const runningJob = '#runningjob';
    const closeButton = 'button#showworkingclose';
    const abortButton = 'button#abortbutton';
    await page.waitForLoadState('networkidle');
    await page.waitForSelector(runningJob, {
        state: 'visible',
        timeout: 100000
    });
    await page.waitForSelector(closeButton, {
        state: 'visible',
        timeout: 100000
    });
    await page.waitForSelector(abortButton, {
        state: 'hidden',
        timeout: 100000
    });
    await page.waitForLoadState('networkidle');
};
