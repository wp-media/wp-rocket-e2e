import { test, expect } from '@playwright/test';

/**
 * Local deps.
 */
import { pageUtils } from '../../utils/page.utils';
import { fileOptimization } from '../common/sections/file.optimization';

const upgradingPlugin = () => {
    test('Shouldn\'t cause fatal error when upgrade from 3.10.9 to latest version while using PHP 8.1.6 while beacon is open', async ( { page } ) => {
    
        const page_utils = new pageUtils(page);
        const fileOpt = new fileOptimization( page );

        // Upload WPR version 3.10.9
        await page_utils.upload_new_plugin('./plugin/wp-rocket_3.10.9.zip');
        await expect(page).toHaveURL(/action\=upload\-plugin/); 

        // Activate WPR
        await page.waitForSelector('a:has-text("Activate Plugin")');
        await page.locator('a:has-text("Activate Plugin")').click();

        // Visit WPR settings page.
        await page_utils.goto_wpr();

        // Open RUCSS Beacon.
        await openRucssBeacon(fileOpt, page);

        // Upgrade to the lastest WPR version.
        await page_utils.upload_new_plugin('./plugin/wp-rocket.zip');
        await page.waitForLoadState('load', { timeout: 30000 });
        await expect(page).toHaveURL(/action\=upload\-plugin/); 
        
        // Replace current with uploaded
        await page.locator('a:has-text("Replace current with uploaded")').click();

        await page.waitForLoadState('load', { timeout: 30000 });
        await expect(page).toHaveURL(/overwrite\=update\-plugin/); 

        // Visit WPR settings page.
        await page_utils.goto_wpr();

        // Open RUCSS Beacon.
        await openRucssBeacon(fileOpt, page, true);

        // Go to plugin page.
        await page_utils.goto_plugin();

        // Assert that there is no WPR related error in debug.log
        await expect(page.locator('#wpr_debug_log_notice')).toBeHidden();

        // Downgrade to the previous stable version
        await page_utils.upload_new_plugin('./plugin/previous_stable.zip');
        await page.waitForLoadState('load', { timeout: 30000 });
        await expect(page).toHaveURL(/action\=upload\-plugin/); 

        // Replace current with uploaded
        await page.locator('a:has-text("Replace current with uploaded")').click();
        await page.waitForLoadState('load', { timeout: 30000 });

        // Visit WPR settings page.
        await page_utils.goto_wpr();

        // Open RUCSS Beacon.
        await openRucssBeacon(fileOpt, page, true);

        // Go to plugin page.
        await page_utils.goto_plugin();

        // Assert that there is no WPR related error in debug.log
        await expect(page.locator('#wpr_debug_log_notice')).toBeHidden();
    });
}

const openRucssBeacon = async (fileOpt, page, ignore_wait = false) => {
    // Open file optimization section.
    await fileOpt.visit();

    // Go through beacon.
    if (!ignore_wait) {
        // Enable Optimize CSS delivery option.
        await fileOpt.toggleOptimizeCssDelivery(true);
        // Activate RUCSS
        await fileOpt.enableRucss();
        
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