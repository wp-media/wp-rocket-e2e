import type { Page } from '@playwright/test';
import type { Sections } from '../src/common/sections';
import type { Selector, Locators } from './types';

import { WP_BASE_URL, WP_USERNAME, WP_PASSWORD } from '../config/wp.config';

export class PageUtils {
    /**
     * Page instance
     * 
     * @property Page
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
     * Instatiate the class.
     *
     * @param page Page instance.
     * @param sections Sections instance.
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
     * Performs a Login action on Wordpress.
     *
     * @return  {Promise<void>}
     */
    public wpAdminLogin = async (): Promise<void> => {
        // Fill username & password.
        await this.page.click('#user_login');
        await this.page.fill('#user_login', WP_USERNAME);
        await this.page.click('#user_pass');
        await this.page.fill('#user_pass', WP_PASSWORD);

        // Click login.
        await this.page.click('#wp-submit');
    }

    /**
     * Performs a goto action on parsed url.
     *
     * @param pageUrl Page url.
     *
     * @return  {Promise<void>}
     */
    public visitPage = async ( pageUrl: string ): Promise<void> => {
        await this.page.goto(WP_BASE_URL + '/' + pageUrl);
    }

    /**
     * Navigates to plugin page.
     *
     * @return  {Promise<void>}
     */
    public gotoPlugin = async (): Promise<void> => {
        await this.page.goto(WP_BASE_URL + '/wp-admin/plugins.php');
    }

    /**
     * Navigates to WP Rocket settings page.
     *
     * @return  {Promise<void>}
     */
    public gotoWpr = async (): Promise<void> => {
        await this.page.goto(WP_BASE_URL + '/wp-admin/options-general.php?page=wprocket#dashboard');
    }

    /**
     * Navigates to new post on Wordpress.
     *
     * @return  {Promise<void>}
     */
    public gotoNewPost = async (): Promise<void> => {
        await this.page.goto(WP_BASE_URL + '/wp-admin/post-new.php');
    }

    /**
     * Performs action of Adding a new post in Wordpress.
     *
     * @param title        Post title
     * @param isGutenberg  If post Ui is Gutenberg or classic.
     *
     * @return  {Promise<void>}
     */
    public addPostTitle = async (title: string, isGutenberg: boolean = true): Promise<void> => {
        if (!isGutenberg) {
            await this.page.locator('#title').fill(title);
            return;
        }

        await this.page.locator('[aria-label="Add title"]').fill(title);
    }

    /**
     * Save a post as draft.
     *
     * @param isGutenberg  If post Ui is Gutenberg or classic.
     *
     * @return  {Promise<void>}
     */
    public saveDraft = async (isGutenberg: boolean = true): Promise<void> => {
        if (!isGutenberg) {
            await this.page.locator('#save-post').click();
            return;
        }

        await this.page.locator('[aria-label="Save draft"]').click();
    }

    /**
     * Close gutenberg tour dialog.
     *
     * @return  {Promise<void>}
     */
    public closeGutenbergDialog = async (): Promise<void> => {
        if (! await this.page.locator('[aria-label="Close dialog"]').isVisible()) {
            return;
        }
        await this.page.locator('[aria-label="Close dialog"]').click();
    }

    /**
     * Navigates to drafted posts.
     *
     * @return  {Promise<void>}
     */
    public draftPosts = async (): Promise<void> => {
        await this.page.goto(WP_BASE_URL + '/wp-admin/edit.php?post_status=draft&post_type=post');
    }

    /**
     * Peforms a post preview action.
     *
     * @return  {Promise<void>}
     */
    public postPreview = async (): Promise<void> => {
        await this.page.locator('button:has-text("Preview")').click();
        await this.page.locator('text=Preview in new tab').click();
    }

    /**
     * Peforms a WPR menu dropdown action.
     *
     * @return  {Promise<void>}[return description]
     */
    public wprDropdown = async (): Promise<void> => {
        await this.page.locator('#wp-admin-bar-wp-rocket').hover();
    }

