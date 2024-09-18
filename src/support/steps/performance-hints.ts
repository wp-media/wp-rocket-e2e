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
import { When, Then } from '@cucumber/cucumber';
import { dbQuery, getWPTablePrefix } from "../../../utils/commands";
import { extractFromStdout } from "../../../utils/helpers";
import { expect } from "@playwright/test";

/**
 * Gets page title from URL path.
 *
 * @param {string} path - URL Path.
 * @returns {string} - String of title from path.
 */
const getTitleFromPath = (path: string): string => {
    return path.replace(/-/g, ' ');
}

/*
 * Executes step to add hardcoded data to DB: ATF & LRC tables
 */ 
When('performance hints data added to DB', async function (this: ICustomWorld) {
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

    // Build the insert SQL statement
    const values = data.map(row => `("${row.url}", ${row.is_mobile}, "${row.status}")`).join(',');
    const insertSql = `INSERT INTO %s (url, is_mobile, status) VALUES ${values}`;
    const selectSql = `SELECT url, is_mobile, status FROM %s`;

    // Function to convert tabular data to array of objects
    const parseTabularData = (tabularData: string): Array<{ [key: string]: string }> => {
        const lines = tabularData.trim().split('\n');
        const headers = lines.shift().split('\t');
        return lines.map(line => {
            const values = line.split('\t');
            return headers.reduce((obj, header, index) => {
                obj[header.trim()] = values[index].trim();
                return obj;
            }, {});
        });
    };

    // Function to insert data and fetch filtered results
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const processTable = async (tableName: string): Promise<Array<{ url: string; is_mobile: number; status: string }>> => {
        // Log SQL before executing for debugging
        console.log(`Truncating table: ${tableName}`);
        await dbQuery(`TRUNCATE TABLE ${tableName}`);

        const insertQuery = insertSql.replace('%s', tableName);
        console.log(`Executing insert SQL: ${insertQuery}`);
        await dbQuery(insertQuery);

        // Fetch the data from the table
        const selectQuery = selectSql.replace('%s', tableName);
        const resultString = await dbQuery(selectQuery);
        
        // Log the raw result to debug
        console.log(`Raw result from ${tableName}:`, resultString);

        // Convert the result
        const result = parseTabularData(resultString);

        // Log the result after conversion, before filtering
        console.log(`Result from ${tableName} before filtering:`, result);

        // Filter out the rows that match the hardcoded data
        const filteredResult = data.filter(hardcodedRow => 
            result.some(dbRow => 
                dbRow.url === hardcodedRow.url && 
                Number(dbRow.is_mobile) === hardcodedRow.is_mobile && 
                dbRow.status === hardcodedRow.status
            )
        );

        console.log(`Filtered result from ${tableName}:`, filteredResult);

        // Check if the filtered result contains all the hardcoded data
        expect(filteredResult.length).toBe(data.length); // Ensure all hardcoded data is found
    
        return filteredResult;
    };

    // Process both tables
    const [resultFromTable1, resultFromTable2] = await Promise.all(tableNames.map(processTable));

    // Log the filtered results for both tables
    console.log('Data in the first table:', resultFromTable1);
    console.log('Data in the second table:', resultFromTable2);
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
});

/*
 * Executes the step to check all data has been cleared from ATF & LRC tables 
 * (home URL ignored as its the quickest to re-appear on prewarmup)
 */
Then('data is removed from the performance hints tables', async function (this: ICustomWorld) {
    const tablePrefix = await getWPTablePrefix();
    const tables = [`${tablePrefix}wpr_above_the_fold`, `${tablePrefix}wpr_lazy_render_content`];

    // Helper function to check if data is removed from a table
    const verifyTableIsEmpty = async (tableName: string): Promise<void> => {
        // Construct SQL query to select all rows
        const selectSql = `SELECT * FROM ${tableName}`;
        const result = await dbQuery(selectSql); 
        const resultFromStdout = await extractFromStdout(result);

        // URLs to check
        const urlsToDelete = [
            `${WP_BASE_URL}/a`,
            `${WP_BASE_URL}/b`,
            `${WP_BASE_URL}/c`
        ];
        
        // Filter out any URL that exists in the dataset and adds it to the constant.
        const missingUrls = urlsToDelete.filter(url => {
            return !resultFromStdout.some(item => item.url === url);
        });

        expect(urlsToDelete.length).toBe(missingUrls.length);
    };

    // Verify both tables
    for (const table of tables) {
        await verifyTableIsEmpty(table);
    }

});

/*
 * Executes the step to check data has been cleared from ATF & LRC tables for specific URL
 */
