import playwright, {BrowserContext} from "playwright";
import {After, AfterAll, Before, BeforeAll, Status} from "@cucumber/cucumber";
import {Browser, Page} from "@playwright/test";
import fs from "fs/promises";
import {deleteTransient, resetWP} from "../../utils/commands";
import {WP_BASE_URL} from "../../config/wp.config";

let browser: Browser;
let context: BrowserContext;

type Context = {
    page: Page
}

const world = { page: null } as Context;

BeforeAll(async function () {
    browser = await playwright.chromium.launch({
        headless: false,
    });
    context = await browser.newContext();
});

Before(async function ({ pickle }) {
    const scenarioName = pickle.name + pickle.id
    context = await browser.newContext({
        recordVideo: {
            dir: "test-results/videos",
        },
    });
    world.page = await context.newPage();
    await world.page.goto(WP_BASE_URL)
});

After(async function ({ pickle, result }) {
    let videoPath: string;
    let img: Buffer;
    if (result?.status == Status.FAILED) {
        img = await world.page.screenshot({ path: `./test-results/screenshots/${pickle.name}.png`, type: "png" })
        videoPath = await world.page.video().path();
    }
    await world.page.close();
    await context.close();
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

    resetWP();

});

After(async function () {
    deleteTransient('wp_rocket_customer_data')
})

AfterAll(async function () {
    await browser.close();
})

export default world