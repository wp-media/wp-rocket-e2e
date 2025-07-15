import {Page} from "@playwright/test";
import {Locators, Selector} from "../../../utils/types";
import {Sections} from "../../common/sections";
import {BACKWPUP_INFOS} from "../../../config/wp.config";

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

        await this.page.type('#msazureaccname', BACKWPUP_INFOS.msazure.accountName);
        await this.page.type('#msazurekey', BACKWPUP_INFOS.msazure.accessKey);

        await this.page.waitForResponse(response =>
            response.url().includes('admin-ajax.php') &&
            response.status() === 200
        );

        await this.page.waitForSelector('#msazurecontainer', { state: 'visible' });

        // Click login.
        await this.page.click('.js-backwpup-test-MSAZURE-storage');

        await this.page.waitForResponse(response =>
            response.url().includes('/backwpup/v1/cloudsaveandtest') &&
            response.status() === 200
        );
    }
}