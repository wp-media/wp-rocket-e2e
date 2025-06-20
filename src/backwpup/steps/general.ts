import {When} from "@cucumber/cucumber";
import {ICustomWorld} from "../../common/custom-world";

/**
 * Executes the step to enable all settings.
 */
When('I click on common backup now button', async function (this: ICustomWorld) {
    /**
     * Enable all settings and save,
     */
    await this.utils.enableAllOptions();
});