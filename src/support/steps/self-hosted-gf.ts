/**
 * @fileoverview
 * This module contains Cucumber step definitions using Playwright to verify 
 * that the Self-host Google Fonts feature is applied in the page source.
 * It includes steps for confirming that Google Fonts are hosted locally, 
 * validating `data-wpr-hosted-gf-parameters` attributes, and checking that parameters match.
 *
 * @requires {@link ../../common/custom-world}
 * @requires {@link @playwright/test}
 * @requires {@link @cucumber/cucumber}
 */
import {ICustomWorld} from "../../common/custom-world";
import {Then, When} from "@cucumber/cucumber";
import type { Route } from '@playwright/test';
import {SelfHostGoogleFontsConfig} from "../../../utils/types";

import {WP_BASE_URL} from "../../../config/wp.config";
import fs from 'fs/promises';


let selfHostJsonData: SelfHostGoogleFontsConfig;
/**
 * Normalizes Google Fonts parameter strings, joining multiple segments and parsing all key-value pairs.
 * Accepts a string or array of strings, splits by ',', and merges all resulting parameters.
 */
const normalizeParams = (paramStr: string | string[]): Record<string,string> => {
  const input = Array.isArray(paramStr) ? paramStr.join(',') : paramStr;
  if (typeof input !== 'string') return {};
  const segments = input.split(',');
  const params = new URLSearchParams();
  for (const segment of segments) {
    try {
      const parsed = new URLSearchParams(segment);
      for (const [k, v] of parsed.entries()) params.append(k, v);
    } catch {/* ignore bad segments */}
  }
  return Object.fromEntries(params);
};

/**
 * Executes step to visit page based on the templates and check for self-hosted Google Fonts.
 */
