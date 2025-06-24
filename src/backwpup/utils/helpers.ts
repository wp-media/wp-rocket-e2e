import { ICustomWorld } from "../../common/custom-world";

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
    
        //Save and submit onboarding form
        await page.click('.js-backwpup-onboarding-submit-form');
    
        await page.waitForTimeout(60000);
    
        const closeButton = '#showworkingclose'
        await page.waitForSelector(closeButton, {
            state: 'visible',
            timeout: 10000
        });
        await page.click(closeButton);
};