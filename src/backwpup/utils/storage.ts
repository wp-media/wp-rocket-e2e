import {Page} from "@playwright/test";
import {Locators, Selector} from "../../../utils/types";
import {Sections} from "../../common/sections";
import {WP_PASSWORD, WP_PASSWORD2, WP_USERNAME, WP_USERNAME2} from "../../../config/wp.config";

export class StorageUtils {
    /**
     * Page instance
     *
     * @property {Page}
     */
    readonly page: Page;

    /**
     * Plugin Selector
     *
     * @property {Selector}
     */
    private selector: Selector;

    /**
     * Plugin Locator.
     *
     * @property {Locators}
     */
    public locators: Locators;

    /**
     * Sections instance.
     *
     * @property {Sections}
     */
    private sections: Sections;

    /**
     * Instantiate the class.
     *
     * @param {Page} page - Page instance.
     * @param {Sections} sections - Sections instance.
     */
    constructor( page: Page, sections: Sections ){
        this.page = page;

        this.selector = {
            'plugins': '#menu-plugins',
        };

        this.locators = {
            'plugin': page.locator( this.selector.plugins )
        };

        this.sections = sections;
    }

    /**
     * Performs a Login action on WordPress.
     *
     * @return {Promise<void>}
     */
    public setupMSAzure = async (): Promise<void> => {
        const username = WP_USERNAME2;
        const password = WP_PASSWORD;

        await this.page.click('#msazureaccname');
        await this.page.fill('#msazureaccname', username);
        await this.page.click('#msazureaccname');
        await this.page.fill('#msazurekey', password);
        await this.page.click('#msazureaccname');
        await this.page.fill('#msazurekey', password);

        // Click login.
        await this.page.click('.js-backwpup-test-MSAZURE-storage');
    }
}