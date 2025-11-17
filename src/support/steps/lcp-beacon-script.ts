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
import {LLImagesData, Row, SinglePageLCPImages} from "../../../utils/types";

import {dbQuery, getWPTablePrefix} from "../../../utils/commands";
import {checkLcpOrViewport, extractFromStdout} from "../../../utils/helpers";
import {WP_BASE_URL} from "../../../config/wp.config";
import fs from 'fs/promises';

let data: string,
    truthy: boolean = true,
    failMsg: string,
    jsonData: Record<string, { lcp: string[]; viewport: string[]; fonts: string[];enabled: boolean, comment: string; }>,
    isDbResultAvailable: boolean = true,
    lcpLLImages: LLImagesData = {},
    singlePageLcp : SinglePageLCPImages = {url: '', lcp: '', viewport: ''};

type ActualData = {
  url: string;
  lcp?: string;
  viewport?: string;
  fonts?: string;
  comment?: string;
};
const actual: Record<string, ActualData> = {};

// --- Regex-aware helpers for preload-font expectations ---
const isRegexPattern = (s: string): boolean =>
  s.startsWith('^') && s.endsWith('$');

const matchesExpected = (expected: string, actualUrl: string): boolean => {
  if (isRegexPattern(expected)) {
    try {
      return new RegExp(expected).test(actualUrl);
    } catch {
      // If an invalid regex sneaks in, fall back to substring check
      return actualUrl.includes(expected.replace(/^\^/, '').replace(/\$$/, ''));
    }
  }
  return actualUrl === expected || actualUrl.includes(expected);
};

const findUnmatchedExpectations = (expectedList: string[], actualList: string[]): string[] => {
  const unmatched: string[] = [];
  for (const exp of expectedList) {
    const hit = actualList.some(act => matchesExpected(exp, act));
    if (!hit) unmatched.push(exp);
  }
  return unmatched;
};
// --- end helpers ---

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
                    result = {},
                    allElements = document.querySelectorAll('*');

                Array.from(images).forEach((img) => {
                    result[`${url}_img`] = {
                        src: img.getAttribute('src'),
                        type: 'image',
                        url: url,
                        lazyloaded: img.classList.contains('lazyloaded')
                    }
                });

                Array.from(allElements).forEach((element) => {
                    const computedStyle = window.getComputedStyle(element);
                    const backgroundImage = computedStyle.backgroundImage;

                    if (backgroundImage && backgroundImage !== 'none') {
                        const bgUrl = backgroundImage.replace(/^url\(['"]?/, '').replace(/['"]?\)$/, '');

                        result[`${url}_bg`] = {
                            type: 'background',
                            src: bgUrl,
                            url: url,
                            lazyloaded: element.classList.contains('data-rocket-lazy-bg'),
                        };
                    }
                })


                return result;
            }, key);
        }
    }
});



// visit URL
When(
    'I visit the url {string} for {string}',
    async function (this: ICustomWorld, templateKey: string, formFactor: string) {
        let viewPortWidth: number = 1600,
            viewPortHeight: number = 700;

        // Set device viewport and result file based on formFactor
        if (formFactor === 'mobile') {
            viewPortWidth = 389;
            viewPortHeight = 829;
        }

        await this.page.setViewportSize({
            width: viewPortWidth,
            height: viewPortHeight
        });

        // Visit the page url
        await this.utils.visitPage(templateKey);

        // Wait for beacon attribute 
        await this.page.waitForFunction(() => {
            const beacon = document.querySelector('[data-name="wpr-wpr-beacon"]');
            return beacon && beacon.getAttribute('beacon-completed') === 'true';
        }, { timeout: 100000 });
    }
);

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
        if (jsonData[key].enabled === true) {
            // Construct page url.
            const url: string = `${WP_BASE_URL}/${key}`;

            // Visit the page url.
            await this.utils.visitPage(key);

            // Wait the beacon to add an attribute `beacon-complete` to true before fetching from DB.
            await this.page.waitForFunction(() => {
                const beacon = document.querySelector('[data-name="wpr-wpr-beacon"]');
                return beacon && beacon.getAttribute('beacon-completed') === 'true';
            }, { timeout: 100000 });

            if (formFactor !== 'desktop') {
                isMobile = 1;
            }

            // Get the LCP/ATF from the DB
            sql = `SELECT lcp, viewport FROM ${tablePrefix}wpr_above_the_fold WHERE url LIKE "%${key}%" AND is_mobile = ${isMobile}`;
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
            };
        }
    }

});


