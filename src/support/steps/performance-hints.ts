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
import { When, Then } from '@cucumber/cucumber';
import { dbQuery, getWPTablePrefix } from "../../../utils/commands";
import { extractFromStdout } from "../../../utils/helpers";

import {WP_BASE_URL} from "../../../config/wp.config";

import assert from "assert";


function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

When('performance hints data added to DB', async function (this: ICustomWorld) {
    const tablePrefix = await getWPTablePrefix();
    const tableName = `${tablePrefix}wpr_above_the_fold`;

    // Truncate the table
    await dbQuery(`TRUNCATE TABLE ${tableName}`);

    // Define the data to be inserted
    const expectedData = [
        { url: `${WP_BASE_URL}/a`, is_mobile: 0, status: 'completed' },
        { url: `${WP_BASE_URL}/b`, is_mobile: 0, status: 'completed' },
        { url: `${WP_BASE_URL}/c`, is_mobile: 0, status: 'completed' }
    ];

    // Insert new rows into the table
    const insertSql = `
        INSERT INTO ${tableName} (url, is_mobile, status)
        VALUES 
            ('${WP_BASE_URL}/a', 0, 'completed'),
            ('${WP_BASE_URL}/b', 0, 'completed'),
            ('${WP_BASE_URL}/c', 0, 'completed')
    `;
    await dbQuery(insertSql); 

    // Fetch and log the data to verify
    const selectSql = `SELECT * FROM ${tableName}`;
    const resultFromStdout = await dbQuery(selectSql);

    // Log the fetched data
    console.log('Data in the table:', resultFromStdout);

    // Assert that the actual data matches the expected data
   // assert.deepStrictEqual(resultFromStdout, expectedData, 'The data in the table does not match the expected data');

});

When('clear performance hints is clicked in admin bar', async function (this: ICustomWorld) {
    await this.page.locator('#wp-admin-bar-wp-rocket').hover();
    await this.page.waitForSelector('#wp-admin-bar-clean-saas', { state: 'visible' });
    await this.page.locator('#wp-admin-bar-clean-saas').click(); 
    await this.page.waitForSelector('div.notice.notice-success', { state: 'visible' });
});

Then('data is removed from the performance hints tables', async function (this: ICustomWorld) {
    const tablePrefix = await getWPTablePrefix();
    const tableName = `${tablePrefix}wpr_above_the_fold`;

    // Fetch and log the data to verify
    const selectSql = `SELECT * FROM ${tableName}`;
    const result = await dbQuery(selectSql); 
    
    // Extract result from stdout and log it
    const resultFromStdout = await extractFromStdout(result);
    if (resultFromStdout.length === 0) {
        console.log('Data is removed from the table as expected.');
    } else {
        console.log('Data in the table:', resultFromStdout);
        assert.fail('Data still exists in the table, but it was expected to be removed.');
    }

});

When('permalink is changed', async function (this: ICustomWorld) {
    await this.utils.permalinkChanged();
});
