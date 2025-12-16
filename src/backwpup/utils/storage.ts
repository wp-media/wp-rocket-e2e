import {Page} from "@playwright/test";
import {Locators, Selector} from "../../../utils/types";
import {Sections} from "../../common/sections";
import {BACKWPUP_INFOS} from "../../../config/wp.config";
import { getFolderNameFromHost } from "./helpers";
import { DEFAULT_S3_REGION } from "../../types/s3-region-types";

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
     * Sets up storage provider configuration during the onboarding process.
     * Handles the UI interaction for selecting a storage provider and configures
     * it based on the provider type.
     *
     * @param storageProvider - The name of the storage provider to configure (e.g., 'ftp', 'sugarsync').
     *                          Case-insensitive.
     * @returns A promise that resolves when the storage provider setup is complete.
     * @throws {Error} Throws an error if no handler is found for the specified storage type.
     *
     * @example
     * ```typescript
     * await storage.setupStorageOnboarding('ftp');
     * await storage.setupStorageOnboarding('SugarSync');
     * ```
     */
    public setupStorageOnboarding = async (storageProvider: string): Promise<void> => {
        const storageType = storageProvider.toUpperCase();
        const storageHandlers: Record<string, () => Promise<void>> = {
            ftp: () => this.setupFTP(),
            sugarsync: () => this.setupSugarSync(),
            s3: () => this.setupS3(),
            glacier: () => this.setupGlacier()
        } as const;
        const storageButton = `#backwpup-onboarding-panes .js-backwpup-toggle-storage[data-storage="${storageType}"]`;
        const storageSidebar = `#backwpup-sidebar #sidebar-storage-${storageType}`;
        await this.page.click(storageButton);
        await this.page.waitForSelector(storageSidebar,
            {
                state: 'visible'
            }
        );
        const handler = storageHandlers[storageType.toLowerCase()];
        if (!handler) throw new Error(`No handler found for storage type: ${storageType}`);
        await handler();
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
        const timestamp = Date.now();
        const directoryName = getFolderNameFromHost();
        // Changing the directory name to prevent old backups to appear and affect the test
        await this.page.locator('#ftpdir').fill(`${directoryName}/${timestamp}`);
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
    /**
     * Configures Amazon S3 storage settings for BackWPup plugin.
     * 
     * This method fills in the S3 access key, secret key, selects the region,
     * optionally selects a bucket name, and tests the connection.
     * 
     * @returns A promise that resolves when the S3 setup and connection test are complete.
     */
    public setupS3 = async (): Promise<void> => {
        if (!BACKWPUP_INFOS.s3.accessKey || !BACKWPUP_INFOS.s3.secretKey) {
            throw new Error('S3 access key and secret key must be provided in BACKWPUP_INFOS.');
        }
        await this.page.locator('#s3accesskey').fill(BACKWPUP_INFOS.s3.accessKey);
        await this.page.locator('#s3secretkey').fill(BACKWPUP_INFOS.s3.secretKey);
        const region = BACKWPUP_INFOS.s3.region ?? DEFAULT_S3_REGION;
        await this.page.locator('#s3region').selectOption(region);
        await this.page.waitForSelector('#s3bucket', { state: 'visible' });

        BACKWPUP_INFOS.s3.bucketName && await this.page.locator('#s3bucket').selectOption(BACKWPUP_INFOS.s3.bucketName);
        // Click test connection.
        await this.page.click('.js-backwpup-test-S3-storage');

        await this.page.waitForResponse(response =>
            response.url().includes('/backwpup/v1/cloudsaveandtest') &&
            response.status() === 200
        );
    }
    /**
     * Sets up AWS Glacier storage configuration for BackWPup.
     * 
     * Configures the Glacier storage by filling in access credentials (either from Glacier-specific
     * or S3 credentials), selecting the region, optionally setting the vault name, and testing
     * the connection.
     * 
     * @returns A promise that resolves when the Glacier setup and connection test are complete.
     * @throws {Error} If neither Glacier access key/secret key nor S3 credentials are provided.
     */
    public setupGlacier = async (): Promise<void> => {
        // Use S3 credentials if specified, otherwise use Glacier-specific credentials
        const accessKey = BACKWPUP_INFOS.glacier.useS3Credentials
            ? BACKWPUP_INFOS.s3.accessKey
            : BACKWPUP_INFOS.glacier.accessKey;
        const secretKey = BACKWPUP_INFOS.glacier.useS3Credentials
            ? BACKWPUP_INFOS.s3.secretKey
            : BACKWPUP_INFOS.glacier.secretKey;
            
        if (!accessKey || !secretKey) {
            throw new Error('Glacier access key and secret key must be provided in BACKWPUP_INFOS or S3 credentials must be used.');
        }
        await this.page.locator('#glacieraccesskey').fill(accessKey);
        await this.page.locator('#glaciersecretkey').fill(secretKey);
        const region = BACKWPUP_INFOS.glacier.region ?? DEFAULT_S3_REGION;
        await this.page.locator('#glacierregion').selectOption(region);
        await this.page.waitForSelector('#glaciervault', { state: 'visible' });

        BACKWPUP_INFOS.glacier.vaultName && await this.page.locator('#glaciervault').fill(BACKWPUP_INFOS.glacier.vaultName);
        // Click test connection.
        await this.page.click('.js-backwpup-test-GLACIER-storage');

        await this.page.waitForResponse(response =>
            response.url().includes('/backwpup/v1/cloudsaveandtest') &&
            response.status() === 200
        );
    }
}