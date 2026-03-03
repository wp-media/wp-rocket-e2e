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
import { deleteFolder, extractFromStdout, isWprRelatedError } from "../../utils/helpers";
import {WP_SSH_ROOT_DIR,} from "../../config/wp.config";
import { After, AfterAll, Before, BeforeAll, Status, setDefaultTimeout } from "@cucumber/cucumber";
import {rename, exists, rm, testSshConnection, installRemotePlugin, activatePlugin, uninstallPlugin, readFile, isPluginActive, isPluginInstalled, getPostDataFromTitle} from "../../utils/commands";
import type { Selectors } from "../../utils/types";
import type { Section } from "../../utils/types";
import { Apvm, BuildOptions, JsBuildEvent } from 'apvm-napi';
// import {configurations, getWPDir} from "../../utils/configurations";
import {access, rm as nodeRm, rename as nodeRename} from 'node:fs/promises';

/**
 * The name of the template loader plugin.
 * This plugin must be active before running tests to avoid false positives.
 * @constant {string}
 */
const TEMPLATE_LOADER_PLUGIN = 'template-loader-plugin-master';

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
        
        // Check if template loader plugin is installed
        const isTemplateLoaderInstalled = await isPluginInstalled(TEMPLATE_LOADER_PLUGIN);
        if (isTemplateLoaderInstalled) {
            // Check if template loader plugin is active, activate if not
            const isTemplateLoaderActive = await isPluginActive(TEMPLATE_LOADER_PLUGIN);
            if (!isTemplateLoaderActive) {
                console.log('Template loader plugin is not active, activating...');
                await activatePlugin(TEMPLATE_LOADER_PLUGIN);
            } else {
                console.log('Template loader plugin is already active');
            }
        } else {
            console.log('Template loader plugin is not installed, skipping activation check');
        }
        
        browser = await chromium.launch({ headless: false });

        
    } catch (error) {
        console.error('Setup failed: ', error.message);
        throw new Error('Setup failed: ' + error.message);
    }
});

/**
 * Hook that runs before all tests to build the plugins specified by environment variables and store them in a known location for E2E tests.
 * It uses APVM to build the plugins from specified git references and moves the resulting artifacts to stable zip paths.
 * If no environment variables are set for plugin builds, it simply returns without performing any actions.
 */
BeforeAll(async function() {
    const WORKSPACE_ROOT_DIR = process.env.PWD ?? process.cwd();
    const PLUGIN_OUTPUT_DIR = `${WORKSPACE_ROOT_DIR}/plugin`;
    const PREVIOUS_STABLE_PLUGIN_ZIP = `${PLUGIN_OUTPUT_DIR}/previous_stable.zip`;
    const NEW_RELEASE_PLUGIN_ZIP = `${PLUGIN_OUTPUT_DIR}/new_release.zip`;
    const BACKWPUP_PLUGIN_ZIP = `${PLUGIN_OUTPUT_DIR}/backwpup-pro.zip`;

    const previousStableToBuild = process.env.E2E_WPR_PREV || null;
    const newReleaseToBuild = process.env.E2E_WPR_NEW || null;
    const backWPUpToBuild = process.env.E2E_WPR_BACKWPUP || null;

    if (!previousStableToBuild && !newReleaseToBuild && !backWPUpToBuild) {
        return;
    }

    const apvm = await Apvm.create();

    if (previousStableToBuild) {
        await buildAndStorePluginArtifact({
            apvm,
            pluginName: 'WP Rocket previous stable',
            targetPath: PREVIOUS_STABLE_PLUGIN_ZIP,
            options: {
                project: 'wp-rocket',
                gitRef: previousStableToBuild,
                outputDir: PLUGIN_OUTPUT_DIR,
            },
        });
    }

    if (newReleaseToBuild) {
        await buildAndStorePluginArtifact({
            apvm,
            pluginName: 'WP Rocket new release',
            targetPath: NEW_RELEASE_PLUGIN_ZIP,
            options: {
                project: 'wp-rocket',
                gitRef: newReleaseToBuild,
                outputDir: PLUGIN_OUTPUT_DIR,
            },
        });
    }

    if (backWPUpToBuild) {
        await buildAndStorePluginArtifact({
            apvm,
            pluginName: 'BackWPUp',
            targetPath: BACKWPUP_PLUGIN_ZIP,
            options: {
                project: 'backwpup',
                gitRef: backWPUpToBuild,
                outputDir: PLUGIN_OUTPUT_DIR,
                variants: ['pro-en'],
                version: '5.6.6',
            },
        });
    }
});

