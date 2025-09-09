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
    public setupFTPOnboarding = async (): Promise<void> => {
        const ftpButton =
            '#backwpup-onboarding-panes .js-backwpup-toggle-storage[data-storage="FTP"]';
        const ftpSidebar = '#backwpup-sidebar #sidebar-storage-FTP';
        await this.page
            .click(
                ftpButton
            );
        await this.page.waitForSelector(
            ftpSidebar,
            {
                state: 'visible'
            }
        );
        await this.setupFTP();
    }
    /**
     * Configures FTP storage settings and tests the connection.
     *
     * @return {Promise<void>}
     */
    public setupFTP = async (): Promise<void> => {
        // Text fields
        await this.page.locator('#ftphost').fill(BACKWPUP_INFOS.ftp.host);
        await this.page.locator('#ftpuser').fill(BACKWPUP_INFOS.ftp.username);
        await this.page.locator('#ftppass').fill(BACKWPUP_INFOS.ftp.password);
        await this.page.locator('#ftphostport').fill(BACKWPUP_INFOS.ftp.port ?? '21');
        // Checkboxes
        await this.page.locator('#ftpssl').setChecked(BACKWPUP_INFOS.ftp.ssl, { force: true });
        await this.page.locator('#ftppasv').setChecked(BACKWPUP_INFOS.ftp.passiveMode, { force: true });
        const currentValue = await this.page.locator('#ftpdir').inputValue();
        const timestamp = Date.now();
        // Changing the directory name to prevent old backups to appear and affect the test
        await this.page.locator('#ftpdir').fill(`${currentValue}${timestamp}`);
        await this.page.click('.js-backwpup-test-FTP-storage');

        await this.page.waitForResponse(response =>
            response.url().includes('/backwpup/v1/cloudsaveandtest') &&
            response.status() === 200
        );
    }
    /**
     * Configures SugarSync storage settings and tests the connection.
     *
     * @return {Promise<void>}
     */
    public setupSugarSync = async (): Promise<void> => {
        const loginOverlaySelector =
            '#sidebar-storage-SUGARSYNC > div.backwpup-loading-overlay';
        await this.page.locator('#sugaremail').fill(BACKWPUP_INFOS.sugarsync.email);
        await this.page.locator('#sugarpass').fill(BACKWPUP_INFOS.sugarsync.password);
        await this.page.click('.js-backwpup-authenticate-sugar-sync');
        await this.page.waitForSelector(
            loginOverlaySelector,
            {
                state: 'visible'
            }
        );
        await this.page.waitForSelector(
            loginOverlaySelector,
            {
                state: 'hidden'
            }
        );
        await this.page.click('.js-backwpup-test-SUGARSYNC-storage');

        await this.page.waitForResponse(response =>
            response.url().includes('/backwpup/v1/cloudsaveandtest') &&
            response.status() === 200
        );
    }
}