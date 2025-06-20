import {When} from "@cucumber/cucumber";
import {ICustomWorld} from "../../common/custom-world";


/**
 * Click on save and continue button during onboarding.
 *
*/
When('I click {string} button to continue', async function (this: ICustomWorld, button) {

    await this.page.waitForSelector(button, {
        state: 'visible',
        timeout: 10000
    });

    await this.page.click(button);
});

When('I Configure web server storage', async function (this: ICustomWorld) {
    await this.page.locator('.js-backwpup-toggle-storage').first().click();
    await this.page.click('.js-backwpup-test-FOLDER-storage')

    //Save and submit onboarding form
    await this.page.click('.js-backwpup-onboarding-submit-form');

    await this.page.waitForTimeout(60000);

    const closeButton = '#showworkingclose'
    await this.page.waitForSelector(closeButton, {
        state: 'visible',
        timeout: 10000
    });
    await this.page.click(closeButton)
});