When('I visit the urls and check for self-hosted google fonts', async function (this: ICustomWorld) {
  // Load expected results from JSON file
  const resultFile = './src/support/results/expectedResultsSelfHostGoogleFonts.json';
  const fileData: string = await fs.readFile(resultFile, 'utf8');

  // Assign to the top-level variable
  selfHostJsonData = JSON.parse(fileData) as SelfHostGoogleFontsConfig;

  const handler = async (route: Route): Promise<void> => {
  const url = route.request().url();
  if (url.includes('fonts.googleapis.com') || url.includes('/wp-content/cache/fonts')) {
    console.log(`Font request: ${url}`);
  }
  await route.continue();
};
  await this.page.route('**/*', handler);

  // Collect mismatches for reporting at the end
  const mismatches: string[] = [];

  try {
    for (const templateKey in selfHostJsonData) {
      const entry = selfHostJsonData[templateKey];
      if (!entry.enabled) continue;

      const pageUrl = `${WP_BASE_URL}/${templateKey}`;
      console.log(`Checking template: ${templateKey} -> ${pageUrl}`);
      try {
        await this.utils.visitPage(templateKey);
        await this.page.waitForLoadState('networkidle');

        try {
          await this.page.waitForFunction(() => {
            const links = Array.from(document.querySelectorAll('link[data-wpr-hosted-gf-parameters]'));
            return links.some(link => {
              const rel = (link.getAttribute('rel') || '').toLowerCase();
              const asAttr = (link.getAttribute('as') || '').toLowerCase();
              return rel === 'stylesheet' || (rel === 'preload' && asAttr === 'style');
            });
          }, { timeout: 30000 });
        } catch {
          const fallbackLinks = await this.page.evaluate(() =>
            Array.from(document.querySelectorAll('link')).map(l => l.outerHTML)
          );
          mismatches.push(
            `Timeout while waiting for self-hosted fonts on template: ${templateKey}\n` +
            `URL: ${pageUrl}\nLink tags found:\n${fallbackLinks.join('\n')}\n`
          );
          continue;
        }

        const fontLinks = await this.page.evaluate(() => {
          return Array.from(document.querySelectorAll('link[data-wpr-hosted-gf-parameters]'))
            .map(link => ({
              href: link.getAttribute('href') || '',
              parameters: link.getAttribute('data-wpr-hosted-gf-parameters') || ''
            }))
            .filter(link => !!link.parameters);
        });

        const normalizeFontPath = (u: string): string => {
        try { const p = new URL(u); return p.pathname + p.search; } catch { return u; }
        };

        const expectedFonts = (entry.fonts || []).map(f => f.trim()).sort();
        const actualFonts = fontLinks
          .map(f => f.href.trim())
          .filter(href => href.length > 0 && href.includes('/wp-content/cache/fonts'))
          .map(href => normalizeFontPath(href))
          .sort();

        const missingFonts = expectedFonts.filter(f => !actualFonts.includes(f));
        const unexpectedFonts = actualFonts.filter(f => !expectedFonts.includes(f));

        const expectedParams = entry.gfParameters ? normalizeParams(entry.gfParameters) : {};
        const combinedActualParams = fontLinks.reduce<Record<string,string>>((acc, link) => {
          const actual = normalizeParams(link.parameters);
          return { ...acc, ...actual };
        }, {});
        const allParamsMatch = Object.entries(expectedParams).every(
          ([k, v]) => combinedActualParams[k] === v
        );

        const shouldReportFontDiff = (expectedFonts.length > 0) && (actualFonts.length > 0);
        if ((shouldReportFontDiff && (missingFonts.length || unexpectedFonts.length)) || !allParamsMatch) {
          const parts: string[] = [
            `Template: ${templateKey}`,
            `URL: ${pageUrl}`
          ];
          if (shouldReportFontDiff) {
            parts.push(
              `Expected Fonts: ${JSON.stringify(expectedFonts, null, 2)}`,
              `Actual Fonts:   ${JSON.stringify(actualFonts, null, 2)}`,
              `Missing Fonts:  ${JSON.stringify(missingFonts, null, 2)}`,
              `Unexpected Fonts: ${JSON.stringify(unexpectedFonts, null, 2)}`,
            );
          }
          parts.push(
            `Expected Parameters: ${entry.gfParameters}`,
            `Actual Parameters Found:\n${fontLinks.map(f => `- ${f.parameters}`).join('\n')}`
          );
          mismatches.push(parts.join('\n'));
        }
      } catch (error) {
        mismatches.push(
          `Error while checking template: ${templateKey}\nURL: ${pageUrl}\n` +
          `Error: ${error instanceof Error ? error.message : String(error)}\n`
        );
      }
    }
  } finally {
    await this.page.unroute('**/*', handler);
  }

  if (mismatches.length > 0) {
    throw new Error(`Font mismatches found:\n\n${mismatches.join('\n')}`);
  }
});

/**
 * Executes the step to assert data-wpr-hosted-gf-parameters match expected.
 */
Then('hosted Google Fonts parameters should match expected for all enabled entries', async function (this: ICustomWorld) {
  const mismatches: string[] = [];

  for (const key in selfHostJsonData) {
    const entry = selfHostJsonData[key];
    if (!entry?.enabled || !entry.gfParameters) continue;

    console.log(`Checking parameters for: ${key}`);
    await this.utils.visitPage(key);
    await this.page.waitForLoadState('networkidle');

    const actualParamsList = await this.page.evaluate(() =>
      Array.from(document.querySelectorAll('link[data-wpr-hosted-gf-parameters]'))
        .map(link => link.getAttribute('data-wpr-hosted-gf-parameters') || '')
    );

    const expectedNormalized = normalizeParams(entry.gfParameters);

    // Merge parameters from all found link tags, since some themes split families across multiple tags
    const combinedActualNormalized = actualParamsList.reduce<Record<string, string>>((acc, actual) => {
      const parsed = normalizeParams(actual);
      return { ...acc, ...parsed };
    }, {});

    // Check that every expected key/value is present in the combined actual params
    const matched = Object.entries(expectedNormalized).every(([k, v]) => combinedActualNormalized[k] === v);

    if (!matched) {
      mismatches.push(
        `Template: ${key}\nExpected: ${entry.gfParameters}\n` +
        `Actual found:\n${actualParamsList.map(p => `- ${p}`).join('\n')}\n`
      );
    }
  }

  if (mismatches.length > 0) {
    throw new Error(`Google Fonts parameter mismatches found:\n\n${mismatches.join('\n')}`);
  }
});