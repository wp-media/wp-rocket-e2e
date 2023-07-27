import { test as base } from '@playwright/test';
import { Sections } from './sections';
import { selectors as pluginSelectors } from "./selectors";

type WprFixtures = {
  sections: Sections;
};

export const test = base.extend<WprFixtures>({
  sections: async ({ page }, use) => {
    // Set up the fixture.
    const sections = new Sections(page, pluginSelectors);
    await use(sections);
  },
});

export { expect } from '@playwright/test';