import { test, expect, Browser } from '@playwright/test';

/**
 * Local deps.
 */
import { WP_BASE_URL } from '../../config/wp.config';
import { pageUtils } from '../../utils/page.utils';
import { exportedSettings } from '../../utils/interfaces';
import { read_any_file, save_settings, is_exported_correctly } from '../../utils/helpers';
import { diff_checker as diff_checker_exclusions } from '../../utils/exclusions';

import { cache as Cache } from '../common/sections/cache';
import { fileOptimization } from '../common/sections/file.optimization';
import { media as Media } from '../common/sections/media';
import { preload as Preload } from '../common/sections/preload';
import { advancedRules } from '../common/sections/advanced.rules';
import { database as Database } from '../common/sections/database';
import { cdn as Cdn } from '../common/sections/cdn';
import { heartbeat as Heartbeat } from '../common/sections/heartbeat';
import { addons as Addons } from '../common/sections/addons';

const settingsExportImport = () => {
    test('Should not change the content of existing fields', async ( { page, browser } ) => {
    
        const page_utils = new pageUtils(page);
        const cache = new Cache(page);
        const fileOpt = new fileOptimization(page);
        const media = new Media(page);
        const preload = new Preload(page);
        const advanced_rules = new advancedRules(page);
        const database = new Database( page );
        const cdn = new Cdn(page);
        const heartbeat = new Heartbeat(page);
        const addons = new Addons(page);

        // Disable all WPR options.
        await page_utils.disable_all_options();

        // Enable only cache logged user option.
        await cache.visit();
        await cache.toggleCacheLoggedUser(true);
        await save_settings(page);

        await page.locator('#wpr-nav-tools').click();
        // Export settings.
        const downloadPromise = page.waitForEvent('download');
        await page.locator('.wpr-tools:nth-child(2) a').click();
        const download = await downloadPromise;
        // Wait for the download process to complete
        await download.path();
        // Save downloaded file
        await download.saveAs('./plugin/exported_settings/settings_1.json');

        // Change WPR version 
        await page_utils.upload_new_plugin('./plugin/previous_stable.zip');
        await page.waitForLoadState('load', { timeout: 30000 });
        await expect(page).toHaveURL(/action\=upload\-plugin/); 

        // Replace current with uploaded
        await page.locator('a:has-text("Replace current with uploaded")').click();
        await page.waitForLoadState('load', { timeout: 30000 });

        // import data.
        await page_utils.import_settings('./plugin/exported_settings/settings_1.json');
        await page.waitForLoadState('load', { timeout: 30000 });
        await page_utils.goto_wpr();

        /**
         * Check that settings is imported correctly.
         */
        await cache.visit();
        await expect(page.locator(cache.selectors.cache_logged_user.checkbox)).toBeChecked();
        const mobile_device_cache = await page.locator(cache.selectors.mobile_device_cache.checkbox).isChecked();
        expect(mobile_device_cache).toBeFalsy();
        const separate_mobile_device_cache = await page.locator(cache.selectors.mobile_device_separate_cache.checkbox).isChecked();
        expect(separate_mobile_device_cache).toBeFalsy();

        // No option is enabled in file optimization section.
        fileOpt.visit();
        const file_opt_options = await fileOpt.areAllOptionDisabled();
        expect(file_opt_options).toBeTruthy();

        // No option is enabled in media section.
        media.visit();
        const media_options = await media.areAllOptionDisabled();
        expect(media_options).toBeTruthy();

        // No option is enabled in preload section.
        preload.visit();
        const preload_options = await preload.areAllOptionDisabled();
        expect(preload_options).toBeTruthy();

        // No rule is set in advanced rules section.
        advanced_rules.visit();
        const advanced_rules_options = await advanced_rules.areAllRulesEmpty();
        expect(advanced_rules_options).toBeTruthy();

        // No option is enabled in database section.
        database.visit();
        const database_options = await database.areAllOptionDisabled();
        expect(database_options).toBeTruthy();

        // No option is enabled in cdn section.
        cdn.visit();
        const cdn_options = await cdn.areAllOptionDisabled();
        expect(cdn_options).toBeTruthy();

        // No option is enabled in heartbeat section.
        heartbeat.visit();
        const heartbeat_options = await heartbeat.areAllOptionDisabled();
        expect(heartbeat_options).toBeTruthy();

        // No option is enabled in addons section.
        addons.visit();
        const addons_options = await addons.areAllOptionDisabled();
        expect(addons_options).toBeTruthy();

        // Disable all WPR options.
        await page_utils.disable_all_options();

        // Enable lazyload for images
        await media.visit();
        await media.toggleLazyLoad(true);
        await save_settings(page);

        await page.waitForLoadState('load', { timeout: 30000 });

        await page.locator('#wpr-nav-tools').click();
        // Export settings.
        const downloadPromise_2 = page.waitForEvent('download');
        await page.locator('.wpr-tools:nth-child(2) a').click();
        const download_2 = await downloadPromise_2;
        // Wait for the download process to complete
        await download_2.path();
        // Save downloaded file
        await download_2.saveAs('./plugin/exported_settings/settings_2.json');

        // Check settings is exported correctly.
        await check_exported_settings('./plugin/exported_settings/settings_2.json');

        // Update WPR to latest version
        await page_utils.upload_new_plugin('./plugin/new_release.zip');
        await page.waitForLoadState('load', { timeout: 30000 });
        await expect(page).toHaveURL(/action\=upload\-plugin/); 

        // Replace current with uploaded
        await page.locator('a:has-text("Replace current with uploaded")').click();
        await page.waitForLoadState('load', { timeout: 30000 });

        await page_utils.goto_wpr();
        // Disable all WPR options.
        await page_utils.disable_all_options();

        // Enable lazyload for images
        await media.visit();
        await media.toggleLazyLoad(true);
        await save_settings(page);

        await page.waitForLoadState('load', { timeout: 30000 });

        await page.locator('#wpr-nav-tools').click();
        // Export settings.
        const downloadPromise_3 = page.waitForEvent('download');
        await page.locator('.wpr-tools:nth-child(2) a').click();
        const download_3 = await downloadPromise_3;
        // Wait for the download process to complete
        await download_3.path();
        // Save downloaded file
        await download_3.saveAs('./plugin/exported_settings/settings_3.json');

        // Check settings is exported correctly.
        await check_exported_settings('./plugin/exported_settings/settings_3.json');

        await diff_checker(browser);

        await page_utils.wp_admin_logout();
        await page.waitForLoadState('load', { timeout: 30000 });

        // Navigate to pages.
        await page.goto(WP_BASE_URL);
        await page.goto(WP_BASE_URL + '/hello-world');

        await page_utils.auth();

         // Navigate to helper plugin.
        await page_utils.goto_helper();

        // Check that there is no related error in debug.log
        await expect(page.locator('#wpr_debug_log_notice')).toBeHidden();
    });
}