    /**
     * Switch plugin activation state.
     *
     * @param pluginSlug  Plugin slug.
     * @param activate    Activate state.
     *
     * @return  {Promise<void>}
     */
    public togglePluginActivation = async (pluginSlug: string, activate: boolean = true): Promise<void> => {
        if (!activate) {
            if (await this.page.locator('#activate-' + pluginSlug).isVisible()) {
                return;
            }
        } else {
            if (await this.page.locator('#deactivate-' + pluginSlug).isVisible()) {
                return;
            }
        }
       
        const action = activate ? '#activate-' : '#deactivate-';
        await this.page.locator(action + pluginSlug).click();

        if (!activate) {
            if (await this.page.locator('a:has-text("Force deactivation")').isVisible()) {
                // Force deactivation - No .Htaccess file.
                await this.page.locator('a:has-text("Force deactivation")').click();
            }
        }
    }

    /**
     * Navigates to Wordpress themes page.
     *
     * @return  {Promise<void>}
     */
    public gotoThemes = async (): Promise<void> => {
        await this.page.goto(WP_BASE_URL + '/wp-admin/themes.php');
    }

    /**
     * Navigates to Wordpress site health page.
     *
     * @return  {Promise<void>}
     */
    public gotoSiteHealth = async (): Promise<void> => {
        await this.page.goto(WP_BASE_URL + '/wp-admin/site-health.php');
    }

    /**
     * Navigates to e2e helper plugin.
     *
     * @return  {Promise<void>}
     */
    public gotoHelper = async (): Promise<void> => {
        await this.page.goto(WP_BASE_URL + '/wp-admin/tools.php?page=rocket_e2e_tests_helper');
    }

    /**
     * Performs upload new plugin action.
     *
     * @param file File to be uploaded.
     *
     * @return  {Promise<void>}
     */
    public uploadNewPlugin = async (file: string): Promise<void> => {
        await this.page.goto(WP_BASE_URL + '/wp-admin/plugin-install.php');
        await this.page.locator('.upload-view-toggle').click();
        await this.page.locator('#pluginzip').setInputFiles(file);
        await this.page.waitForSelector('#install-plugin-submit');
        await this.page.locator('#install-plugin-submit').click({ timeout: 120000 });
    }

    /**
     * Performs Wordpress logout action.
     *
     * @return  {Promise<void>}
     */
    public wpAdminLogout = async (): Promise<void> => {
        if(! await this.page.locator('#wp-admin-bar-my-account').isVisible()) {
            return ;
        }
        await this.page.locator('#wp-admin-bar-my-account').hover();
        await this.page.waitForSelector('#wp-admin-bar-logout');
        await this.page.locator('#wp-admin-bar-logout a').click();
    }

    /**
     * Performs Wordpress login action.
     *
     * @return  {Promise<void>}
     */
    public auth = async (): Promise<void> => {
        await this.visitPage('wp-admin');
        await this.wpAdminLogin();
        await this.page.waitForURL(WP_BASE_URL + '/wp-admin/');
        await this.page.context().storageState({ path: './config/storageState.json' });
    }

    /**
     * Performs the disable all options action on WP Rocket.
     *
     * @return  {Promise<void>}
     */
    public disableAllOptions = async (): Promise<void> => {
        await this.gotoWpr();

        // Disable all settings for cache section.
        await this.sections.set("cache").visit();
        await this.sections.massToggle();
        await this.saveSettings();

        await this.page.waitForLoadState('load', { timeout: 30000 });

        // Disable all settings for file optimization section.
        await this.sections.set("fileOptimization").visit();
        await this.sections.massToggle();
        await this.saveSettings();

        await this.page.waitForLoadState('load', { timeout: 30000 });

        // Disable all settings for Media section.
        await this.sections.set("media").visit();
        await this.sections.massToggle();
        await this.saveSettings();

        await this.page.waitForLoadState('load', { timeout: 30000 });

        // Disable all settings for Preload section.
        await this.sections.set("preload").visit();
        await this.sections.massToggle();
        await this.saveSettings();

        await this.page.waitForLoadState('load', { timeout: 30000 });

        // Advanced rules section.
        await this.sections.set("advancedRules").visit();
        await this.sections.massFill("");
        await this.saveSettings();

        await this.page.waitForLoadState('load', { timeout: 30000 });

        // Disable all settings for Database.
        await this.sections.set("database").visit();
        await this.sections.massToggle();
        await this.page.getByRole('button', { name: 'Save Changes and Optimize' }).click();

        await this.page.waitForLoadState('load', { timeout: 30000 });

        // Disable all settings for CDN.
        await this.sections.set("cdn").visit();
        await this.sections.massToggle();
        await this.sections.fill("cnames", "");
        await this.saveSettings();

        await this.page.waitForLoadState('load', { timeout: 30000 });

        // Disable all settings for Heartbeat.
        await this.sections.set("heartbeat").visit();
        await this.sections.massToggle();
        await this.saveSettings();

        await this.page.waitForLoadState('load', { timeout: 30000 });

        // Disable all settings for Addons.
        await this.sections.set("addons").visit();
        await this.sections.massToggle();
    }

