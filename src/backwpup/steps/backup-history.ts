import { Then } from '@cucumber/cucumber';
import { ICustomWorld } from '../../common/custom-world';
import { expect } from '@playwright/test';

/**
 * Click on download button for the first backup in the history
 */
Then(
    'I successfully download first backup in the history',
    async function (this: ICustomWorld) {
        const [download] = await Promise.all([
            this.page.waitForEvent('download'), // wait for download to start
            this.page
                .locator('button.js-backwpup-download-backup')
                .first()
                .click() // click the button to start download
        ]);
        const filename = download.suggestedFilename();
        expect(filename).toBeTruthy(); // non-empty string

        const savePath = ''; // TODO: specify the path where you want to save the downloaded file
        await download.saveAs(savePath);
        expect(await download.path()).toBeTruthy(); // path is not null or undefined
    }
);
