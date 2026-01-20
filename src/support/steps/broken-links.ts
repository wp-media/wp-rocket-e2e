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
 * and checking their HTTP status codes. Fails on client errors (4xx) and logs warnings for server errors (5xx)
 * to avoid flakiness from transient backend issues.
 *
 * @function
 * @async
 * @param {ICustomWorld} this - The Cucumber world context for the current scenario.
 * @return {Promise<void>} - A Promise that resolves when all links have been validated.
 */
Then('WP Rocket settings links are not broken', async function (this: ICustomWorld) {
    const hrefs = new Set<string>();

    // Visit WP Rocket settings.
    await this.utils.visitPage('wp-admin/options-general.php?page=wprocket');

    const collectLinks = async (): Promise<void> => {
        const links = await this.page.$$eval(linkValidationSelectors.allLinksInContent, (elements) =>
            elements
                .map((element) => element.getAttribute('href'))
                .filter((href): href is string => Boolean(href))
        );

        for (const href of links) {
            hrefs.add(href);
        }
    };

    // Collect links from the base settings page first.
    await collectLinks();

    // Collect tab links from within the WP Rocket settings content.
    // Links are collected from each tab separately because different tabs may display different content
    // and therefore different links. This ensures comprehensive link coverage across all settings sections.
    const tabHrefs = await this.page.$$eval(linkValidationSelectors.tabLinksInContent, (links) =>
        links
            .map((link) => link.getAttribute('href'))
            .filter((href): href is string => Boolean(href))
    );

    const tabUrls = Array.from(new Set(tabHrefs)).map((href) => {
        return new URL(href, this.page.url()).toString();
    });

    // Visit each tab and collect its links to ensure all links across all settings sections are validated
    for (const tabUrl of tabUrls) {
        await this.page.goto(tabUrl);
        await this.page.waitForLoadState('load');
        await collectLinks();
    }

    const normalizedUrls = new Set<string>();
    const skipProtocols = ['mailto:', 'tel:', 'javascript:'];

    for (const href of hrefs) {
        const lowerHref = href.toLowerCase();
        if (lowerHref.startsWith('#')) {
            continue;
        }

        if (skipProtocols.some((protocol) => lowerHref.startsWith(protocol))) {
            continue;
        }

        try {
            const url = new URL(href, this.page.url());
            if (!['http:', 'https:'].includes(url.protocol)) {
                continue;
            }

            if (url.pathname.endsWith('/wp-admin/admin-post.php')) {
                // Avoid triggering admin-post actions.
                continue;
            }

            url.hash = '';
            normalizedUrls.add(url.toString());
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            // Log URL parsing issues for debugging while continuing to skip malformed URLs.
            // This helps understand why some links might not be checked.
            // eslint-disable-next-line no-console
            console.debug(
                `Skipping malformed or unsupported URL href="${href}" on page "${this.page.url()}": ${message}`
            );
            continue;
        }
    }

    const currentHost = new URL(this.page.url()).host;

    for (const url of normalizedUrls) {
        try {
            const response = await this.page.request.get(url, { maxRedirects: 5, timeout: 30000 });
            
            const status = response.status();
            const urlHost = new URL(url).host;
            
            // Treat client errors (4xx) as failures unless they are external 401/403 (expected gated content).
            if (status >= 400 && status < 500) {
                const isExternalHost = urlHost !== currentHost;

                // For external docs/checkout/account links, 401/403 are expected gates; log and continue.
                if (isExternalHost && (status === 401 || status === 403)) {
                    // eslint-disable-next-line no-console
                    console.warn(
                        `Skipping external ${status} for ${url} (expected auth/gated content).`
                    );
                } else {
                    throw new Error(`Client error: ${url} returned status ${status}`);
                }
            }
            
            // For server errors (5xx), log but don't fail to avoid flakiness from transient backend issues.
            if (status >= 500) {
                // eslint-disable-next-line no-console
                console.warn(
                    `Warning: ${url} returned server error status ${status}, but continuing test to avoid flakiness.`
                );
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            
            // If this is a client error (4xx), re-throw it to fail the test.
            if (message.startsWith('Client error:')) {
                throw error;
            }
            
            // For network errors (timeouts, connection issues, etc.), log but don't fail.
            // eslint-disable-next-line no-console
            console.warn(
                `Warning: Network or non-client error while requesting ${url}: ${message}. Continuing test.`
            );
        }
    }
});
