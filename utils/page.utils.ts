import type { Page } from '@playwright/test';


import { WP_BASE_URL, WP_USERNAME, WP_PASSWORD } from '../config/wp.config';
import { save_settings } from './helpers';

import { cache as Cache } from '../src/common/sections/cache';
import { fileOptimization } from '../src/common/sections/file.optimization';
import { media as Media } from '../src/common/sections/media';
import { preload as Preload } from '../src/common/sections/preload';
import { advancedRules } from '../src/common/sections/advanced.rules';
import { database as Database } from '../src/common/sections/database';
import { cdn as Cdn } from '../src/common/sections/cdn';
import { heartbeat as Heartbeat } from '../src/common/sections/heartbeat';
import { addons as Addons } from '../src/common/sections/addons';

export class pageUtils {
	readonly page: Page;
	readonly selectors;
	readonly locators;
    readonly sections;

    constructor( page: Page ){
        this.page = page;

        this.selectors = {
            'plugins': '#menu-plugins',
        };

        this.locators = {
            'plugin': page.locator( this.selectors.plugins )
        };

        this.sections = {
            'cache': new Cache(this.page),
            'fileOpt' : new fileOptimization(this.page),
            'media': new Media(this.page),
            'preload': new Preload(this.page),
            'advanced_rules': new advancedRules(this.page),
            'database': new Database(this.page),
            'cdn': new Cdn(this.page),
            'heartbeat': new Heartbeat(this.page),
            'addons': new Addons(this.page)
        };
    }

    wp_admin_login = async () => {
        // Fill username & password.
        await this.page.click('#user_login');
        await this.page.fill('#user_login', WP_USERNAME);
        await this.page.click('#user_pass');
        await this.page.fill('#user_pass', WP_PASSWORD);

        // Click login.
        await this.page.click('#wp-submit');
    }

    visit_page = async ( page_url: String ) => {
        await this.page.goto(WP_BASE_URL + '/' + page_url);
    }

    goto_plugin = async () => {
        await this.page.goto(WP_BASE_URL + '/wp-admin/plugins.php');
    }

    goto_wpr = async () => {
        await this.page.goto(WP_BASE_URL + '/wp-admin/options-general.php?page=wprocket#dashboard');
    }

    goto_new_post = async () => {
        await this.page.goto(WP_BASE_URL + '/wp-admin/post-new.php');
    }

    add_post_title = async (title: string, is_gutenberg = true) => {
        if (!is_gutenberg) {
            await this.page.locator('#title').fill(title);
            return;
        }

        await this.page.locator('[aria-label="Add title"]').fill(title);
    }

    save_draft = async (is_gutenberg = true) => {
        if (!is_gutenberg) {
            await this.page.locator('#save-post').click();
            return;
        }

        await this.page.locator('[aria-label="Save draft"]').click();
    }

    close_gutenberg_dialog = async () => {
        if (! await this.page.locator('[aria-label="Close dialog"]').isVisible()) {
            return;
        }
        await this.page.locator('[aria-label="Close dialog"]').click();
    }

    draft_posts = async () => {
        await this.page.goto(WP_BASE_URL + '/wp-admin/edit.php?post_status=draft&post_type=post');
    }

    post_preview = async () => {
        await this.page.locator('button:has-text("Preview")').click();
        await this.page.locator('text=Preview in new tab').click();
    }

    wpr_dropdown = async () => {
        await this.page.locator('#wp-admin-bar-wp-rocket').hover();
    }

    toggle_plugin_activation = async (plugin_slug: string, activate = true) => {
        if (!activate) {
            if (await this.page.locator('#activate-' + plugin_slug).isVisible()) {
                return;
            }
        } else {
            if (await this.page.locator('#deactivate-' + plugin_slug).isVisible()) {
                return;
            }
        }
       
        var action = activate ? '#activate-' : '#deactivate-';
        await this.page.locator(action + plugin_slug).click();

        if (!activate) {
            if (await this.page.locator('a:has-text("Force deactivation")').isVisible()) {
                // Force deactivation - No .Htaccess file.
                await this.page.locator('a:has-text("Force deactivation")').click();
            }
        }
    }