    /**
     * Performs the enable all options action on WP Rocket.
     *
     * @return  {Promise<void>}
     */
    public enableAllOptions = async (): Promise<void> => {
        await this.gotoWpr();

        await this.page.waitForLoadState('load', { timeout: 30000 });

        // Enable all settings for cache section.
        await this.sections.set("cache").visit();
        await this.sections.state(true).massToggle();
        await this.saveSettings();

        await this.page.waitForLoadState('load', { timeout: 30000 });

        // Enable all settings for file optimization section.
        await this.sections.set("fileOptimization").visit();
        await this.sections.massToggle();
        await this.saveSettings();

        await this.page.waitForLoadState('load', { timeout: 30000 });

        // Enable all settings for Media section.
        await this.sections.set("media").visit();
        await this.sections.massToggle();
        await this.saveSettings();

        await this.page.waitForLoadState('load', { timeout: 30000 });

        // Enable all settings for Preload section.
        await this.sections.set("preload").visit();
        await this.sections.massToggle();
        await this.saveSettings();

        await this.page.waitForLoadState('load', { timeout: 30000 });

         // Advanced rules section.
         await this.sections.set("advancedRules").visit();
         const values: Array<string> = ['/test\n/.*\n/test2', 'woocommerce_items_in_cart', 'Mobile(.*)Safari(.*)', '/hello-world/', 'country'];
         await this.sections.massFill(values);
         await this.saveSettings();
 
         await this.page.waitForLoadState('load', { timeout: 30000 });

        // Enable all settings for Database.
        await this.sections.set("database").visit();
        await this.sections.massToggle();
        await this.page.getByRole('button', { name: 'Save Changes and Optimize' }).click();

        await this.page.waitForLoadState('load', { timeout: 30000 });

         // Enable all settings for CDN.
         await this.sections.set("cdn").visit();
         await this.sections.toggle("cdn");
         await this.sections.fill("cnames", "test.example.com");
         await this.saveSettings();

         await this.page.waitForLoadState('load', { timeout: 30000 });

         // Enable all settings for Heartbeat.
         await this.sections.set("heartbeat").visit();
         await this.sections.toggle("controlHeartbeat");
         await this.saveSettings();

         await this.page.waitForLoadState('load', { timeout: 30000 });

         // Enable all settings for Addons.
         await this.sections.set("addons").visit();
         await this.sections.massToggle();
    }

    /**
     * Performs setting import action in WP Rocket.
     *
     * @param file file to be imported.
     *
     * @return  {Promise<void>}
     */
    public importSettings = async (file: string): Promise<void> => {
        await this.gotoWpr();
        await this.page.locator('#wpr-nav-tools').click();
        await this.page.locator('#upload').setInputFiles(file);
        await this.page.locator('.wpr-tools:nth-child(3) button').click({ timeout: 120000 });
    }

    /**
     * Performs the save settings action on WP Rocket.
     *
     * @return  {Promise<void>}
     */
    public saveSettings = async (): Promise<void> => {
        await this.page.waitForSelector('#wpr-options-submit');
        // save settings
        await this.page.locator('#wpr-options-submit').click();
    }
}