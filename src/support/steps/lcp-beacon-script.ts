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
import {ICustomWorld} from "../../common/custom-world";
import {expect} from "@playwright/test";
import {Then, When} from "@cucumber/cucumber";
import {LcpData, Row} from "../../../utils/types";

import {dbQuery, getWPTablePrefix} from "../../../utils/commands";
import {extractFromStdout} from "../../../utils/helpers";
import {WP_BASE_URL} from '../../../config/wp.config';
import fs from 'fs/promises';

let data: string,
    truthy: boolean = true,
    failMsg: string,
    jsonData: Record<string, { lcp: string[]; viewport: string[]; enabled: boolean, comment: string; }>,
    isDbResultAvailable: boolean = true,
    lcpLLImages: { [key: string] : { src: string; url: string | boolean; lazyloaded: string | boolean }} = {};

const actual: LcpData = {};

/**
 * Executes step to visit page based on the templates and get check for lazyload.
 */
When('I visit the urls and check for lazyload', async function (this: ICustomWorld) {
    const resultFile: string = './src/support/results/expectedResultsDesktop.json';

    await this.page.setViewportSize({
        width: 1600,
        height: 700
    });

    data = await fs.readFile(resultFile, 'utf8');
    jsonData = JSON.parse(data);

    // Visit page.
    for (const key in jsonData) {
        if ( jsonData[key].enabled === true ) {
            // Visit the page url.
            await this.utils.visitPage(key);

            lcpLLImages = await this.page.evaluate((url) => {
                const images = document.querySelectorAll('img'),
                    result = {};

                Array.from(images).forEach((img) => {
                    result[url] = {
                        src: img.getAttribute('src'),
                        url: url,
                        lazyloaded: img.classList.contains('lazyloaded')
                    }
                });

                return result;
            }, key);
        }
    }

});
/**
 * Executes step to visit page based on the form factor(desktop/mobile) and get the LCP/ATF data from DB.
 */
When('I visit the urls for {string}', async function (this: ICustomWorld, formFactor: string) {
    let sql: string,
        result: string,
        resultFromStdout: Row[],
        viewPortWidth: number = 1600,
        viewPortHeight: number = 700,
        resultFile: string = './src/support/results/expectedResultsDesktop.json',
        isMobile = 0;

    // Set page to be visited in mobile.
    if (formFactor === 'mobile') {
        viewPortWidth = 389;
        viewPortHeight = 829;
        resultFile = './src/support/results/expectedResultsMobile.json';
    }

    // Reset variable state.
    failMsg = '';

    await this.page.setViewportSize({
        width: viewPortWidth,
        height: viewPortHeight
    });

    data = await fs.readFile(resultFile, 'utf8');
    jsonData = JSON.parse(data);

    const tablePrefix: string = await getWPTablePrefix();

    // Visit page.
    for (const key in jsonData) {
        if ( jsonData[key].enabled === true ) {
            // Construct page url.
            const url: string = `${WP_BASE_URL}/${key}`;

            // Visit the page url.
            await this.utils.visitPage(key);

            // Wait the beacon to add an attribute `beacon-complete` to true before fetching from DB.
            await this.page.waitForFunction(() => {
                const beacon = document.querySelector('[data-name="wpr-wpr-beacon"]');
                console.log(beacon ? beacon.getAttribute('beacon-completed') : 'No beacon found');
                return beacon && beacon.getAttribute('beacon-completed') === 'true';
            }, { timeout: 100000 });

            if (formFactor !== 'desktop') {
                isMobile = 1;
            }
            // Get the LCP/ATF from the DB
            sql = `SELECT lcp, viewport
                   FROM ${tablePrefix}wpr_above_the_fold
                   WHERE url LIKE "%${key}%"
                     AND is_mobile = ${isMobile}`;
            result = await dbQuery(sql);
            resultFromStdout = await extractFromStdout(result);

            // If no DB result, set assertion var to false, fail msg and skip the loop.
            if (!resultFromStdout || resultFromStdout.length === 0) {
                isDbResultAvailable = false;
                failMsg += `No result from database for url ${key} in ${formFactor}\n\n\n`;
                continue;
            }

            // Populate the actual data.
            actual[key] = {
                url: url,
                lcp: resultFromStdout[0].lcp,
                viewport: resultFromStdout[0].viewport,
                comment: jsonData[key].comment ?? ''
            }
        }
    }
});

