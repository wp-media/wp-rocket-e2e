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
import { addFilterToTheme, removeFilterFromTheme } from "../../utils/commands";

import { deleteFolder, isWprRelatedError } from "../../utils/helpers";
import {WP_SSH_ROOT_DIR,} from "../../config/wp.config";
import { After, AfterAll, Before, BeforeAll, Status, setDefaultTimeout } from "@cucumber/cucumber";
import {rename, exists, rm, testSshConnection, installRemotePlugin, activatePlugin, uninstallPlugin, readFile} from "../../utils/commands";
import type { Selectors } from "../../utils/types";
import type { Section } from "../../utils/types";
// import {configurations, getWPDir} from "../../utils/configurations";

/**
 * The Playwright Chromium browser instance used for testing.
 */
let browser: ChromiumBrowser;

/**
 * Stores the name of the previous test scenario.
 * It is initially undefined until it is assigned a value in the `After` hook.
 * @type {string}
 */
let previousScenarioName: string;
/**
 * Sets the default timeout for Playwright tests.
 * If PWDEBUG environment variable is set, timeout is infinite (-1).
 */
setDefaultTimeout(process.env.PWDEBUG ? -1 : 60 * 10000);

/**
 * Before all tests, launches the Chromium browser.
 */
BeforeAll(async function (this: ICustomWorld) {
    try {
        await testSshConnection();

        const debugLogPath = `${WP_SSH_ROOT_DIR}wp-content/*.log`;
        await rm(debugLogPath);

        await deleteFolder('./backstop_data/bitmaps_test');

        await addFilterToTheme('rocket_rocket_insights_enabled', '__return_false', 'twentytwenty');
        
        browser = await chromium.launch({ headless: false });
    } catch (error) {
        console.error('Setup failed: ', error.message);
        throw new Error('Setup failed: ' + error.message);
    }
});

/**
 * Before each test scenario without the @setup tag, performs setup tasks.
 */
Before({tags: 'not @setup'}, async function (this: ICustomWorld, {pickle}) {
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
    this.pickle = pickle;

    /**
     * To uncomment during implementation of cli
     */
    // await this.page.goto(configurations.baseUrl);

});

/**
 * Before each test scenario with the @setup tag, performs setup tasks.
 */
Before({tags: '@setup'}, async function(this: ICustomWorld, {pickle}) {
    this.context = await browser.newContext({
        recordVideo: {
            dir: "test-results/videos",
        },
    });
    this.page = await this.context.newPage();
    this.sections = new Sections(this.page, pluginSelectors);
    this.utils = new PageUtils(this.page, this.sections);

    await this.utils.cleanUp();
    this.pickle = pickle;
});

/**
 * Before each test scenario with the @delaylcp tag, performs setup tasks.
 */
Before({tags: '@delaylcp'}, async function (this: ICustomWorld) {
    // Install and activate the remote plugin 
    await installRemotePlugin('https://github.com/wp-media/wp-rocket-e2e-test-helper/raw/main/helper-plugin/rocket-lcp-delay.zip');
    await activatePlugin('rocket-lcp-delay');
});

/**
 * Before each test scenario with the @vr tag, performs setup tasks.
 */
Before({tags: '@vr'}, async function (this: ICustomWorld) {
    const option = process.env.npm_config_wproption;

    if(!option) {
        throw new Error('Option label not correctly parsed. Check that the labels are defined')
    }

    const elementKeys: string[] = [];
    const elementToParentMap: Record<string, string> = {};

    // Loop through each top-level key
    Object.entries(pluginSelectors as Selectors).forEach(([parentKey, { elements }]) => {
        Object.keys(elements).forEach(elementKey => {
            elementKeys.push(elementKey);
            elementToParentMap[elementKey] = parentKey;
        });
    });

    if (!elementKeys.includes(option)) {
        throw new Error('Value for option label is invalid. Refer to src/common/selectors');
    }

    this.wprSection = elementToParentMap[option] as Section;
    this.wprOption = option;
});

/**
 * After each test scenario, performs cleanup tasks and captures screenshots and videos in case of failure.
 */
After(async function (this: ICustomWorld, { pickle, result }) {
    previousScenarioName = pickle.name

    if (result?.status == Status.FAILED) {
        await this.utils.createScreenShot(this, pickle);
    }

    const debugLogPath = `${WP_SSH_ROOT_DIR}wp-content/debug.log`;
    const debugLogExists = await exists(debugLogPath);
    const debugLogContents = await readFile(debugLogPath);
    const wprRelatedError = await isWprRelatedError(debugLogContents);

    if (debugLogExists && previousScenarioName && wprRelatedError) {
        // Close up white spaces.
        previousScenarioName = previousScenarioName.toLowerCase();
        previousScenarioName = previousScenarioName.replaceAll(' ', '-');
        const newDebugLogPath = `${WP_SSH_ROOT_DIR}wp-content/debug-${previousScenarioName}.log`;
        await rename(debugLogPath, newDebugLogPath);
    }

    await this.page?.close()
    await this.context?.close()

    //  await resetWP();

});

/**
 * After each test scenario with the @delaylcp tag, performs teardown tasks.
 */
After({tags: '@delaylcp'}, async function (this: ICustomWorld) {
    await uninstallPlugin('rocket-lcp-delay');
});

/**
 * To uncomment during implementation of cli
 */
//  After(async function () {
//      deleteTransient('wp_rocket_customer_data')
//  })

/**
 * After all tests, closes the Chromium browser and remove filter added
 */

AfterAll(async function () {
    await removeFilterFromTheme('rocket_rocket_insights_enabled', '__return_false', 'twentytwenty');
    await browser.close();
});