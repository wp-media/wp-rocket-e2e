import { ICustomWorld } from "../common/custom-world";
import { ChromiumBrowser, chromium } from '@playwright/test';
import { Sections } from '../common/sections';
import { selectors as pluginSelectors } from "./../common/selectors";
import { PageUtils } from "../../utils/page-utils";

import { After, AfterAll, Before, BeforeAll, Status, setDefaultTimeout } from "@cucumber/cucumber";
import fs from "fs/promises";
// import { deleteTransient, resetWP } from "../../utils/commands";
import { WP_BASE_URL } from "../../config/wp.config";
import wp, {cp, deleteTransient, generateUsers, resetWP, rm, unzip} from "../../utils/commands";
import {configurations, getWPDir} from "../../utils/configurations";

let browser: ChromiumBrowser;

setDefaultTimeout(process.env.PWDEBUG ? -1 : 60 * 10000);

BeforeAll(async function () {
    browser = await chromium.launch({ headless: false });
});

Before(async function (this: ICustomWorld) {

    await resetWP();
    const wpDir = getWPDir(configurations);
    await rm(`${wpDir}/wp-content/plugins/wp-rocket`)
    await rm(`${wpDir}/wp-content/plugins/wp-rocket-e2e-test-helper`)
    await wp('rewrite structure /%year%/%monthnum%/%postname%/')

    await cp(`${process.env.PWD}/plugin/wp-rocket.zip`, `${wpDir}/wp-content/plugins/wp-rocket.zip`)
    await unzip(`${wpDir}/wp-content/plugins/wp-rocket.zip`, `${wpDir}/wp-content/plugins/`)
    await rm(`${wpDir}/wp-content/plugins/wp-rocket.zip`)

    await cp(`${process.env.PWD}/plugin/wp-rocket-e2e-test-helper.zip`, `${wpDir}/wp-content/plugins/wp-rocket-e2e-test-helper.zip`)
    await unzip(`${wpDir}/wp-content/plugins/wp-rocket-e2e-test-helper.zip`, `${wpDir}/wp-content/plugins/`)
    await rm(`${wpDir}/wp-content/plugins/wp-rocket-e2e-test-helper.zip`)

    await generateUsers([
        {
            name: 'admin2',
            email: 'administrator@email.org',
            role: 'administrator',
        },
        {
            name: 'subscriber',
            email: 'subscriber@email.org',
            role: 'subscriber',
        },
        {
            name: 'editor',
            email: 'editor@email.org',
            role: 'editor',
        },
        {
            name: 'author',
            email: 'author@email.org',
            role: 'author',
        },
        {
            name: 'contributor',
            email: 'contributor@email.org',
            role: 'contributor',
        },
    ])


    this.context = await browser.newContext({
        recordVideo: {
            dir: "test-results/videos",
        },
    });
    this.page = await this.context.newPage();
    await this.page.setViewportSize({width: 2500, height: 2500})
    this.sections = new Sections(this.page, pluginSelectors);
    this.utils = new PageUtils(this.page, this.sections);
    
    await this.page.goto(WP_BASE_URL);

});

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

     await resetWP();

});

 After(async function () {
     deleteTransient('wp_rocket_customer_data')
 })

AfterAll(async function () {
    await browser.close();
})