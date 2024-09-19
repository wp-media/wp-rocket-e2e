/**
 * @fileoverview
 * This module provides utility functions for interacting with Playwright's Page class in the context of WordPress testing.
 *
 * @requires {@link @playwright/test}
 * @requires {@link ../src/common/sections}
 * @requires {@link ./types}
 * @requires {@link ../config/wp.config}
 * @requires {@link ./configurations}
 */
import type {Page} from '@playwright/test';
import type {Sections} from '../src/common/sections';
import type {Locators, Selector, Pickle} from './types';
import {expect} from "@playwright/test";
import { ICustomWorld } from '../src/common/custom-world';
import fs from "fs/promises";

import {WP_BASE_URL, WP_PASSWORD, WP_USERNAME} from '../config/wp.config';
import { uninstallPlugin } from "./commands";

/**
 * Utility class for interacting with a Playwright Page instance in WordPress testing.
 */
export class PageUtils {
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
     * @param {string} pageUrl Page url.
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
     * Navigates to Imagify settings page.
     *
     * @return {Promise<void>}
     */
    public gotoImagify = async (): Promise<void> => {
        await this.page.goto(WP_BASE_URL + '/wp-admin/options-general.php?page=imagify');
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
        if (await this.page.locator(action + pluginSlug).isVisible()) {
            await this.page.locator(action + pluginSlug).click();
        }

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
     * @return  {Promise<void>}
     */
    public uploadNewPlugin = async (file: string): Promise<void> => {
        await this.page.goto(WP_BASE_URL + '/wp-admin/plugin-install.php');
        await this.page.waitForSelector('.upload-view-toggle');
        await this.page.locator('.upload-view-toggle').click();
        await this.page.locator('#pluginzip').setInputFiles(file);
        await this.page.waitForSelector('#install-plugin-submit');
        await this.page.locator('#install-plugin-submit').click();
    }

    /**
     * Performs Wordpress logout action.
     *
     * @return  {Promise<void>}
     */
    public wpAdminLogout = async (): Promise<void> => {
        await this.page.locator('#wp-admin-bar-my-account').isVisible();
        await this.page.locator('#wp-admin-bar-my-account').hover();
        await this.page.waitForSelector('#wp-admin-bar-logout');
        await this.page.locator('#wp-admin-bar-logout a').click();
        await expect(this.page.getByText('You are now logged out.')).toBeVisible();
    }    

    /**
     * Performs Wordpress login action.
     *
     * @return  {Promise<void>}
     */
    public  auth = async (): Promise<void> => {
        if(! this.page.url().includes('wp-login.php')) {
            await this.visitPage('wp-admin');
        }

        if(! await this.page.locator('#user_login').isVisible()) {
            return ;
        }

        await this.wpAdminLogin();
      
    }

    /**
     * Performs the disable all options action on WP Rocket.
     *
     * @return  {Promise<void>}
     */
    public disableAllOptions = async (): Promise<void> => {
        await this.gotoWpr();

        this.sections.optionState = false;

        if(await this.sections.doesSectionExist('cache')) {
            // Disable all settings for cache section.
            await this.sections.set("cache").visit();
            await this.sections.massToggle();
            await this.saveSettings();
            await expect(this.page.getByText('Settings saved.')).toBeVisible();
            await this.page.locator('#setting-error-settings_updated > button').click();
            
        }

        if(await this.sections.doesSectionExist('fileOptimization')) {
            // Disable all settings for file optimization section.
            await this.sections.set("fileOptimization").visit();
            await this.sections.massToggle();
            await this.saveSettings();
            await expect(this.page.getByText('Settings saved.')).toBeVisible();
            await this.page.locator('#setting-error-settings_updated > button').click();
           
        }

        if(await this.sections.doesSectionExist('media')) {
            // Disable all settings for Media section.
            await this.sections.set("media").visit();
            await this.sections.massToggle();
            await this.saveSettings();
            await expect(this.page.getByText('Settings saved.')).toBeVisible();
            await this.page.locator('#setting-error-settings_updated > button').click();
           
        }

        if(await this.sections.doesSectionExist('preload')) {
            // Disable all settings for Preload section.
            await this.sections.set("preload").visit();
            await this.sections.massToggle();
            await this.saveSettings();
            await expect(this.page.getByText('Settings saved.')).toBeVisible();
            await this.page.locator('#setting-error-settings_updated > button').click();
        }

        if(await this.sections.doesSectionExist('advancedRules')) {
            // Advanced rules section.
            await this.sections.set("advancedRules").visit();
            await this.sections.massFill("");
            await this.saveSettings();
            await expect(this.page.getByText('Settings saved.')).toBeVisible();
            await this.page.locator('#setting-error-settings_updated > button').click();
        }

        if(await this.sections.doesSectionExist('database')) {
            // Disable all settings for Database.
            await this.sections.set("database").visit();
            await this.sections.massToggle();
            await this.page.getByRole('button', { name: 'Save Changes and Optimize' }).click();
            await expect(this.page.getByText('Settings saved.')).toBeVisible();
            await this.page.locator('#setting-error-settings_updated > button').click();
        }   

        if(await this.sections.doesSectionExist('cdn')) {
            // Disable all settings for CDN.
            await this.sections.set("cdn").visit();
            await this.sections.massToggle();
            await this.sections.fill("cnames", "");
            await this.saveSettings();
            await expect(this.page.getByText('Settings saved.')).toBeVisible();
            await this.page.locator('#setting-error-settings_updated > button').click();
           
        }

        if(await this.sections.doesSectionExist('addons')) {
            // Disable all settings for Addons.
            await this.sections.set("addons").visit();
            await this.sections.massToggle();
        }

        if(await this.sections.doesSectionExist('heartbeat')) {
            // Disable all settings for Heartbeat.
            await this.sections.set("heartbeat").visit();
            await this.sections.massToggle();
            await this.saveSettings();
            await expect(this.page.getByText('Settings saved.')).toBeVisible();
            
        }


    }

    /**
     * Performs to clear all cache action on WP Rocket.
     *
     * @return  {Promise<void>}
     */
    public clearWPRCache = async(): Promise<void> => {
        await this.gotoWpr();
        await this.page.waitForLoadState('load', { timeout: 30000 });

        const clearCacheURL = await this.page.locator('.wpr-button.wpr-button--icon.wpr-icon-trash').first().getAttribute('href');

        await this.page.goto(clearCacheURL);
        await this.page.waitForLoadState('load', { timeout: 30000 });
    }

    /**
     * Performs the enable all options action on WP Rocket.
     *
     * @return  {Promise<void>}
     */
    public enableAllOptions = async (): Promise<void> => {
        await this.gotoWpr();

        this.sections.optionState = true;

        if (await this.sections.doesSectionExist('cache')) {
             // Enable all settings for cache section.
            await this.sections.set("cache").visit();
            await this.sections.massToggle();
            await this.saveSettings();
            await expect(this.page.getByText('Settings saved.')).toBeVisible();
        }

        if(await this.sections.doesSectionExist('fileOptimization')) {
            // Enable all settings for file optimization section.
            await this.sections.set("fileOptimization").visit();
            await this.sections.massToggle();
            await this.saveSettings();
            await expect(this.page.getByText('Settings saved.')).toBeVisible();
        }
        
        if (await this.sections.doesSectionExist('media')) {
             // Enable all settings for Media section.
            await this.sections.set("media").visit();
            await this.sections.massToggle();
            await this.saveSettings();
            await expect(this.page.getByText('Settings saved.')).toBeVisible();
        }
       
        if (await this.sections.doesSectionExist('preload')) {
            // Enable all settings for Preload section.
            await this.sections.set("preload").visit();
            await this.sections.massToggle();
            await this.saveSettings();
            await expect(this.page.getByText('Settings saved.')).toBeVisible();  
        }

        if(await this.sections.doesSectionExist('advancedRules')) {
            // Advanced rules section.
            await this.sections.set("advancedRules").visit();
            const values: Array<string> = ['/test\n/.*\n/test2', 'woocommerce_items_in_cart', 'Mobile(.*)Safari(.*)', '/hello-world/', 'country'];
            await this.sections.massFill(values);
            await this.saveSettings();
            await expect(this.page.getByText('Settings saved.')).toBeVisible();
        }

        if(await this.sections.doesSectionExist('database')) {
            // Enable all settings for Database.
            await this.sections.set("database").visit();
            await this.sections.massToggle();
            await this.page.getByRole('button', { name: 'Save Changes and Optimize' }).click();
            await expect(this.page.getByText('Database optimization process is complete')).toBeVisible();
        }

        if(await this.sections.doesSectionExist('cdn')) {
            // Enable all settings for CDN.
            await this.sections.set("cdn").visit();
            await this.sections.toggle("cdn");
            await this.sections.fill("cnames", "test.example.com");
            await this.saveSettings();
            await expect(this.page.getByText('Settings saved.')).toBeVisible();
            await this.page.locator('#setting-error-settings_updated > button').click();
        }

        if(await this.sections.doesSectionExist('addons')) {
            // Enable all settings for Addons.
            await this.sections.set("addons").visit();
            await this.sections.massToggle();
        }

        if(await this.sections.doesSectionExist('heartbeat')) {
            // Enable all settings for Heartbeat.
            await this.sections.set("heartbeat").visit();
            await this.sections.toggle("controlHeartbeat");
            await this.saveSettings();
            await expect(this.page.getByText('Settings saved.')).toBeVisible();
        }

    
    }

    /**
     * Performs setting import action in WP Rocket.
     *
     * @param {string} file file to be imported.
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
     * @return {Promise<void>}
     */
    public saveSettings = async (): Promise<void> => {
        await this.page.waitForSelector('#wpr-options-submit');
        // save settings
        await this.page.locator('#wpr-options-submit').click();
    }

    /**
     * Performs a clean up(Remove WP Rocket and maybe resetting the test env)
     *
     * @return  {Promise<void>}
     */
    public cleanUp = async (): Promise<void> => {
        // Remove helper plugin.
        await uninstallPlugin('force-wp-mobile');

        // Start the process to remove wp-rocket.
        await this.visitPage('wp-admin');
        await this.auth();

        // Confirm Dialog Box.
        this.page.on('dialog', async(dialog) => {
            expect(dialog.type()).toContain('confirm');
            expect(dialog.message()).toContain('Are you sure you want to delete WP Rocket and its data?');
            await dialog.accept();
        });

        // Goto plugins page.
        await this.gotoPlugin();

        if (!await this.page.getByRole('cell', { name: 'WP Rocket Settings | FAQ | Docs | Support | Deactivate WP Rocket' }).getByRole('strong').isVisible() && !await this.page.getByRole('cell', { name: 'Activate WP Rocket | Delete WP Rocket' }).getByRole('strong').isVisible()) {
            return;
        }

        // Ensure WPR is deactivated.
        await this.togglePluginActivation('wp-rocket', false);

        // Check for deactivation modal.
        if (await this.page.locator('label[for=deactivate]').isVisible()) {
            await this.page.locator('label[for=deactivate]').click();
            await this.page.locator('text=Confirm').click();
        }

        await this.page.waitForLoadState('load', { timeout: 30000 });

        // Delete WPR.
        await this.page.locator( '#delete-wp-rocket' ).click();

        if (await this.page.getByRole('button', { name: 'Yes, delete these files and data' }).isVisible()) {
            await this.page.getByRole('button', { name: 'Yes, delete these files and data' }).click();
            await expect(this.page.locator('#activate-wp-rocket')).toBeHidden();
        }  

        // Assert that WPR is deleted successfully
        await this.page.waitForSelector('#wp-rocket-deleted');
        await expect(this.page.locator('#wp-rocket-deleted')).toBeVisible(); 
    }

    /**
     * Create cucumber screenshot.
     *
     * @param   {ICustomWorld}     world   ICustomWorld Interface
     * @param   {Pickle}  pickle  Pickle Object.
     *
     * @return  {Promise<void>}
     */
    public async createScreenShot(world: ICustomWorld, pickle: Pickle): Promise<void> {        
        const img: Buffer = await this.page?.screenshot({ path: `./test-results/screenshots/${pickle.name}.png`, type: "png" })
        const videoPath: string = await this.page?.video().path();

        world.attach(
            img, "image/png"
        );

        const file = await fs.readFile(videoPath);
        world.attach(
            file,
            'video/webm'
        );
    }

    /**
     * Switch theme.
     *
     * @param   {string}  theme  Theme to activate.
     *
     * @return  {Promise<void>}
     */
    public async switchTheme(theme: string): Promise<void> {
        await this.visitPage('wp-admin/themes.php');
        await this.page.locator('#wp-filter-search-input').fill(theme);
        // Wait for filtered theme to be displayed.
        await this.page.waitForTimeout(2000);

        const filteredTheme = this.page.locator(`[data-slug="${theme}"]`);
        if (! await filteredTheme.isVisible()) {
            return;
        }

        // Hover and activate theme.
        await filteredTheme.hover();

        const activate = this.page.locator(`[data-slug="${theme}"] .theme-actions .activate`);
        if (! await activate.isVisible()) {
            return;
        }   

        await activate.click();
    }

    /**
     * Scroll down to the bottom of a page
     *
     * @return  {Promise<void>}
     */
    public scrollDownBottomOfAPage = async (): Promise<void> => {
        await this.page.evaluate(async () => {
            const scrollPage: Promise<void> = new Promise((resolve) => {

                let totalHeight = 0;
                const distance = 150;
                const timer = setInterval(() => {
                    const scrollHeight = document.body.scrollHeight;
                    window.scrollBy(0, distance);
                    totalHeight += distance;

                    if (totalHeight >= scrollHeight) {
                        clearInterval(timer);
                        resolve();
                    }
                }, 700);
            });

            await scrollPage;
        });
    }
}