Then('data for {string} is removed from the performance hints tables', async function (this: ICustomWorld, permalink: string) {
    const tablePrefix = await getWPTablePrefix();
    const tables = [`${tablePrefix}wpr_above_the_fold`, `${tablePrefix}wpr_lazy_render_content`];

    // Helper function to check if the permalink is removed from a table
    const verifyPermalinkRemoved = async (tableName: string): Promise<void> => {
        // Construct SQL query to check if the permalink exists in the table
        const selectSql = `SELECT * FROM ${tableName} WHERE url LIKE "%${permalink}%"`;
        const result = await dbQuery(selectSql); 
        const resultFromStdout = await extractFromStdout(result);

        // Check if any rows are returned that match the permalink
        if (resultFromStdout.length === 0) {
            console.log(`Permalink "${permalink}" has been successfully removed from ${tableName}.`);
        } else {
            console.log(`Permalink "${permalink}" still exists in ${tableName}:`, resultFromStdout);
            expect(resultFromStdout.length).toBe(0);  // Fail test if permalink is found
        }
    };

    // Verify both tables
    for (const table of tables) {
        await verifyPermalinkRemoved(table);
    }
});

/*
 * Executes the step to check data still exists in the ATF & LRC tables for specific URL
 */
Then('data for {string} present in the performance hints tables', async function (this: ICustomWorld, permalink: string) {
    const tablePrefix = await getWPTablePrefix();
    const tables = [`${tablePrefix}wpr_above_the_fold`, `${tablePrefix}wpr_lazy_render_content`];

    // Helper function to check if the permalink still exists in a table
    const verifyPermalinkExists = async (tableName: string): Promise<void> => {
        // Construct SQL query to check if the permalink exists in the table
        const selectSql = `SELECT * FROM ${tableName} WHERE url LIKE "%${permalink}%"`;
        const result = await dbQuery(selectSql); 
        const resultFromStdout = await extractFromStdout(result);

        // Check if any rows are returned that match the permalink
        if (resultFromStdout.length > 0) {
            console.log(`Permalink "${permalink}" still exists in ${tableName}.`);
        } else {
            console.log(`Permalink "${permalink}" does not exist in ${tableName}.`);
            expect(resultFromStdout.length).toBeGreaterThan(0);  // Fail test if permalink is not found
        }
    };

    // Verify both tables
    for (const table of tables) {
        await verifyPermalinkExists(table);
    }
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
    await this.page.waitForSelector('button:has-text("Update"):not(:disabled)', { state: 'visible' });
    await this.page.getByRole('button', { name: 'Update' }).click();
    await this.page.waitForSelector('[aria-label="Dismiss this notice"]', { state: 'visible' });
});

When ('{string} page is deleted', async function (this: ICustomWorld, permalink: string) {
    const path = getTitleFromPath(permalink);

    await this.utils.gotoPages();
    await this.page.locator('#post-search-input').fill(path);
    await this.page.locator('#search-submit').click();
    await this.page.locator('td.title.column-title.has-row-actions.column-primary.page-title > strong > a').hover();
    await this.page.waitForSelector('div.row-actions > span.trash > a', { state: 'visible' }); 
    await this.page.locator('div.row-actions > span.trash > a').click();
    await this.page.waitForSelector('#message', { state: 'visible' }); 
});


Then ('untrash and republish {string} page', async function (this: ICustomWorld, permalink: string) {
    const path = getTitleFromPath(permalink);
    // Go to Trashed pages and filter trashed page
    await this.utils.gotoTrashedPages();
    await this.page.locator('#post-search-input').fill(path);
    await this.page.locator('#search-submit').click();
    await this.page.locator('span').filter({ hasText: /^atf lrc 1$/ }).hover();

    // Untrash page
    await this.page.waitForSelector('div.row-actions > span.untrash', { state: 'visible' }); 
    await this.page.locator('div.row-actions > span.untrash').click();
    await this.page.waitForSelector('#message', { state: 'visible' }); 

    // Republish page
    await this.utils.gotoPages();
    await this.page.locator('#post-search-input').fill(path);
    await this.page.locator('#search-submit').click();
    await this.page.waitForSelector('[aria-label="“atf lrc 1” (Edit)"]', { state: 'visible' });
    await this.page.getByLabel('“atf lrc 1” (Edit)').click();

    await this.page.waitForSelector('button:has-text("Publish"):not(:disabled)', { state: 'visible' });
    await this.page.getByRole('button', { name: 'Publish', exact: true }).click();

    await this.page.waitForSelector('div[aria-label="Editor publish"] button:has-text("Publish")', { state: 'visible' });
    await this.page.getByLabel('Editor publish').getByRole('button', { name: 'Publish', exact: true }).click();

    await this.page.waitForSelector('[aria-label="Dismiss this notice"]', { state: 'visible' });
});