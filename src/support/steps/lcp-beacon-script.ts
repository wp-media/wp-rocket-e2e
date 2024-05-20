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
import { LcpDataTable, LcpData, Row } from "../../../utils/types";
import axios from 'axios';
import { dbQuery, getWPTablePrefix } from "../../../utils/commands";
import { extractFromStdout } from "../../../utils/helpers";
import { WP_BASE_URL } from '../../../config/wp.config';

let data: LcpDataTable[],
    truthy: boolean = true,
    failMsg: string = "";
    
const [actual, expected]: [LcpData, LcpData] = [{}, {}];

/**
 * Executes step to visit page based on the form factor(desktop/mobile) and get the LCP/ATF data from DB.
 */
Given('I visit the following urls in {string}', async function (this: ICustomWorld, formFactor: string, dataTable) {
    let sql: string,
        result: string,
        resultFromStdout: Row[],
        viewPortWidth: number = 1600,
        viewPortHeight: number = 700;

    // Set page to be visited in mobile.
    if ( formFactor === 'mobile' ) {
        viewPortWidth = 393;
        viewPortHeight = 830;
    }

    await this.page.setViewportSize({
        width: viewPortWidth,
        height: viewPortHeight
    });

    data = dataTable.rows();

    const tablePrefix: string = await getWPTablePrefix();

    // Visit page.
    for (const row of data) {
        const url: string = `${WP_BASE_URL}/${row[0]}`;
        await this.utils.visitPage(row[0]);
        // Wait the beacon to add an attribute `beacon-complete` to true before fetching from DB.
        await this.page.waitForFunction(() => {
            const beacon = document.querySelector('[data-name="wpr-lcp-beacon"]');
            return beacon && beacon.getAttribute('beacon-completed') === 'true';
        });

        // Get the LCP/ATF from the DB
        sql = `SELECT lcp, viewport FROM ${tablePrefix}wpr_above_the_fold WHERE url LIKE "%${row[0]}%"`;
        result = await dbQuery(sql);
        resultFromStdout = await extractFromStdout(result);

        // Populate the actual data.
        if (resultFromStdout && resultFromStdout.length > 0) {
            actual[row[0]] = {
                    url: url,
                    lcp: resultFromStdout[0].lcp,
                    viewport: resultFromStdout[0].viewport
            }
        } else {
            console.error(`No result from database for url ${row[0]}`);
        }
    }
});

/**
 * Executes the step to assert that LCP & ATF should be as expected.
 */
Then('lcp and atf should be as expected in {string}', async function (this: ICustomWorld, formFactor: string) {
    let apiUrl: string;

    // Get the LCP from the PSI
    for (const row of data) {
        const url: string = `${WP_BASE_URL}/${row[0]}`;
        apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url+'?nowprocket')}/&fields=lighthouseResult.audits&strategy=${formFactor}`;

        try {
            const response = await axios.get(apiUrl);
            const data = response.data;
            let lcp: string = data.lighthouseResult.audits['prioritize-lcp-image'] && data.lighthouseResult.audits['prioritize-lcp-image'].details ? data.lighthouseResult.audits['prioritize-lcp-image'].details.debugData.initiatorPath[0].url : 'not found';

            if (lcp === 'not found' && data.lighthouseResult.audits['largest-contentful-paint-element'].details) {
                const snippet: string = data.lighthouseResult.audits['largest-contentful-paint-element'].details.items[0].items[0].node.snippet;
                const imageRegex = /<img.*?src="(.*?)"/;
                const match = snippet.match(imageRegex);

                if (match && match[1]) {
                    lcp = match[1];
                }
            }

            console.log(`LCP for ${url} is ${lcp}`);
            // Populate the expected data.
            expected[row[0]] = {
                url: url,
                lcp: lcp,
                viewport: row[1]
            }
        } catch (error) {
            console.error(`Error fetching PageSpeed Insight for ${url}:`, error);
        }
    }

    // Make assertions.
    for (const key in actual) {
        if (Object.hasOwnProperty.call(actual, key)) {
            const [url, actualLcp, expectedLcp, actualViewport, expectedViewport] = [actual[key].url, actual[key].lcp, expected[key].lcp, actual[key].viewport, expected[key].viewport];
        
            // Check if expected lcp is present in actual lcp.
            if (!actualLcp.includes(expectedLcp)) {
                truthy = false;
                failMsg += `Expected LCP - ${expectedLcp} for ${url} is not present in actual - ${actualLcp}\n\n\n`;
            }

            // Cater for multiple expected viewport candidates.
            if (expectedViewport.includes(',')) {
                const viewports = expectedViewport.split(',').map(item => item.trim());

                for (const viewport of viewports) {
                    if (!actualViewport.includes(viewport)) {
                        truthy = false;
                        failMsg += `Expected Viewport - ${viewport} for ${url} is not present in actual - ${actualViewport}\n\n\n`;
                    }
                }
            // Treat single viewport candidate.
            } else{
                if (!actualViewport.includes(expectedViewport)) {
                    truthy = false;
                    failMsg += `Expected Viewport - ${expectedViewport} for ${url} is not present in actual - ${actualViewport}\n\n\n`;
                }
            }
        }
    }

    if ( failMsg !== '' ) {
        console.log(failMsg);
    }

    expect(truthy, failMsg).toBeTruthy();
});

Then('lcp image in {string} has fetchpriority', async function (this: ICustomWorld, page) {
    await this.page.setViewportSize({
        width: 1600,
        height: 700
    });
    let msg = 'false';

    await this.utils.visitPage(page);
    await this.utils.scrollDownBottomOfAPage();

    const imageWithFetchPriority = await this.page.evaluate(() => {
        const images = document.querySelectorAll('img');
        return Array.from(images).map(img => ({
            src: img.getAttribute('src'),
            fetchpriority: img.getAttribute('fetchpriority') || false
        }));
    });
    for (const image of imageWithFetchPriority) {
        if(image.src === '' && image.fetchpriority !== false) {
            msg = 'image with found'
        }
    }

    expect(truthy, msg).toBeTruthy();
});