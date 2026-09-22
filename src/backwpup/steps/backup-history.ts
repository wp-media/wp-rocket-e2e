import { Then } from '@cucumber/cucumber';
import { ICustomWorld } from '../../common/custom-world';
import { expect } from '@playwright/test';
import * as path from 'path';
import { promises as fs } from 'fs';

/**
 * Click on download button for the first backup in the history
 */
Then(
    'I successfully download first backup in the history',
    async function (this: ICustomWorld) {
        const openMenuButton = '.js-backwpup-menu';
        const downloadButton =
            '.js-backwpup-menu-content>button.js-backwpup-download-backup';
        const downloadModal = '#TB_window';
        await this.page.locator(openMenuButton).waitFor({ state: 'visible' });
        await this.page.locator(openMenuButton).first().click(); // click to open the menu
        await this.page.locator(downloadButton).waitFor({ state: 'visible' });
        await this.page.locator(downloadButton).first().click(); // click the button to start download
        const downloadPromise = this.page.waitForEvent('download', {timeout: 60000}); // wait for the download event
        await this.page.locator(downloadModal).waitFor({ state: 'visible' });
        const download = await downloadPromise;
        const filename = download.suggestedFilename();
        expect(filename).toBeTruthy(); // non-empty string

        // Ensure the `temp` directory exists at project root
        const tempDir = path.resolve(process.cwd(), 'temp');
        await fs.mkdir(tempDir, { recursive: true });
        const savePath = path.join(tempDir, filename);
        await download.saveAs(savePath);
        expect(await download.path()).toBeTruthy(); // path is not null or undefined

        // Clear up the downloaded file after the test
        await fs.rm(savePath, { force: true });
    }
);