/**
 * Executes step to visit page and get preload fonts data from DB.
 */
When('I visit the urls for preload fonts', async function (this: ICustomWorld) {
    let sql: string,
        result: string,
        resultFromStdout: Row[];
    const viewPortWidth: number = 1600,
        viewPortHeight: number = 700,
        resultFile: string = './src/support/results/expectedResultsPreloadFonts.json',
        isMobile = 0;

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
        if (jsonData[key].enabled === true) {
            // Construct page url.
            const url: string = `${WP_BASE_URL}/${key}`;

            // Visit the page url.
            await this.utils.visitPage(key);

            // Wait the beacon to add an attribute `beacon-complete` to true before fetching from DB.
            await this.page.waitForFunction(() => {
                const beacon = document.querySelector('[data-name="wpr-wpr-beacon"]');
                return beacon && beacon.getAttribute('beacon-completed') === 'true';
            }, { timeout: 100000 });

            // Get the Preload Fonts from the DB
            sql = `SELECT fonts FROM ${tablePrefix}wpr_preload_fonts WHERE url LIKE "%${key}%" AND is_mobile = ${isMobile}`;
            result = await dbQuery(sql);
            resultFromStdout = await extractFromStdout(result);

            // If no DB result, set assertion var to false, fail msg and skip the loop.
            if (!resultFromStdout || resultFromStdout.length === 0) {
                isDbResultAvailable = false;
                failMsg += `No result from database for url ${key} in preload fonts\n\n\n`;
                continue;
            }

            // Populate the actual data.
            actual[key] = {
                url: url,
                fonts: resultFromStdout[0].fonts,
                comment: jsonData[key].comment ?? ''
            };
        }
    }

});


/**
 * Executes the step to assert that LCP & ATF should be as expected.
 */
Then('{string} should be as expected for {string}', async function (this: ICustomWorld, type: string, formFactor: string) {
    // Log fail messages from DB query before failing test.
    if (failMsg !== '') {
        console.log('\x1b[31m%s\x1b[0m',failMsg);
         // Fail test when no DB result is found.
        expect(isDbResultAvailable).toBeTruthy();
        return;
    }

    truthy = true;

    // Iterate over the data
    for (const key in jsonData) {
        if (Object.hasOwnProperty.call(jsonData, key) && jsonData[key].enabled === true) {
            const expected = jsonData[key];
            if (type === 'lcp and atf') {
                // Run both LCP and ATF logic
                for (const lcp of expected.lcp) {
                    if (!actual[key].lcp.includes(lcp)) {
                        truthy = false;
                        failMsg += `Expected LCP for ${formFactor} - ${lcp} for ${actual[key].url} is not present in actual - ${actual[key].lcp}\nmore info -- ( ${actual[key].comment} )\n\n\n`;
                        // Highlighted log for missing LCP
                        console.log('\x1b[43m\x1b[30m[HIGHLIGHTED] LCP MISMATCH for', key, '\x1b[0m');
                        console.log('\x1b[33mExpected lcp:\x1b[0m', expected.lcp);
                        console.log('\x1b[36mActual lcp:\x1b[0m', actual[key].lcp);
                    }
                }
                for (const viewport of expected.viewport) {
                    if (!actual[key].viewport.includes(viewport)) {
                        truthy = false;
                        failMsg += `Expected Viewport for ${formFactor} - ${viewport} for ${actual[key].url} is not present in actual - ${actual[key].viewport}\nmore info -- ( ${actual[key].comment} )\n\n\n`;
                        // Highlighted log for missing Viewport
                        console.log('\x1b[41m\x1b[37m[HIGHLIGHTED] VIEWPORT MISMATCH for', key, '\x1b[0m');
                        console.log('\x1b[33mExpected viewport:\x1b[0m', expected.viewport);
                        console.log('\x1b[36mActual viewport:\x1b[0m', actual[key].viewport);
                    }
                }
            }
        }
    }
// Log fail message from Expectation mismatch before failing test.
    if (failMsg !== '') {
        throw new Error(failMsg);
    }
// Fail test when there is expectation mismatch.
    expect(truthy).toBeTruthy();
});

/**
 * Executes the step to assert that preload fonts should be as expected.
 */
