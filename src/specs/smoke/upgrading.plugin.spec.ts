import { test, expect } from '../../common/fixtures';
import type { Page } from '@playwright/test';
import type { Sections } from '../../common/sections';

const upgradingPlugin = (): void => {
    test('Shouldn\'t cause fatal error when upgrade from 3.10.9 to latest version while using PHP 8.1.6 while beacon is open', async ( { page, utils, sections } ) => {

        // Upload WPR version 3.10.9
        await utils.uploadNewPlugin('./plugin/wp-rocket_3.10.9.zip');
        await expect(page).toHaveURL(/action=upload-plugin/); 

        // Activate WPR
        await page.waitForSelector('a:has-text("Activate Plugin")');
        await page.locator('a:has-text("Activate Plugin")').click();

        // Visit WPR settings page.
        await utils.gotoWpr();

        // Open RUCSS Beacon.
        await openRucssBeacon(sections, page);

        // Upgrade to the lastest WPR version.
        await utils.uploadNewPlugin('./plugin/new_release.zip');
        await page.waitForLoadState('load', { timeout: 30000 });
        await expect(page).toHaveURL(/action=upload-plugin/); 
        
        // Replace current with uploaded
        await page.locator('a:has-text("Replace current with uploaded")').click();

        await page.waitForLoadState('load', { timeout: 30000 });
        await expect(page).toHaveURL(/overwrite=update-plugin/); 

        // Visit WPR settings page.
        await utils.gotoWpr();

        // Open RUCSS Beacon.
        await openRucssBeacon(sections, page, true);

        // Go to plugin page.
        await utils.gotoPlugin();

        // Assert that there is no WPR related error in debug.log
        await expect(page.locator('#wpr_debug_log_notice')).toBeHidden();

        // Downgrade to the previous stable version
        await utils.uploadNewPlugin('./plugin/previous_stable.zip');
        await page.waitForLoadState('load', { timeout: 30000 });
        await expect(page).toHaveURL(/action=upload-plugin/); 

        // Replace current with uploaded
        await page.locator('a:has-text("Replace current with uploaded")').click();
        await page.waitForLoadState('load', { timeout: 30000 });

        // Visit WPR settings page.
        await utils.gotoWpr();

        // Open RUCSS Beacon.
        await openRucssBeacon(sections, page, true);

        // Go to plugin page.
        await utils.gotoPlugin();

        // Assert that there is no WPR related error in debug.log
        await expect(page.locator('#wpr_debug_log_notice')).toBeHidden();
    });
}

const openRucssBeacon = async (sections: Sections, page: Page, ignoreWait: boolean = false): Promise<void> => {
    // Open file optimization section.
    await sections.set("fileOptimization").visit();

    // Go through beacon.
    if (!ignoreWait) {
        // Enable Optimize CSS delivery option.
        await sections.state(true).toggle("rucss");

        await page.waitForSelector('iframe[title="Help Scout Beacon - Open"]');

        // Click the RUCSS Beacon
        await page.locator('a[data-beacon-article="6076083ff8c0ef2d98df1f97"]').click();
        await page.waitForSelector('iframe[title="Help Scout Beacon - Live Chat, Contact Form, and Knowledge Base"]');
    }
    const iframe = page.frameLocator('iframe[title="Help Scout Beacon - Live Chat, Contact Form, and Knowledge Base"]');

    await iframe.locator('#fullArticle').getByRole('link', { name: 'Feature benefits' }).click();
    await iframe.locator('#fullArticle').getByRole('link', { name: 'Feature overview' }).click();
    await iframe.locator('#fullArticle').getByRole('link', { name: 'Using Remove Unused CSS with Combine CSS files' }).click();
    await iframe.locator('#fullArticle').getByRole('link', { name: 'Using Remove Unused CSS with Autoptimize and Perfmatters' }).click();
    await iframe.locator('#fullArticle').getByRole('link', { name: 'How to exclude files from this optimization / retain selected CSS rules' }).click();
}

export default upgradingPlugin;