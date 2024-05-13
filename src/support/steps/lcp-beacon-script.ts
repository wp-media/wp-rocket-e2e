/**
 * @fileoverview
 * This module contains Cucumber step definitions using Playwright for deleting the WP Rocket plugin.
 * It includes steps for confirming the deletion, navigating to the plugins page, deactivating the plugin,
 * handling deactivation modal, initiating the deletion process, and asserting successful deletion.
 *
 * @requires {@link ../../common/custom-world}
 * @requires {@link @playwright/test}
 * @requires {@link @cucumber/cucumber}
 */
import { ICustomWorld } from "../../common/custom-world";
import { expect } from "@playwright/test";
import { Given, Then } from "@cucumber/cucumber";
import { LcpData, Row } from "../../../utils/types";
import { dbQuery, getWPTablePrefix } from "../../../utils/commands";
import { extractFromStdout } from "../../../utils/helpers";
import { WP_BASE_URL } from '../../../config/wp.config';
import fs from 'fs/promises';

let data: string,
    truthy: boolean = true,
    failMsg: string = "";
    
const actual: LcpData = {};

/**
 * Executes step to visit page based on the form factor(desktop/mobile) and get the LCP/ATF data from DB.
 */
Given('I visit the urls for {string}', async function (this: ICustomWorld, formFactor: string) {
    let sql: string,
        result: string,
        resultFromStdout: Row[],
        viewPortWidth: number = 1600,
        viewPortHeight: number = 700,
        resultFile: string = './src/support/results/expectedResultsDesktop.json';

    // Set page to be visited in mobile.
    if (formFactor === 'mobile') {
        viewPortWidth = 389;
        viewPortHeight = 829;
        resultFile = './src/support/results/expectedResultsMobile.json';
    }

    await this.page.setViewportSize({
        width: viewPortWidth,
        height: viewPortHeight
    });

    data = await fs.readFile(resultFile, 'utf8');
    const jsonData = JSON.parse(data);

    const tablePrefix: string = await getWPTablePrefix();

    // Visit page.
    for (const key in jsonData) {
        const url: string = `${WP_BASE_URL}/${key}`;
        await this.utils.visitPage(key);
        // Wait the beacon to add an attribute `beacon-complete` to true before fetching from DB.

        await this.page.waitForFunction(() => {
            const beacon = document.querySelector('[data-name="wpr-lcp-beacon"]');
            return beacon && beacon.getAttribute('beacon-completed') === 'true';
        });

        // Get the LCP/ATF from the DB
        sql = `SELECT lcp, viewport
               FROM ${tablePrefix}wpr_above_the_fold
               WHERE url LIKE "%${key}%"`;
        result = await dbQuery(sql);
        resultFromStdout = await extractFromStdout(result);
        // Populate the actual data.
        if (resultFromStdout && resultFromStdout.length > 0) {
            actual[key] = {
                url: url,
                lcp: resultFromStdout[0].lcp,
                viewport: resultFromStdout[0].viewport
            }
        } else {
            console.error(`No result from database for url ${key}`);
        }
    }
});

/**
 * Executes the step to assert that LCP & ATF should be as expected.
 */
Then('lcp and atf should be as expected', async function (this: ICustomWorld) {
    const jsonData = JSON.parse(data);
    // Iterate over the data
    for (const key in jsonData) {
        if (Object.hasOwnProperty.call(jsonData, key)) {
            const expected = jsonData[key];

            // Check if expected lcp is present in actual lcp.
            if (!actual[key].lcp.includes(jsonData[key].lcp)) {
                truthy = false;
                failMsg += `Expected LCP - ${expected.lcp} for ${actual[key].url} is not present in actual - ${actual[key].lcp}\n\n\n`;
            }

            // Cater for multiple expected viewport candidates.
            for (const viewport of expected.viewport) {
                if (!actual[key].viewport.includes(viewport)) {
                    truthy = false;
                    failMsg += `Expected Viewport - ${viewport} for ${actual[key].url} is not present in actual - ${actual[key].viewport}\n\n\n`;
                }
            }
        }
    }

    if (failMsg !== '') {
        console.log(failMsg);
    }

    expect(truthy, failMsg).toBeTruthy();
});

