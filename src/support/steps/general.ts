import { expect } from "@playwright/test";
import { ICustomWorld } from "../../common/custom-world";

import { Given, When, Then } from '@cucumber/cucumber';
import { WP_BASE_URL } from '../../../config/wp.config';
import { createReference, compareReference } from "../../../utils/helpers";
import type { Section } from "../../../utils/types";

/**
 * Performs a WordPress precondition login action.
 * 
 * @step
 * 
 * @example
 * Given I am logged in
 */
Given('I am logged in', async function (this: ICustomWorld) {
    await this.utils.auth();
});

/**
 * Performs an action to install WP Rocket Current Version.
 * 
 * @step
 * 
 * @example
 * Given plugin is installed
 */
Given('plugin is installed', async function (this: ICustomWorld) {
    await this.utils.uploadNewPlugin('./plugin/new_release.zip');
    await this.page.waitForLoadState('load', { timeout: 30000 });
    await expect(this.page).toHaveURL(/action=upload-plugin/); 
});


/**
 * Performs an action to activate WP Rocket after installation.
 * 
 * @step
 * 
 * @example
 * Given plugin is installed
 */
Given('plugin is activated', async function (this: ICustomWorld) {
    // Activate WPR
    await this.page.waitForSelector('a:has-text("Activate Plugin")');
    await this.page.locator('a:has-text("Activate Plugin")').click();
});

/**
 * Performs an action to save a specific WP Rocket setting/option.
 * 
 * @step
 * @param {string} section - WP Rocket Section.
 * @param {string} element - Element attributes from selectors object.
 * 
 * @example
 * Given plugin is installed
 */
Given('I save settings {string} {string}', async function (this: ICustomWorld, section: Section, element: string) {
    await this.sections.set(section).visit();
    await this.sections.state(true).toggle(element);
    await this.utils.saveSettings();

    await this.page.waitForLoadState('load', { timeout: 30000 });
});


/**
 * Performs a WordPress login action.
 * 
 * @step
 * 
 * @example
 * Given I am logged in
 */
When('I log in', async function (this: ICustomWorld) {
    await this.utils.auth();
});


/**
 * Performs an action to navigate to specific page.
 * 
 * @step
 * @param {string} page - The page to be visited.
 * 
 * @example
 * When I go to 'wp-admin/options-general.php?page=wprocket#dashboard'
 */
When('I go to {string}', async function (this: ICustomWorld, page) {
    await this.utils.visitPage(page);
    await this.page.waitForLoadState('load', { timeout: 100000 });
});

/**
 * Performs an action to navigate to specific page.
 * 
 * @step
 * @param {string} selector - The selector to be clicked on.
 * 
 * @example
 * When I click on '.wpr-tools:nth-child(4) a'
 */
When('I click on {string}', async function (this: ICustomWorld, selector) {
    if (selector === '.wpr-tools:nth-child(4) a') {
        /**
         * Save WP Rocket last major version.
         */
        // Navigate to helper plugin page.
        await this.utils.gotoHelper();
        // Go to tools tab
        await this.page.locator('#tools_tab').click();
        await this.page.waitForSelector('#save_last_major_version');
        await this.page.locator('#save_last_major_version').click();
        await this.page.waitForLoadState('load', { timeout: 30000 });
        await this.utils.gotoWpr();
        await this.page.locator('#wpr-nav-tools').click();
    }
    await this.page.locator(selector).click();
    await this.page.waitForLoadState('load', { timeout: 100000 });
});

/**
 * Performs an action to enable all WP Rocket settings.
 * 
 * @step
 * 
 * @example
 * When I enable all settings
 */
When('I enable all settings', async function (this: ICustomWorld) {
    /**
     * Enable all settings and save, 
     */
    await this.utils.enableAllOptions();
});

/**
 * Performs an action to log out of WordPress.
 * 
 * @step
 * 
 * @example
 * When I log out
 */
When('I log out', async function (this: ICustomWorld) {
    await this.utils.wpAdminLogout();
    await this.page.waitForLoadState('load', { timeout: 30000 });
});

/**
 * Performs an action to visit site homepage.
 * 
 * @step
 * 
 * @example
 * When I visit site url
 */
When('I visit site url', async function (this: ICustomWorld) {
    await this.page.goto(WP_BASE_URL);
});

/**
 * Performs an action to create Backstop reference for specific url parsed via the cli.
 * 
 * @step
 * 
 * @example
 * When I create reference
 */
When('I create reference', async function (this:ICustomWorld) {
    if (process.env.npm_config_url === undefined) {
        return;
    }

    await createReference(process.env.npm_config_url);
});

/**
 * Asserts that a string of text must be visible.
 * 
 * @step
 * @param {string} text - String of text.
 * 
 * @example
 * Then I should see 'hello'
 */
Then('I should see {string}', async function (this: ICustomWorld, text) {
    await expect(this.page.getByText(text)).toBeVisible();
});

/**
 * Asserts that there must be no error in Wordpress debug.log.
 * 
 * @step
 * 
 * @example
 * Then I must not see any error in debug.log
 */
Then('I must not see any error in debug.log', async function (this: ICustomWorld){
    // Goto WP Rocket dashboard
    await this.utils.gotoWpr();
    await this.page.waitForLoadState('load', { timeout: 30000 });
    // Assert that there is no related error in debug.log
    await expect(this.page.locator('#wpr_debug_log_notice')).toBeHidden();
});

/**
 * Performs an action to clean up test site.
 * 
 * @step
 * 
 * @example
 * Then clean up
 */
Then('clean up', async function (this: ICustomWorld) {

    // Confirm Dialog Box.
    this.page.on('dialog', async(dialog) => {
        expect(dialog.type()).toContain('confirm');
        expect(dialog.message()).toContain('Are you sure you want to delete WP Rocket and its data?');
        await dialog.accept();
    });

    // Goto plugins page.
    await this.utils.gotoPlugin();

    if (!await this.page.getByRole('cell', { name: 'WP Rocket Settings | FAQ | Docs | Support | Deactivate WP Rocket' }).getByRole('strong').isVisible() && !await this.page.getByRole('cell', { name: 'Activate WP Rocket | Delete WP Rocket' }).getByRole('strong').isVisible()) {
        return;
    }

    // Ensure WPR is deactivated.
    await this.utils.togglePluginActivation('wp-rocket', false);

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
});

/**
 * Asserts that there is no visual regression.
 * 
 * @step
 * @param {string} label Scenario label.
 * @example
 * Then I must not see any visual regression
 */
Then('I must not see any visual regression {string}', async function (this: ICustomWorld, label: string) {
    await compareReference(label);
});