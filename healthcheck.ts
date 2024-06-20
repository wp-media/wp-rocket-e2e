import chalk from "chalk";
import wp from "./utils/commands";
import { PageUtils } from './utils/page-utils';
import { WP_BASE_URL } from "./config/wp.config";
import { chromium, Browser, Page } from 'playwright';
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

export async function openE2EPage(): Promise<void> {
    const browser: Browser = await chromium.launch({ headless: false });
    const page: Page = await browser.newPage();
    await page.goto(WP_BASE_URL);
    await page.waitForLoadState('load', { timeout: 30000 });

}

export async function auth(): Promise<void> {

}


(async (): Promise<void> => {
    await checkWPStatus();
    await openE2EPage();


    process.exit(0);
})();