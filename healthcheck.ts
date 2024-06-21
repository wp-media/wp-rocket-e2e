import chalk from "chalk";
import wp from "./utils/commands";
import {PageUtils} from './utils/page-utils';
import {WP_BASE_URL} from "./config/wp.config";
import {chromium as chrome, expect, Page} from '@playwright/test';
import {Sections} from "./src/common/sections";
import {selectors as pluginSelectors} from "./src/common/selectors";

export async function checkWPStatus(): Promise<void> {
    const status: boolean =  await wp('--info');

    console.log(chalk.blue.bold('WP CLI Basic Setup Status'));
    console.log(chalk.blue('=====================\n'));

    let statusColor = chalk.green,
        statusSymbol =  '✔️',
        message = 'WP CLI is running';

    if(!status) {
        statusColor =  chalk.red;
        statusSymbol =  '❌';
        message = 'WP CLI is not running, please check your config'
    }

    console.log(`'WP CLI health check': ${statusColor.bold(message.toUpperCase())} ${statusSymbol}`);
    console.log(statusColor(message));
    console.log(chalk.blue('-------------------------'));
}


async function setupBrowser(headless: boolean = false):Promise<Page> {
    const browser = await chrome.launch({ headless });
    const context = await browser.newContext();

    return await context.newPage();
}

export async function openE2EPage(): Promise<void> {
    const page = await setupBrowser(false);

    await page.goto(WP_BASE_URL);
}

export async function auth(): Promise<void> {
    const page = await setupBrowser(false);
    const sections = new Sections(page, pluginSelectors);
    const utils = new PageUtils(page, sections);

    await utils.auth()
    page.on('response', async (response) => {
        expect(response.status()).not.toEqual(500);
        expect(response.status()).not.toEqual(404);
    });

    await utils.wpAdminLogout()
}

(async (): Promise<void> => {
    await checkWPStatus();
    await openE2EPage();
    await auth();

    process.exit(0);
})();