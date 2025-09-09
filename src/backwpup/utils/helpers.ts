import { ICustomWorld } from "../../common/custom-world";
import { Page } from '@playwright/test';

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
        await page.waitForTimeout(2000);
        const closeButton = '#showworkingclose'
    
        //Save and submit onboarding form
        await page.click('.js-backwpup-onboarding-submit-form');
        // Wait for sidebar closing animation
        await waitForBackupJobCompletion(page);
        await page.click(closeButton);
};
