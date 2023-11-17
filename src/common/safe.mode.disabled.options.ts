/**
 * @fileoverview
 * This file contains a Playwright test script for toggling safe mode and enabling options in WP Rocket settings.
 * It utilizes Playwright's testing framework and interacts with various sections like file optimization,
 * media, and CDN to enable specific options. It also saves the settings using a helper function.
 *
 * @typedef {import('@playwright/test').Page} Page
 * @typedef {import('./sections/file.optimization').fileOptimization} fileOptimization
 * @typedef {import('./sections/media').media} Media
 * @typedef {import('./sections/cdn').cdn} CDN
 * @typedef {import('../../utils/helpers').save_settings} save_settings
 *
 * @param {Page} page - The Playwright page instance.
 * @returns {Promise<void>}
 */
import { Page } from '@playwright/test';

/**
 * Local dependencies.
 */
import { fileOptimization } from './sections/file.optimization';
import { media as Media } from './sections/media';
import { cdn as CDN } from './sections/cdn';
import { save_settings } from '../../utils/helpers';

export const toggleSafeModeDisabledOptions = async ( page: Page ) => {

/**
 * Function to toggle safe mode and enable options in WP Rocket settings.
 *
 * @function
 * @async
 * @param {Page} page - The Playwright page instance.
 * @returns {Promise<void>}
 */
    /**
     * File Optimization section
     */
    const fileOpt = new fileOptimization( page );
    await fileOpt.visit();

    // Enable Minify Css.
    await fileOpt.toggleMinifyCss();
    // Enable Combine Css.
    await fileOpt.enableCombineCss();
    // Enable Minify Js.
    await fileOpt.toggleMinifyJs();
    // Enable Combine Js.
    await fileOpt.enableCombineJs();
    // Enable Defer Js.
    await fileOpt.toggleDeferJs();
    // Enable Delay Js.
    await fileOpt.toggleDelayJs();

    /**
     * Media section.
     */
    const media = new Media( page );
    await media.visit();

    // Enable Lazy Load.
    await media.toggleLazyLoad();
    // Enable Lazy Load for Iframes.
    await media.toggleLazyLoadIframes();
    // Enable Lazy Load for Iframe Youtube.
    await media.toggleLazyLoadyoutube();
    // Enable Image Dimension.
    await media.toggleImageDimension();

    /**
     * CDN Section
     */
     const cdn = new CDN( page );
     await cdn.visit();
 
     // Enable CDN.
     await cdn.toggleCDN();

     // save settings
     await save_settings(page);
}