Then('preload fonts should be as expected', async function (this: ICustomWorld) {
    // Log fail messages from DB query before failing test.
    if (failMsg !== '') {
        console.log('\x1b[31m%s\x1b[0m',failMsg);
         // Fail test when no DB result is found.
        expect(isDbResultAvailable).toBeTruthy();
        return;
    }

    truthy = true;

    // Iterate over the data
    for (const key in jsonData) {
        if (Object.hasOwnProperty.call(jsonData, key) && jsonData[key].enabled === true) {
            const expected = jsonData[key];
            const expectedFonts: string[] = expected.fonts || [];
            let actualFonts: string[] = [];
            try {
                actualFonts = JSON.parse(actual[key].fonts || '[]');
            } catch (e) {
                actualFonts = (actual[key].fonts || '')
                    .split(',')
                    .map(f => f.trim())
                    .filter(Boolean);
            }

            const missing = findUnmatchedExpectations(expectedFonts, actualFonts);

            if (missing.length) {
                truthy = false;
                for (const m of missing) {
                    failMsg += `Expected preload font - ${m} for ${actual[key].url} is not present in actual - ${actualFonts}\nmore info -- ( ${actual[key].comment} )\n\n\n`;
                }
            }
        }
    }
// Log fail message from Expectation mismatch before failing test.
    if (failMsg !== '') {
        throw new Error(failMsg);
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

/**
 * Executes the step to assert that LCP & ATF aren't lazyloaded.
 *
 * @returns {Promise<void>}
 */
Then('lcp and atf images are not written to LL format', async function (this: ICustomWorld) {
    // Reset truthy to true here.
    truthy = true;

    // Iterate over the data
    for (const key in jsonData) {
        if (Object.hasOwnProperty.call(jsonData, key) && jsonData[key].enabled === true) {
            const expected = jsonData[key];

            const lcpResult = await checkLcpOrViewport(lcpLLImages, key, 'LCP', expected.lcp);
            if (lcpResult && !lcpResult.isValid) {
                truthy = false;
                failMsg += lcpResult.errorMessages.join('');
            }

            const viewportResult = await checkLcpOrViewport(lcpLLImages, key, 'Viewport', expected.viewport);
            if (viewportResult && !viewportResult.isValid) {
                truthy = false;
                failMsg += viewportResult.errorMessages.join('');
            }
        }
    }

    // Fail test when there is expectation mismatch.
    expect(truthy).toBeTruthy();
});

When('I visit the {string} and check lcp-atf are not lazyloaded', async function (this: ICustomWorld, url: string) {
    // Reset truthy to true here.
    truthy = true;

    await this.page.setViewportSize({
        width: 1600,
        height: 700
    });

    await this.utils.visitPage(url);

    const allImages = await this.page.evaluate((url) => {
        const images = document.querySelectorAll('img'),
            result = [];

        Array.from(images).forEach((img) => {
            result.push({
                src: img.getAttribute('src'),
                url: url,
                lazyloaded: img.classList.contains('lazyloaded')
            })
        });

        return result;
    }, url);

    allImages.forEach((image) => {
        if(singlePageLcp.lcp.includes(image.src) && image.lazyloaded ) {
            truthy = false;
        }

        if(singlePageLcp.viewport.includes(image.src) && image.lazyloaded ) {
            truthy = false;
        }
    });

    // Fail test when there is expectation mismatch.
    expect(truthy).toBeTruthy();
});

/**
 * Executes the step to visit page in a specific browser dimension.
 */
When('I visit page {string} and check for lcp', async function (this:ICustomWorld, page) {

    const tablePrefix: string = await getWPTablePrefix();

    await this.page.setViewportSize({
        width: 1600,
        height: 700,
    });

    await this.utils.visitPage(page);

    // Wait the beacon to add an attribute `beacon-complete` to true before fetching from DB.
    await this.page.waitForFunction(() => {
        const beacon = document.querySelector('[data-name="wpr-wpr-beacon"]');
        return beacon && beacon.getAttribute('beacon-completed') === 'true';
    }, { timeout: 100000 });

    // Get the LCP/ATF from the DB
    const sql = `SELECT lcp, viewport
                   FROM ${tablePrefix}wpr_above_the_fold
                   WHERE url LIKE "%${page}%"
                     AND is_mobile = 0`;
    const result = await dbQuery(sql);
    const resultFromStdout = await extractFromStdout(result);

    // If no DB result, set assertion var to false, fail msg and skip the loop.
    if (!resultFromStdout || resultFromStdout.length === 0) {
        isDbResultAvailable = false;
    }

    singlePageLcp = {
        url: page,
        lcp: resultFromStdout[0].lcp,
        viewport: resultFromStdout[0].viewport
    }
});
