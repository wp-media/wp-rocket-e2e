/**
 * @fileoverview
 * This module contains Cucumber step definitions for validating links in WP Rocket settings UI.
 *
 * @requires {@link ../../common/custom-world}
 * @requires {@link @cucumber/cucumber}
 * @requires {@link ../../common/selectors}
 * @requires {@link ../../../utils/helpers}
 */
import { Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { ICustomWorld } from '../../common/custom-world';
import { linkValidationSelectors } from '../../common/selectors';
import { collectHrefsFromSelector, normalizeUrls, validateLinks } from '../../../utils/helpers';

/**
 * Step definition that verifies WP Rocket settings links are not broken by collecting all links from settings tabs
 * and checking their HTTP status codes. Fails on 4xx client errors except external 401/403 (auth-gated content).
 * Logs warnings for 5xx server errors to avoid flakiness from transient backend issues.
 *
 * @function
 * @async
 * @param {ICustomWorld} this - The Cucumber world context for the current scenario.
 * @return {Promise<void>} - A Promise that resolves when all links have been validated.
 */
Then('WP Rocket settings links are not broken', async function (this: ICustomWorld) {
    // Visit WP Rocket settings and store base URL for consistent resolution
    await this.utils.visitPage('wp-admin/options-general.php?page=wprocket');
    const basePageUrl = this.page.url();
    const currentHost = new URL(basePageUrl).host;

    // Collect links from base page
    let allHrefs = await collectHrefsFromSelector(this.page, linkValidationSelectors.allLinksInContent);

    // Get all tab URLs and visit each to collect their links
    const tabHrefs = await collectHrefsFromSelector(this.page, linkValidationSelectors.tabLinksInContent);

    const uniqueTabHrefs = Array.from(new Set(tabHrefs));
    const tabUrls: string[] = [];

    for (const href of uniqueTabHrefs) {
        try {
            const url = new URL(href, basePageUrl);
            tabUrls.push(url.toString());
        } catch (error: unknown) {
            // Skip malformed tab URLs - they can't be navigated to anyway
            // eslint-disable-next-line no-console
            console.warn(`Skipping malformed tab href: ${href}`, error);
        }
    }

    for (const tabUrl of tabUrls) {
        await this.page.goto(tabUrl);
        await this.page.waitForLoadState('load');
        const tabLinks = await collectHrefsFromSelector(this.page, linkValidationSelectors.allLinksInContent);
        allHrefs = new Set([...allHrefs, ...tabLinks]);
    }

    // Normalize and filter URLs
    const normalizedUrls = normalizeUrls(allHrefs, basePageUrl);

    // Warn if no valid URLs found to validate
    if (normalizedUrls.size === 0) {
        // eslint-disable-next-line no-console
        console.warn('No HTTP/HTTPS links found to validate in WP Rocket settings');
        return;
    }

    // Validate all collected URLs, excluding URLs that may trigger transactional side effects
    const skipPatterns = [/\/renew\//i, /\/upgrade\//i, /\/express-checkout/i];
    const brokenLinks = await validateLinks(this.page, normalizedUrls, currentHost, skipPatterns);

    // Report all broken links at once
    expect(brokenLinks, 'Broken links detected').toHaveLength(0);
});