interface BuildAndStorePluginArtifactArgs {
    apvm: Apvm;
    pluginName: string;
    options: BuildOptions;
    targetPath: string;
}

/**
 * Builds a plugin artifact using APVM and moves it to a stable zip path used by E2E tests.
 *
 * @param {BuildAndStorePluginArtifactArgs} args - Build and output options.
 * @return {Promise<void>}
 */
async function buildAndStorePluginArtifact({ apvm, pluginName, options, targetPath }: BuildAndStorePluginArtifactArgs): Promise<void> {
    const gitRef = options.gitRef ?? 'unknown-ref';
    console.log(`\nBuilding ${pluginName} plugin from: ${gitRef}\n`);
    let hasPrintedStepProgress = false;

    const reporter = (error: Error, event: JsBuildEvent): void => {
        if (error) console.error(error);
        if (event.type === 'step_completed') {
            hasPrintedStepProgress = true;
            process.stdout.write('.');
        }
    };

    try {
        const result = await apvm.build(options, reporter);

        if (hasPrintedStepProgress) process.stdout.write('\n');
        const firstArtifactPath = result.result.artifacts[0]?.path;

        if (result.result.artifactCount < 1 || !firstArtifactPath) {
            throw new Error(`No artifact path found in build result for "${pluginName}"`);
        }

        await access(firstArtifactPath);
        // Remove existing artifact at target path if it exists, then move new artifact to target path
        await nodeRm(targetPath, { force: true });
        await nodeRename(firstArtifactPath, targetPath);
        console.log(`\nSaved ${pluginName} build artifact to: ${targetPath}`);
    } catch (error) {
        if (hasPrintedStepProgress) process.stdout.write('\n');
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to build ${pluginName} plugin from '${gitRef}': ${message}`);
    }
}

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
 * Before each test scenario with the @performancehints tag, verifies required pages exist.
 */
Before({tags: '@performancehints'}, async function (this: ICustomWorld) {
    const requiredPages = ['atf-lrc-1', 'atf-lrc-2'];
    
    for (const pageName of requiredPages) {
        const pageDataStdout = await getPostDataFromTitle(pageName, 'publish', 'ID,post_status');
        const pageData = await extractFromStdout(pageDataStdout);
        
        if (!pageData || pageData.length === 0) {
            throw new Error(
                `Required test page '${pageName}' does not exist. ` +
                `Template loader plugin may have failed.`
            );
        }
    }
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
 * After each test scenario with the @imagify tag, performs teardown tasks.
 */
After({tags: '@imagify'}, async function (this: ICustomWorld) {
    // Only uninstall if Imagify is installed
    if (await isPluginInstalled('imagify')) {
        await uninstallPlugin('imagify');
    }
});

/**
 * After each test scenario with the @compatibility tag, cleans up the Cloudflare plugin.
 * Deactivates and removes the Cloudflare plugin via the UI when installed to ensure
 * credentials and configuration are cleared after compatibility tests.
 */
After({tags: '@cloudflare-compatibility'}, async function (this: ICustomWorld) {
    // Deactivate and remove Cloudflare plugin from UI if it was installed, using UI because CLI doesn't clear credentials
    if (await isPluginInstalled('cloudflare')) {
        try {
            await this.utils.removeCloudflareViaUi();
        } catch (error) {
            // Log and continue cleanup to ensure debug log handling and browser closing still run
            // eslint-disable-next-line no-console
            console.error('Failed to remove Cloudflare via UI during After hook cleanup:', error);
        }
    }
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