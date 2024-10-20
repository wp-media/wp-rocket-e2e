/**
 * @fileoverview
 * This module contains Cucumber step definitions using Playwright for various actions and assertions related to data import and export.
 * It includes steps for installing a previous version of the plugin, disabling settings, saving specific settings, updating to the latest version,
 * importing and exporting data, and asserting the correctness of imported/exported data.
 *
 * @requires {@link ../../common/custom-world}
 * @requires {@link @playwright/test}
 * @requires {@link @cucumber/cucumber}
 * @requires {@link ../../../utils/types}
 * @requires {@link ../../../utils/helpers}
 * @requires {@link ../../../utils/exclusions}
 */
import { ICustomWorld } from "../../common/custom-world";
import {expect} from "@playwright/test";
import { Given, When, Then } from '@cucumber/cucumber';

import type { ExportedSettings} from '../../../utils/types';
import { readAnyFile, isExportedCorrectly } from '../../../utils/helpers';
import { enabledOptions, diffChecker as diffCheckerExclusions } from '../../../utils/exclusions';

import { diff } from 'json-diff';

/**
 * Executes the step to disable all settings.
 */
Given('I disabled all settings', async function (this: ICustomWorld) {
    await this.utils.disableAllOptions();
});

/**
 * Executes the step to update to the latest version of the WP Rocket plugin.
 */
Given('I updated to latest version', async function (this: ICustomWorld) {
    await this.utils.uploadNewPlugin('./plugin/new_release.zip');
    await this.page.waitForLoadState('load', { timeout: 30000 });
    await expect(this.page).toHaveURL(/action=upload-plugin/); 
    
    // Replace current with uploaded
    await this.page.locator('a:has-text("Replace current with uploaded")').click();

    await this.page.waitForLoadState('load', { timeout: 30000 });
    await expect(this.page).toHaveURL(/overwrite=update-plugin/); 
});

/**
 * Executes the step to import data.
 */
When('I import data', async function (this: ICustomWorld) {
    await this.utils.importSettings('./plugin/exported_settings/wp-rocket-settings-test-2023-00-01-64e7ada0d3b70.json');
    await expect(this.page.getByText('Settings imported and saved.')).toBeVisible();
});

/**
 * Executes the step to export data.
 */

When('I export data {string}', async function (this: ICustomWorld, fileNo: string) {
   if(! await this.page.url().includes('page=wprocket#tools')) 
        {
            await this.utils.visitPage('wp-admin/options-general.php?page=wprocket#tools');

        }
    await this.page.locator('#wpr-nav-tools').click();
    // Export settings.
    const downloadPromise = this.page.waitForEvent('download');
    await this.page.locator('.wpr-tools:nth-child(2) a').click();
    const download = await downloadPromise;
    // Wait for the download process to complete
    await download.path();
    // Save downloaded file
    await download.saveAs(`./plugin/exported_settings/wp-rocket-settings-test-2023-00-0${fileNo}-64e7ada0d3b70.json`);
});

/**
 * Executes the step to assert that data is imported correctly.
 */
Then('data is imported correctly', async function (this: ICustomWorld) {
    await this.utils.gotoWpr();
    /**
     * Assert that data is imported correctly.
     */
    if(await this.sections.doesSectionExist('cache')) {
        await this.sections.set("cache").visit();
        await expect(this.page.locator(this.sections.getStringProperty("cacheLoggedUser", "element"))).toBeChecked();
        const mobileDeviceCache = await this.page.locator(this.sections.getStringProperty("mobileDeviceCache", "element")).isChecked();
        expect(mobileDeviceCache).toBeFalsy();
        const separateMobileDeviceCache = await this.page.locator(this.sections.getStringProperty("mobileDeviceSeparateCache", "element")).isChecked();
        expect(separateMobileDeviceCache).toBeFalsy();
    }

    // No option is enabled in file optimization section.
    await this.sections.set("fileOptimization").visit();
    const fileOptOptions = await this.sections.areOptionsDisabled();
    expect(fileOptOptions, 'File Optimization: All options are not disabled').toBeTruthy();

    // No option is enabled in media section.
    await this.sections.set("media").visit();
    const mediaOptions = await this.sections.areOptionsDisabled();
    expect(mediaOptions, 'Media: All options are not disabled').toBeTruthy();

    // No option is enabled in preload section.
    await this.sections.set("preload").visit();
    const preloadOptions = await this.sections.areOptionsDisabled();
    expect(preloadOptions, 'Preload: All options are not disabled').toBeTruthy();

    // No rule is set in advanced rules section.
    await this.sections.set("advancedRules").visit();
    const advancedRulesOptions = await this.sections.areTextBoxesEmpty();
    expect(advancedRulesOptions, 'Advanced Rules: All textboxes are not empty').toBeTruthy();

    // No option is enabled in database section.
    await this.sections.set("database").visit();
    const databaseOptions = await this.sections.areOptionsDisabled();
    expect(databaseOptions, 'Database: All options are not disabled').toBeTruthy();

    // No option is enabled in cdn section.
    await this.sections.set("cdn").visit();
    const cdnOptions = await this.sections.areOptionsDisabled();
    expect(cdnOptions, 'CDN: All options are not disabled').toBeTruthy();

    // No option is enabled in heartbeat section.
    await this.sections.set("heartbeat").visit();
    const heartbeatOptions = await this.sections.areOptionsDisabled();
    expect(heartbeatOptions, 'Heartbeat: All options are not disabled').toBeTruthy();

    // No option is enabled in addons section.
    await this.sections.set("addons").visit();
    const addonsOptions = await this.sections.areOptionsDisabled();
    expect(addonsOptions, 'Add-ons: All options are not disabled').toBeTruthy();
});

/**
 * Executes the step to assert that exported data is correct.
 */
Then('data {string} is exported correctly', async function (fileNo: string) {
    const jsonData = await readAnyFile(`./plugin/exported_settings/wp-rocket-settings-test-2023-00-0${fileNo}-64e7ada0d3b70.json`);
    const exportedSettings: ExportedSettings = JSON.parse(jsonData);
    const version = parseFloat(exportedSettings['version'].toString());

    if (version >= 3.16) {
        const exclusions: Array<string> = ['do_caching_mobile_files', 'cache_mobile'];
        enabledOptions.push(...exclusions);
    }
    
    const validatedExportedSettings = await isExportedCorrectly(exportedSettings, enabledOptions);
    expect(validatedExportedSettings, 'Settings was not exported correctly.').toBeTruthy();
});

/**
 * Executes the step to assert that there are no changes in exported files.
 */
Then('I must not see changes in exported files', async function () {
    // Get exported settings data.
    const jsonData1 = await readAnyFile('./plugin/exported_settings/wp-rocket-settings-test-2023-00-02-64e7ada0d3b70.json');
    const jsonData2 = await readAnyFile('./plugin/exported_settings/wp-rocket-settings-test-2023-00-03-64e7ada0d3b70.json');

    // Get excluded fields to ignore.
    const regex = new RegExp(diffCheckerExclusions.toString().replaceAll(',', '|'));
    const result = diff(JSON.parse(jsonData1), JSON.parse(jsonData2));  

    let counterCheck = 0;
    for (const key in result) {
        if (! regex.test(key)) {
            counterCheck++;
        }
    } 

    expect(!(counterCheck > 0), 'Exported data are not similar').toBeTruthy();
});