    goto_themes = async () => {
        await this.page.goto(WP_BASE_URL + '/wp-admin/themes.php');
    }

    goto_site_health = async () => {
        await this.page.goto(WP_BASE_URL + '/wp-admin/site-health.php');
    }

    goto_helper = async () => {
        await this.page.goto(WP_BASE_URL + '/wp-admin/tools.php?page=rocket_e2e_tests_helper');
    }

    upload_new_plugin = async (file) => {
        await this.page.goto(WP_BASE_URL + '/wp-admin/plugin-install.php');
        await this.page.locator('.upload-view-toggle').click();
        await this.page.locator('#pluginzip').setInputFiles(file);
        await this.page.waitForSelector('#install-plugin-submit');
        await this.page.locator('#install-plugin-submit').click({ timeout: 120000 });
    }

    wp_admin_logout = async () => {
        await this.page.locator('#wp-admin-bar-my-account').hover();
        await this.page.waitForSelector('#wp-admin-bar-logout');
        await this.page.locator('#wp-admin-bar-logout a').click();
    }

    auth = async () => {
        await this.visit_page('wp-admin');
        await this.wp_admin_login();
        await this.page.waitForURL(WP_BASE_URL + '/wp-admin/');
        await this.page.context().storageState({ path: './config/storageState.json' });
    }

    disable_all_options = async () => {
        await this.goto_wpr();

        // Disable all settings for cache section.
        await this.sections.cache.visit();
        await this.sections.cache.toggleEnableAll();
        await save_settings(this.page);

        await this.page.waitForLoadState('load', { timeout: 30000 });

        // Disable all settings for file optimization section.
        await this.sections.fileOpt.visit();
        await this.sections.fileOpt.toggleEnableAll();
        await save_settings(this.page);

        await this.page.waitForLoadState('load', { timeout: 30000 });

        // Disable all settings for Media section.
        await this.sections.media.visit();
        await this.sections.media.toggleEnableAll();
        await save_settings(this.page);

        await this.page.waitForLoadState('load', { timeout: 30000 });

        // Disable all settings for Preload section.
        await this.sections.preload.visit();
        await this.sections.preload.toggleEnableAll();
        await save_settings(this.page);

        await this.page.waitForLoadState('load', { timeout: 30000 });

        // Advanced rules section.
        await this.sections.advanced_rules.visit();
        await this.sections.advanced_rules.addRule('cache_reject_uri', '');
        await this.sections.advanced_rules.addRule('cache_reject_cookies', '');
        await this.sections.advanced_rules.addRule('cache_reject_ua', '');
        await this.sections.advanced_rules.addRule('cache_purge_pages', '');
        await this.sections.advanced_rules.addRule('cache_query_strings', '');
        await save_settings(this.page);

        await this.page.waitForLoadState('load', { timeout: 30000 });

        // Disable all settings for Database.
        await this.sections.database.visit();
        await this.sections.database.toggleEnableAll();
        await this.page.getByRole('button', { name: 'Save Changes and Optimize' }).click();

        await this.page.waitForLoadState('load', { timeout: 30000 });

        // Disable all settings for CDN.
        await this.sections.cdn.visit();
        await this.sections.cdn.toggleEnableAll();
        await save_settings(this.page);

        await this.page.waitForLoadState('load', { timeout: 30000 });

        // Disable all settings for Heartbeat.
        await this.sections.heartbeat.visit();
        await this.sections.heartbeat.toggleEnableAll();
        await save_settings(this.page);

        await this.page.waitForLoadState('load', { timeout: 30000 });

        // Disable all settings for Addons.
        await this.sections.addons.visit();
        await this.sections.addons.toggleEnableAll();
    }
}