/**
 * @fileoverview
 * This file contains a Playwright test script for checking disabled options in WP Rocket settings.
 * It utilizes Playwright's testing framework and interacts with various sections like file optimization,
 * media, and CDN to check for any enabled options.
 *
 * @typedef {import('@playwright/test').Page} Page
 * @typedef {import('../common/sections/file.optimization').fileOptimization} fileOptimization
 * @typedef {import('./sections/media').media} Media
 * @typedef {import('./sections/cdn').cdn} CDN
 *
 * @param {Page} page - The Playwright page instance.
 * @returns {Promise<boolean>} - Returns true if any enabled option is found, otherwise returns false.
 */
import { Page } from '@playwright/test';

/**
 * Local dependencies.
 */
import { fileOptimization } from '../common/sections/file.optimization';
import { media as Media } from './sections/media';
import { cdn as CDN } from './sections/cdn';

export const checkDisabledOptions = async ( page: Page ) => {

    const fileOpt = new fileOptimization( page );
    const media = new Media( page );
    const cdn = new CDN( page );
/**
 * Function to check for disabled options in WP Rocket settings.
 *
 * @function
 * @async
 * @param {Page} page - The Playwright page instance.
 * @returns {Promise<boolean>} - Returns true if any enabled option is found, otherwise returns false.
 */

    if ( await fileOpt.checkAnyEnabledOption() ) {
        return true;
    }

    if ( await media.checkAnyEnabledOption() ) {
        return true;
    }

    if ( await cdn.checkAnyEnabledOption() ) {
        return true;
    }

    return false;
}









