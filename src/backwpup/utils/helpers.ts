import { ICustomWorld } from "../../common/custom-world";

/**
 * Waits for the specified onboarding continue button selector to become visible and then clicks it.
 *
 * @param page - The Playwright page instance used for interaction.
 * @param button - A selector string identifying the button element to click.
 * @throws Will throw an error if the button is not visible within the 10-second timeout.
 * @returns A promise that resolves once the click action is completed.
 */
export const clickContinueButton = async (page: ICustomWorld['page'], button: string): Promise<void> => {
    await page.waitForSelector(button, {
        state: 'visible',
        timeout: 10000
    });

    return await page.click(button);
};