/**
 * Executes the step to assert that LCP & ATF should be as expected.
 */
Then('lcp and atf should be as expected for {string}', async function (this: ICustomWorld, formFactor: string) {
    // Log fail messages from DB query before failing test.
    if (failMsg !== '') {
        console.log('\x1b[31m%s\x1b[0m',failMsg);

        // Fail test when no DB result is found.
        expect(isDbResultAvailable).toBeTruthy();
        return;
    }

    // Set test status to True by default.
    truthy = true;

    // Iterate over the data
    for (const key in jsonData) {
        if (Object.hasOwnProperty.call(jsonData, key) && jsonData[key].enabled === true) {
            const expected = jsonData[key];
            for (const lcp of expected.lcp) {
                // Check if expected lcp is present in actual lcp.
                if (!actual[key].lcp.includes(lcp)) {
                    truthy = false;
                    failMsg += `Expected LCP for ${formFactor} - ${lcp} for ${actual[key].url} is not present in actual - ${actual[key].lcp}
                    more info -- ( ${actual[key].comment} )\n\n\n`;
                }
            }


            // Cater for multiple expected viewport candidates.
            for (const viewport of expected.viewport) {
                if (!actual[key].viewport.includes(viewport)) {
                    truthy = false;
                    failMsg += `Expected Viewport for ${formFactor} - ${viewport} for ${actual[key].url} is not present in actual - ${actual[key].viewport}
                    more info -- ( ${actual[key].comment} )\n\n\n`;
                }
            }
        }
    }

    // Log fail message from Expectation mismatch before failing test.
    if (failMsg !== '') {
        console.log('\x1b[31m%s\x1b[0m',failMsg);
    }

    // Fail test when there is expectation mismatch.
    expect(truthy).toBeTruthy();
});

let lcpImages: Array<{ src: string; fetchpriority: string | boolean; lazyloaded: string | boolean }> = [];

Then('lcp image should have fetchpriority', async function (this: ICustomWorld) {
    truthy= false;

    lcpImages = await this.page.evaluate(() => {
        const images = document.querySelectorAll('img');
        return Array.from(images).map(img => ({
            src: img.getAttribute('src'),
            fetchpriority: img.getAttribute('fetchpriority') || false,
            lazyloaded: img.classList.contains('lazyloaded')
        }));
    });

    for (const image of lcpImages) {
        if(image.src === '/wp-content/rocket-test-data/images/600px-Mapang-test.gif' && image.fetchpriority !== false) {
            truthy = true
        }
    }

    expect(truthy).toBeTruthy();
});

Then('lcp and atf images are not written to LL format', async function (this: ICustomWorld) {
    // Reset truthy to true here.
    truthy = true;

    // Iterate over the data
    for (const key in jsonData) {
        if (Object.hasOwnProperty.call(jsonData, key) && jsonData[key].enabled === true) {
            const expected = jsonData[key];
            // Check for LCP
            for (const lcp of expected.lcp) {
                // Check if expected lcp is present in actual lcp.
                if (lcpLLImages[key].src.includes(lcp) && lcpLLImages[key].lazyloaded) {
                    truthy = false;
                    failMsg += `Expected LCP for - ${lcp} for ${lcpLLImages[key].url} is lazyloaded - ${lcpLLImages[key].src}\n\n\n`;
                }
            }

            // Check for ATF
            for (const viewport of expected.viewport) {
                if (lcpLLImages[key].src.includes(viewport) && lcpLLImages[key].lazyloaded) {
                    truthy = false;
                    failMsg += `Expected Viewport for - ${viewport} for ${lcpLLImages[key].url} is lazyloaded - ${lcpLLImages[key].src}
                   \n\n\n`;
                }
            }
        }
    }

    // Fail test when there is expectation mismatch.
    expect(truthy).toBeTruthy();
});