const check_exported_settings = async (file: string) => {
    const json_data = await read_any_file(file);
    const exported_settings: exportedSettings = JSON.parse(json_data);

    const validated_exported_settings = await is_exported_correctly(exported_settings, 'lazyload');
    expect(validated_exported_settings, 'Settings was not exported correctly.').toBeTruthy();
}

const diff_checker = async (browser: Browser) => {

    // Create a new incognito browser context
    const context = await browser.newContext();
    // Create a new page inside context.
    const page = await context.newPage();
    // Navigate to diff checker.
    await page.goto('https://www.diffchecker.com/text-compare/');
    await page.waitForLoadState('load', { timeout: 30000 });
    await page.locator('a:has-text("Use web version instead")').click();

    // Get exported settings data.
    const json_data_1 = await read_any_file('./plugin/exported_settings/settings_2.json');
    const json_data_2 = await read_any_file('./plugin/exported_settings/settings_3.json');

    // Fill data.
    await page.locator('.diff-input-twoBox:nth-child(1) .cm-content').fill(json_data_1);
    await page.locator('.diff-input-twoBox:nth-child(2) .cm-content').fill(json_data_2);
    await page.getByRole('button', { name: 'Find Difference' }).click();
    let diff_1 = page.locator('.diff-line-with-removes .diff-chunk-modified:nth-child(1)');
    let diff_2 = page.locator('.diff-line-with-inserts .diff-chunk-modified:nth-child(1)');

    // Get excluded fields to ignore.
    let regex = new RegExp(diff_checker_exclusions.toString().replaceAll(',', '|'));

    let counter_check = 0;
    for (let i = 0; i < await diff_1.count(); i++) {
        if (! regex.test(await diff_1.nth(i).textContent())) {
            counter_check++;
        }
    }

    for (let i = 0; i < await diff_2.count(); i++) {
        if (! regex.test(await diff_2.nth(i).textContent())) {
            counter_check++;
        }
    }

    expect(!(counter_check > 0), 'Exported data are not similar').toBeTruthy();

    await context.close();
}

export default settingsExportImport;