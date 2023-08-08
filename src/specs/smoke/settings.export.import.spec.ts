import { test, expect } from '../../common/fixtures';
import type { Browser } from '@playwright/test';
import type { ExportedSettings } from '../../../utils/types';

/**
 * Local deps.
 */
import { WP_BASE_URL } from '../../../config/wp.config';
import { readAnyFile, isExportedCorrectly } from '../../../utils/helpers';
import { diffChecker as diffCheckerExclusions } from '../../../utils/exclusions';


const settingsExportImport = (): void => {
    test('Should not change the content of existing fields', async ( { page, browser, utils, sections } ) => {

        // Disable all WPR options.
        await utils.disableAllOptions();

        // Enable only cache logged user option.
        await sections.set("cache").visit();
        await sections.state(true).toggle("cacheLoggedUser");
        await utils.saveSettings();

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
        await utils.uploadNewPlugin('./plugin/previous_stable.zip');
        await page.waitForLoadState('load', { timeout: 30000 });
        await expect(page).toHaveURL(/action=upload-plugin/); 

        // Replace current with uploaded
        await page.locator('a:has-text("Replace current with uploaded")').click();
        await page.waitForLoadState('load', { timeout: 30000 });

        // import data.
        await utils.importSettings('./plugin/exported_settings/settings_1.json');
        await page.waitForLoadState('load', { timeout: 30000 });
        await utils.gotoWpr();

        /**
         * Check that settings is imported correctly.
         */
        await sections.set("cache").visit();
        await expect(page.locator(sections.getStringProperty("cacheLoggedUser", "element"))).toBeChecked();
        const mobileDeviceCache = await page.locator(sections.getStringProperty("mobileDeviceCache", "element")).isChecked();
        expect(mobileDeviceCache).toBeFalsy();
        const separateMobileDeviceCache = await page.locator(sections.getStringProperty("mobileDeviceSeparateCache", "element")).isChecked();
        expect(separateMobileDeviceCache).toBeFalsy();

        // No option is enabled in file optimization section.
        sections.set("fileOptimization").visit();
        const fileOptOptions = await sections.areOptionsDisabled();
        expect(fileOptOptions).toBeTruthy();

        // No option is enabled in media section.
        sections.set("media").visit();
        const mediaOptions = await sections.areOptionsDisabled();
        expect(mediaOptions).toBeTruthy();

        // No option is enabled in preload section.
        sections.set("preload").visit();
        const preloadOptions = await sections.areOptionsDisabled();
        expect(preloadOptions).toBeTruthy();

        // No rule is set in advanced rules section.
        sections.set("advancedRules").visit();
        const advancedRulesOptions = await sections.areTextBoxesEmpty();
        expect(advancedRulesOptions).toBeTruthy();

        // No option is enabled in database section.
        sections.set("database").visit();
        const databaseOptions = await sections.areOptionsDisabled();
        expect(databaseOptions).toBeTruthy();

        // No option is enabled in cdn section.
        sections.set("cdn").visit();
        const cdnOptions = await sections.areOptionsDisabled();
        expect(cdnOptions).toBeTruthy();

        // No option is enabled in heartbeat section.
        sections.set("heartbeat").visit();
        const heartbeatOptions = await sections.areOptionsDisabled();
        expect(heartbeatOptions).toBeTruthy();

        // No option is enabled in addons section.
        sections.set("addons").visit();
        const addonsOptions = await sections.areOptionsDisabled();
        expect(addonsOptions).toBeTruthy();

        // Disable all WPR options.
        await utils.disableAllOptions();

        // Enable lazyload for images
        await sections.set("media").visit();
        await sections.state(true).toggle("lazyload");
        await utils.saveSettings();

        await page.waitForLoadState('load', { timeout: 30000 });

        await page.locator('#wpr-nav-tools').click();
        // Export settings.
        const downloadPromise2 = page.waitForEvent('download');
        await page.locator('.wpr-tools:nth-child(2) a').click();
        const download2 = await downloadPromise2;
        // Wait for the download process to complete
        await download2.path();
        // Save downloaded file
        await download2.saveAs('./plugin/exported_settings/settings_2.json');

        // Check settings is exported correctly.
        await checkExportedSettings('./plugin/exported_settings/settings_2.json');

        // Update WPR to latest version
        await utils.uploadNewPlugin('./plugin/new_release.zip');
        await page.waitForLoadState('load', { timeout: 30000 });
        await expect(page).toHaveURL(/action=upload-plugin/); 

        // Replace current with uploaded
        await page.locator('a:has-text("Replace current with uploaded")').click();
        await page.waitForLoadState('load', { timeout: 30000 });

        await utils.gotoWpr();
        // Disable all WPR options.
        await utils.disableAllOptions();

        // Enable lazyload for images
        await sections.set("media").visit();
        await sections.state(true).toggle("lazyload");
        await utils.saveSettings();

        await page.waitForLoadState('load', { timeout: 30000 });

        await page.locator('#wpr-nav-tools').click();
        // Export settings.
        const downloadPromise3 = page.waitForEvent('download');
        await page.locator('.wpr-tools:nth-child(2) a').click();
        const download3 = await downloadPromise3;
        // Wait for the download process to complete
        await download3.path();
        // Save downloaded file
        await download3.saveAs('./plugin/exported_settings/settings_3.json');

        // Check settings is exported correctly.
        await checkExportedSettings('./plugin/exported_settings/settings_3.json');

        await diffChecker(browser);

        await utils.wpAdminLogout();
        await page.waitForLoadState('load', { timeout: 30000 });

        // Navigate to pages.
        await page.goto(WP_BASE_URL);
        await page.goto(WP_BASE_URL + '/hello-world');

        await utils.auth();

         // Navigate to helper plugin.
        await utils.gotoHelper();

        // Check that there is no related error in debug.log
        await expect(page.locator('#wpr_debug_log_notice')).toBeHidden();
    });
}

