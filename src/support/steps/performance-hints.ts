/**
 * @fileoverview
 * This module contains Cucumber step definitions using Playwright for asserting performance hints data clearing from DB, 
 * both ATF and LRC tables
 * 
 * @requires {@link ../../common/custom-world}
 * @requires {@link @playwright/test}
 * @requires {@link @cucumber/cucumber}
 */

import { ICustomWorld } from "../../common/custom-world";
import { WP_BASE_URL } from '../../../config/wp.config';
import { When, Then, Given } from '@cucumber/cucumber';
import { dbQuery, getWPTablePrefix, getPostDataFromTitle, updatePostStatus } from "../../../utils/commands";
import { extractFromStdout, seedData, checkData } from "../../../utils/helpers";

/*
 * Executes step to add hardcoded data to DB: ATF & LRC tables
 */ 
Given('performance hints data added to DB', async function (this: ICustomWorld) {
    const tablePrefix = await getWPTablePrefix();
    const tableNames = [
        `${tablePrefix}wpr_above_the_fold`,
        `${tablePrefix}wpr_lazy_render_content`
    ];

    // Define the data to be inserted
    const data = [
        // eslint-disable-next-line @typescript-eslint/naming-convention
        { url: `${WP_BASE_URL}/a`, is_mobile: 0, status: 'completed' },
        // eslint-disable-next-line @typescript-eslint/naming-convention
        { url: `${WP_BASE_URL}/b`, is_mobile: 0, status: 'completed' },
        // eslint-disable-next-line @typescript-eslint/naming-convention
        { url: `${WP_BASE_URL}/c`, is_mobile: 0, status: 'completed' }
    ];

    await Promise.all(tableNames.map(async (tableName) => {
        await dbQuery(`TRUNCATE TABLE ${tableName}`);
    }));

    await seedData(tableNames, data);
});

When('clear performance hints is clicked in admin bar', async function (this: ICustomWorld) {
    await this.page.locator('#wp-admin-bar-wp-rocket').hover();
    await this.page.waitForSelector('#wp-admin-bar-clear-performance-hints', { state: 'visible' });
    await this.page.locator('#wp-admin-bar-clear-performance-hints').click(); 
    await this.page.waitForSelector('text=WP Rocket: Critical images and Lazy Render data was cleared!', { state: 'visible' });
});

When('clear performance hints for this URL is clicked in admin bar', async function (this: ICustomWorld) {
    await this.page.locator('#wp-admin-bar-wp-rocket').hover();
    await this.page.waitForSelector('#wp-admin-bar-clear-performance-hints-data-url', { state: 'visible' });
    await this.page.locator('#wp-admin-bar-clear-performance-hints-data-url').click(); 
    await this.page.waitForLoadState('load', { timeout: 30000 });
});

/*
 * Executes the step to check all data has been cleared from ATF & LRC tables 
 * (home URL ignored as its the quickest to re-appear on prewarmup)
 */
Then('data is removed from the performance hints tables', async function (this: ICustomWorld) {
    const tablePrefix = await getWPTablePrefix();
    const tables = [`${tablePrefix}wpr_above_the_fold`, `${tablePrefix}wpr_lazy_render_content`];
    const data = [
        { url: `${WP_BASE_URL}/a` },
        { url: `${WP_BASE_URL}/b` },
        { url: `${WP_BASE_URL}/c` }
    ];

    await checkData(tables, data);
});

/*
 * Executes the step to check data has been cleared from ATF & LRC tables for specific URL
 */
Then('data for {string} is removed from the performance hints tables', async function (this: ICustomWorld, permalink: string) {
    const tablePrefix = await getWPTablePrefix();
    const tables = [`${tablePrefix}wpr_above_the_fold`, `${tablePrefix}wpr_lazy_render_content`];
    const data = [
        { url: `${WP_BASE_URL}/${permalink}` }
    ];

    await checkData(tables, data);
});

/*
 * Executes the step to check data still exists in the ATF & LRC tables for specific URL
 */
Then('data for {string} present in the performance hints tables', async function (this: ICustomWorld, permalink: string) {
    const tablePrefix = await getWPTablePrefix();
    const tables = [`${tablePrefix}wpr_above_the_fold`, `${tablePrefix}wpr_lazy_render_content`];
    const data = [
        { url: `${WP_BASE_URL}/${permalink}` }
    ];

    await checkData(tables, data, true);
});

When('switching the theme', async function (this: ICustomWorld) {
    await this.utils.gotoThemes();
    await this.page.locator('#wpbody-content > div.wrap > div.theme-browser.rendered > div > div:nth-child(2) > div.theme-id-container').hover();
    await this.page.waitForSelector('#wpbody-content > div.wrap > div.theme-browser.rendered > div > div:nth-child(2) > div.theme-id-container > div > a.button.activate', { state: 'visible' });
    await this.page.locator('#wpbody-content > div.wrap > div.theme-browser.rendered > div > div:nth-child(2) > div.theme-id-container > div > a.button.activate').click(); 
});

When ('I edit the content of post', async function (this: ICustomWorld) {
    await this.page.waitForSelector('#wp-admin-bar-edit', { state: 'visible' });
    await this.page.locator('#wp-admin-bar-edit').click();
    
    // Check for 'Update' button.
    const updateButton = this.page.getByRole('button', { name: 'Update', exact: true });

    try {
        // Wait for the 'Update' button.
        await updateButton.waitFor({ state: 'visible' });
        await updateButton.click();
    } catch (error) {
        // If 'Update' is not found, check for 'Save' button for WP version >= 6.6.2.
        const saveButton = this.page.getByRole('button', { name: 'Save', exact: true });
        
         // Wait for the 'Save' button.
         await saveButton.waitFor({ state: 'visible' });
         await saveButton.click();
    }

    await this.page.waitForSelector('[aria-label="Dismiss this notice"]', { state: 'visible' });
});

When ('{string} page is deleted', async function (this: ICustomWorld, permalink: string) {
    await this.utils.gotoPages();
    await this.page.locator('#post-search-input').fill(permalink);
    await this.page.locator('#search-submit').click();
    await this.page.locator('td.title.column-title.has-row-actions.column-primary.page-title > strong > a').hover();
    await this.page.waitForSelector('div.row-actions > span.trash > a', { state: 'visible' }); 
    await this.page.locator('div.row-actions > span.trash > a').click();
    await this.page.waitForSelector('#message', { state: 'visible' }); 
});


Then ('untrash and republish {string} page', async function (this: ICustomWorld, permalink: string) {
    const postDataStdout = await getPostDataFromTitle(permalink, 'trash', 'ID,post_title');
    const postData = await extractFromStdout(postDataStdout);
    await updatePostStatus(parseInt(postData[0].ID, 10), 'publish');
});