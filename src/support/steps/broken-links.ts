/**
 * @fileoverview
 * This module contains Cucumber step definitions for validating links in WP Rocket settings UI.
 *
 * @requires {@link ../../common/custom-world}
 * @requires {@link @playwright/test}
 * @requires {@link @cucumber/cucumber}
 */
import { expect } from '@playwright/test';
import { Then } from '@cucumber/cucumber';
import { ICustomWorld } from '../../common/custom-world';

/**
 * Executes the step to verify that WP Rocket settings links are not broken.
 */
Then('WP Rocket settings links are not broken', async function (this: ICustomWorld) {
    const hrefs = new Set<string>();

    // Visit WP Rocket settings.
    await this.utils.visitPage('wp-admin/options-general.php?page=wprocket');

    const collectLinks = async (): Promise<void> => {
        const links = await this.page.$$eval('#wpbody-content a[href]', (elements) =>
            elements
                .map((element) => element.getAttribute('href'))
                .filter(Boolean)
        );

        for (const href of links) {
            hrefs.add(href as string);
        }
    };

    // Collect links from the base settings page first.
    await collectLinks();

    // Collect tab links from within the WP Rocket settings content.
    const tabHrefs = await this.page.$$eval('#wpbody-content a[href*="page=wprocket#"]', (links) =>
        links
            .map((link) => link.getAttribute('href'))
            .filter(Boolean)
    );

    const tabUrls = Array.from(new Set(tabHrefs)).map((href) => {
        return new URL(href as string, this.page.url()).toString();
    });

    for (const tabUrl of tabUrls) {
        await this.page.goto(tabUrl);
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
    }

    for (const url of normalizedUrls) {
        const response = await this.page.request.get(url, { maxRedirects: 5 });
        expect(response.status(), `Expected ${url} not to return 404`).not.toBe(404);
    }
});
