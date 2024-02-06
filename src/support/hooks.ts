/**
 * @fileoverview
 * This file contains Playwright tests using Cucumber for the specified project.
 * It includes setup and cleanup functions, as well as test-specific configurations.
 * The tests focus on interactions with a Chromium browser and involve scenarios
 * related to WordPress plugins and sections.
 *
 * @requires {@link ../common/custom-world} - Provides the ICustomWorld interface for Playwright tests.
 * @requires {@link @playwright/test} - Utilizes the Playwright testing framework for browser automation.
 * @requires {@link @cucumber/cucumber} - Integrates Cucumber for behavior-driven development (BDD) testing.
 * @requires {@link ../common/sections} - Defines Sections class for interacting with plugin sections.
 * @requires {@link ../common/selectors} - Provides selectors for interacting with elements in the plugin.
 * @requires {@link ../../utils/page-utils} - Utilizes PageUtils for common page-related utilities.
 * @requires {@link fs/promises} - Utilizes the Node.js file system promises module for file-related operations.
 *
 */
import { ICustomWorld } from "../common/custom-world";
import { ChromiumBrowser, chromium } from '@playwright/test';
import { Sections } from '../common/sections';
import { selectors as pluginSelectors } from "./../common/selectors";
import { PageUtils } from "../../utils/page-utils";
import { batchUpdateVRTestUrl } from "../../utils/helpers";
import { deleteFolder } from "../../utils/helpers";
import backstop from 'backstopjs';
import { SCENARIO_URLS, E2E_HEADLESS } from "../../config/wp.config";

import { After, AfterAll, Before, BeforeAll, Status, setDefaultTimeout } from "@cucumber/cucumber";
// import wp, {cp, deleteTransient, generateUsers, resetWP, rm, unzip} from "../../utils/commands";
// import {configurations, getWPDir} from "../../utils/configurations";

/**
 * The Playwright Chromium browser instance used for testing.
 */
let browser: ChromiumBrowser;
/**
 * Sets the default timeout for Playwright tests.
 * If PWDEBUG environment variable is set, timeout is infinite (-1).
 */
setDefaultTimeout(process.env.PWDEBUG ? -1 : 60 * 10000);

/**
 * Before all tests, launches the Chromium browser.
 */
BeforeAll(async function (this: ICustomWorld) {
    await deleteFolder('./backstop_data/bitmaps_test');
    browser = await chromium.launch({ headless: !!E2E_HEADLESS });

    if (process.env.npm_config_vrurl === undefined) {
        await batchUpdateVRTestUrl({
            optimize: false,
            urls: SCENARIO_URLS
        });
        await backstop('reference');
        // Update test url request page with wprocket optimizations.
        await batchUpdateVRTestUrl({
            optimize: true,
            urls: SCENARIO_URLS
        });
    }
});

/**
 * Before each test scenario without the @setup tag, performs setup tasks.
 */
Before({tags: 'not @setup'}, async function (this: ICustomWorld) {
    /**
     * To uncomment during implementation of cli
     */
    // await resetWP();
    // const wpDir = getWPDir(configurations);
    // await rm(`${wpDir}/wp-content/plugins/wp-rocket`)
    // await rm(`${wpDir}/wp-content/plugins/wp-rocket-e2e-test-helper`)
    // await wp('rewrite structure /%year%/%monthnum%/%postname%/')

    // await cp(`${process.env.PWD}/plugin/wp-rocket.zip`, `${wpDir}/wp-content/plugins/wp-rocket.zip`)
    // await unzip(`${wpDir}/wp-content/plugins/wp-rocket.zip`, `${wpDir}/wp-content/plugins/`)
    // await rm(`${wpDir}/wp-content/plugins/wp-rocket.zip`)

    // await cp(`${process.env.PWD}/plugin/wp-rocket-e2e-test-helper.zip`, `${wpDir}/wp-content/plugins/wp-rocket-e2e-test-helper.zip`)
    // await unzip(`${wpDir}/wp-content/plugins/wp-rocket-e2e-test-helper.zip`, `${wpDir}/wp-content/plugins/`)
    // await rm(`${wpDir}/wp-content/plugins/wp-rocket-e2e-test-helper.zip`)

    // await generateUsers([
    //     {
    //         name: 'admin2',
    //         email: 'administrator@email.org',
    //         role: 'administrator',
    //     },
    //     {
    //         name: 'subscriber',
    //         email: 'subscriber@email.org',
    //         role: 'subscriber',
    //     },
    //     {
    //         name: 'editor',
    //         email: 'editor@email.org',
    //         role: 'editor',
    //     },
    //     {
    //         name: 'author',
    //         email: 'author@email.org',
    //         role: 'author',
    //     },
    //     {
    //         name: 'contributor',
    //         email: 'contributor@email.org',
    //         role: 'contributor',
    //     },
    // ])

    /**
     * Creates a new Playwright context and page for each test scenario.
     */
    this.context = await browser.newContext({
        recordVideo: {
            dir: "test-results/videos",
        },
    });
    this.page = await this.context.newPage();
    this.sections = new Sections(this.page, pluginSelectors);
    this.utils = new PageUtils(this.page, this.sections);
    
    /**
     * To uncomment during implementation of cli
     */
    // await this.page.goto(configurations.baseUrl);

});

/**
 * Before each test scenario with the @setup tag, performs setup tasks.
 */
Before({tags: '@setup'}, async function(this: ICustomWorld) {
    this.context = await browser.newContext({
        recordVideo: {
            dir: "test-results/videos",
        },
    });
    this.page = await this.context.newPage();
    this.sections = new Sections(this.page, pluginSelectors);
    this.utils = new PageUtils(this.page, this.sections);

    await this.utils.cleanUp();
});

/**
 * After each test scenario, performs cleanup tasks and captures screenshots and videos in case of failure.
 */
After(async function (this: ICustomWorld, { pickle, result }) {
    if (result?.status == Status.FAILED) {
        await this.utils.createScreenShot(this, pickle);
    }

    await this.page?.close()
    await this.context?.close()

    //  await resetWP();

});

/**
 * To uncomment during implementation of cli
 */
//  After(async function () {
//      deleteTransient('wp_rocket_customer_data')
//  })

/**
 * After all tests, closes the Chromium browser.
 */
AfterAll(async function () {
    await browser.close();
});