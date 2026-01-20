/**
 * @fileoverview
 * This module contains Cucumber step definitions for validating links in WP Rocket settings UI.
 *
 * @requires {@link ../../common/custom-world}
 * @requires {@link @cucumber/cucumber}
 * @requires {@link ../../common/selectors}
 */
import { Then } from '@cucumber/cucumber';
import { ICustomWorld } from '../../common/custom-world';
import { linkValidationSelectors } from '../../common/selectors';

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
    const hrefs = new Set<string>();

    // Visit WP Rocket settings and store base URL for consistent resolution
    await this.utils.visitPage('wp-admin/options-general.php?page=wprocket');
    const basePageUrl = this.page.url();
    const currentHost = new URL(basePageUrl).host;

    // Helper to collect all links from current page
    const collectLinks = async (): Promise<void> => {
        const links = await this.page.$$eval(linkValidationSelectors.allLinksInContent, (elements) =>
            elements
                .map((el) => el.getAttribute('href'))
                .filter((href): href is string => Boolean(href))
        );
        links.forEach((href) => hrefs.add(href));
    };

    // Collect links from base page
    await collectLinks();

    // Get all tab URLs and visit each to collect their links
    const tabHrefs = await this.page.$$eval(linkValidationSelectors.tabLinksInContent, (links) =>
        links
            .map((link) => link.getAttribute('href'))
            .filter((href): href is string => Boolean(href))
    );

    const tabUrls = Array.from(new Set(tabHrefs)).map((href) => new URL(href, basePageUrl).toString());

    for (const tabUrl of tabUrls) {
        await this.page.goto(tabUrl);
        await this.page.waitForLoadState('load');
        await collectLinks();
    }

    // Normalize and filter URLs
    const normalizedUrls = new Set<string>();
    const skipProtocols = ['mailto:', 'tel:', 'javascript:'];

    for (const href of hrefs) {
        const lower = href.toLowerCase();

        // Skip anchors, special protocols, and admin-post actions
        if (lower.startsWith('#') || skipProtocols.some((p) => lower.startsWith(p))) {
            continue;
        }

        try {
            const url = new URL(href, basePageUrl);

            if (!['http:', 'https:'].includes(url.protocol) || url.pathname.endsWith('/wp-admin/admin-post.php')) {
                continue;
            }

            url.hash = '';
            normalizedUrls.add(url.toString());
        } catch (error) {
            // Skip malformed URLs silently - they can't be validated anyway
            continue;
        }
    }

    // Warn if no valid URLs found to validate
    if (normalizedUrls.size === 0) {
        // eslint-disable-next-line no-console
        console.warn('No HTTP/HTTPS links found to validate in WP Rocket settings');
        return;
    }

    // Validate all collected URLs
    const brokenLinks: string[] = [];

    for (const url of normalizedUrls) {
        try {
            const response = await this.page.request.get(url, { maxRedirects: 5, timeout: 30000 });
            const status = response.status();
            const isExternal = new URL(url).host !== currentHost;

            // Handle client errors (4xx)
            if (status >= 400 && status < 500) {
                // External 401/403 are expected (auth-gated), skip them
                if (!(isExternal && (status === 401 || status === 403))) {
                    brokenLinks.push(`${status}: ${url}`);
                }
            }

            // Log server errors (5xx) but don't fail
            if (status >= 500) {
                // eslint-disable-next-line no-console
                console.warn(`Warning: ${url} returned ${status} (server error, not failing test)`);
            }
        } catch (error: unknown) {
            // Network errors (timeout, DNS, connection) - log but don't fail
            const msg = error instanceof Error ? error.message : String(error);
            // eslint-disable-next-line no-console
            console.warn(`Warning: Network error for ${url}: ${msg}`);
        }
    }

    // Report all broken links at once
    if (brokenLinks.length > 0) {
        throw new Error(`Broken links detected:\n${brokenLinks.map((l) => `- ${l}`).join('\n')}`);
    }
});