const checkExportedSettings = async (file: string): Promise<void> => {
    const jsonData = await readAnyFile(file);
    const exportedSettings: ExportedSettings = JSON.parse(jsonData);

    const validatedExportedSettings = await isExportedCorrectly(exportedSettings, 'lazyload');
    expect(validatedExportedSettings, 'Settings was not exported correctly.').toBeTruthy();
}

const diffChecker = async (browser: Browser): Promise<void> => {

    // Create a new incognito browser context
    const context = await browser.newContext();
    // Create a new page inside context.
    const page = await context.newPage();
    // Navigate to diff checker.
    await page.goto('https://www.diffchecker.com/text-compare/');
    await page.waitForLoadState('load', { timeout: 30000 });
    await page.locator('a:has-text("Use web version instead")').click();

    // Get exported settings data.
    const jsonData1 = await readAnyFile('./plugin/exported_settings/settings_2.json');
    const jsonData2 = await readAnyFile('./plugin/exported_settings/settings_3.json');

    // Fill data.
    await page.locator('.diff-input-twoBox:nth-child(1) .cm-content').fill(jsonData1);
    await page.locator('.diff-input-twoBox:nth-child(2) .cm-content').fill(jsonData2);
    await page.getByRole('button', { name: 'Find Difference' }).click();
    const diff1 = page.locator('.diff-line-with-removes .diff-chunk-modified:nth-child(1)');
    const diff2 = page.locator('.diff-line-with-inserts .diff-chunk-modified:nth-child(1)');

    // Get excluded fields to ignore.
    const regex = new RegExp(diffCheckerExclusions.toString().replaceAll(',', '|'));

    let counterCheck = 0;
    for (let i = 0; i < await diff1.count(); i++) {
        if (! regex.test(await diff1.nth(i).textContent())) {
            counterCheck++;
        }
    }

    for (let i = 0; i < await diff2.count(); i++) {
        if (! regex.test(await diff2.nth(i).textContent())) {
            counterCheck++;
        }
    }

    expect(!(counterCheck > 0), 'Exported data are not similar').toBeTruthy();

    await context.close();
}

export default settingsExportImport;