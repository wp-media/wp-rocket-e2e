import { ICustomWorld } from "../common/custom-world";
import { ChromiumBrowser, chromium } from '@playwright/test';
import { Sections } from '../common/sections';
import { selectors as pluginSelectors } from "./../common/selectors";
import { PageUtils } from "../../utils/page-utils";
import { batchUpdateVRTestUrl } from "../../utils/helpers";
import { deleteFolder } from "../../utils/helpers";
import backstop from 'backstopjs';
import { SCENARIO_URLS } from "../../config/wp.config";

import { After, AfterAll, Before, BeforeAll, Status, setDefaultTimeout } from "@cucumber/cucumber";
import fs from "fs/promises";
// import wp, {cp, deleteTransient, generateUsers, resetWP, rm, unzip} from "../../utils/commands";
// import {configurations, getWPDir} from "../../utils/configurations";

let browser: ChromiumBrowser;

setDefaultTimeout(process.env.PWDEBUG ? -1 : 100 * 10000);

BeforeAll(async function (this: ICustomWorld) {
    await deleteFolder('./backstop_data/bitmaps_test');
    browser = await chromium.launch({ headless: false });

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

After({tags: '@smoke'}, async function (this: ICustomWorld, { pickle, result }) {
    let videoPath: string;
    let img: Buffer;
    if (result?.status == Status.FAILED) {
        img = await this.page?.screenshot({ path: `./test-results/screenshots/${pickle.name}.png`, type: "png" })
        videoPath = await this.page?.video().path();
    }

    await this.page?.close();
    await this.context?.close();

    if (result?.status == Status.FAILED) {
        this.attach(
            img, "image/png"
        );
        const file = await fs.readFile(videoPath);
        this.attach(
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

AfterAll(async function () {
    await browser.close();
});

After({tags: '@llcssbg'}, async function(this: ICustomWorld, { pickle, result }) {
    await this.utils.cleanUp();

    let videoPath: string;
    let img: Buffer;
    if (result?.status == Status.FAILED) {
        img = await this.page?.screenshot({ path: `./test-results/screenshots/${pickle.name}.png`, type: "png" })
        videoPath = await this.page?.video().path();

        this.attach(
            img, "image/png"
        );
        const file = await fs.readFile(videoPath);
        this.attach(
            file,
            'video/webm'
        );
    }

    await this.page?.close();
    await this.context?.close();
});