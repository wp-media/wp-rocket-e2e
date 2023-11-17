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

import { After, AfterAll, Before, BeforeAll, Status, setDefaultTimeout } from "@cucumber/cucumber";
import fs from "fs/promises";
// import wp, {cp, deleteTransient, generateUsers, resetWP, rm, unzip} from "../../utils/commands";
// import {configurations, getWPDir} from "../../utils/configurations";

/**
 * The Playwright Chromium browser instance used for testing.
 */
let browser: ChromiumBrowser;

/**
 * Sets the default timeout for Playwright tests.
 * If PWDEBUG environment variable is set, timeout is infinite (-1); otherwise, it's 10 seconds.
 */
setDefaultTimeout(process.env.PWDEBUG ? -1 : 60 * 10000);

/**
 * Before all tests, launches the Chromium browser.
 */
BeforeAll(async function (this: ICustomWorld) {
    browser = await chromium.launch({ headless: false });
});

/**
 * Before each test scenario, performs setup tasks.
 */
Before(async function (this: ICustomWorld) {

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
 * After each test scenario, performs cleanup tasks and captures screenshots and videos in case of failure.
 */
After(async function (this: ICustomWorld, { pickle, result }) {
    let videoPath: string;
    let img: Buffer;
    if (result?.status == Status.FAILED) {
        img = await this.page?.screenshot({ path: `./test-results/screenshots/${pickle.name}.png`, type: "png" })
        videoPath = await this.page?.video().path();
    }

    await this.page?.close()
    await this.context?.close()

    if (result?.status == Status.FAILED) {
        await this.attach(
            img, "image/png"
        );
        const file = await fs.readFile(videoPath);
        await this.attach(
            file,
            'video/webm'
        );
    }

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
})