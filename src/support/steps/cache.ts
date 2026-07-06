/**
 * @fileoverview
 * Step definitions for cache-related tests.
 *
 * @requires {@link ../../common/custom-world}
 * @requires {@link @playwright/test}
 * @requires {@link @cucumber/cucumber}
 * @requires {@link ../../../config/wp.config}
 * @requires {@link ../../../utils/commands}
 */
import { Then, When } from '@cucumber/cucumber';
import { ICustomWorld } from '../../common/custom-world';
import { exists, getFileMtime } from '../../../utils/commands';
import { WP_SSH_ROOT_DIR, WP_BASE_URL } from '../../../config/wp.config';
import { expect } from '@playwright/test';

let recordedCacheFile: string = '';
let recordedMtime: string = '';

function getCachePaths(): { html: string; https: string } {
    const hostname = new URL(WP_BASE_URL).hostname;
    return {
        html: `${WP_SSH_ROOT_DIR}wp-content/cache/wp-rocket/${hostname}/index.html`,
        https: `${WP_SSH_ROOT_DIR}wp-content/cache/wp-rocket/${hostname}/index-https.html`,
    };
}

When('I refresh admin', async function (this: ICustomWorld) {
    await this.page.goto(`${WP_BASE_URL}/wp-admin/`);
});

/**
 * Asserts that the homepage cache file exists and records its path and mtime
 * so a subsequent step can verify the file was not regenerated.
 */
Then('homepage cache should exist', async function (this: ICustomWorld) {
    const { html, https } = getCachePaths();

    const htmlExists = await exists(html);
    const httpsExists = await exists(https);

    expect(htmlExists || httpsExists).toBeTruthy();

    recordedCacheFile = htmlExists ? html : https;
    recordedMtime = await getFileMtime(recordedCacheFile);
    expect(recordedMtime).not.toBe('');
});

/**
 * Asserts that the cache file recorded by the previous step still exists
 * AND has the same mtime — proving it was neither cleared nor regenerated.
 */
Then('homepage cache should not be regenerated', async function (this: ICustomWorld) {
    expect(recordedCacheFile).toBeTruthy();

    const stillExists = await exists(recordedCacheFile);
    expect(stillExists).toBeTruthy();

    const currentMtime = await getFileMtime(recordedCacheFile);
    expect(currentMtime).toBe(recordedMtime);
});
