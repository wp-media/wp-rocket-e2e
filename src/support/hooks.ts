import { ICustomWorld } from "../common/custom-world";
import { ChromiumBrowser, chromium } from '@playwright/test';
import { Sections } from './../common/sections';
import { selectors as pluginSelectors } from "./../common/selectors";
import { PageUtils } from "../../utils/page-utils";

import { After, AfterAll, Before, BeforeAll, Status, setDefaultTimeout } from "@cucumber/cucumber";
import fs from "fs/promises";
// import { deleteTransient, resetWP } from "../../utils/commands";
import { WP_BASE_URL } from "../../config/wp.config";

let browser: ChromiumBrowser;

setDefaultTimeout(process.env.PWDEBUG ? -1 : 60 * 10000);

BeforeAll(async function () {
    browser = await chromium.launch({ headless: false });
});

Before(async function (this: ICustomWorld) {
    this.context = await browser.newContext({
        recordVideo: {
            dir: "test-results/videos",
        },
    });
    this.page = await this.context.newPage();
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

    // resetWP();

});

// After(async function () {
//     deleteTransient('wp_rocket_customer_data')
// })

AfterAll(async function () {
    await browser.close();
})