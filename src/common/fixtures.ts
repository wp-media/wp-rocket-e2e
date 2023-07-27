import { test as base } from '@playwright/test';
import { Sections } from './sections';
import { selectors as pluginSelectors } from "./selectors";
import { PageUtils } from '../../utils/page-utils';

type WprFixtures = {
  sections: Sections;
  utils: PageUtils;
};

export const test = base.extend<WprFixtures>({
  sections: async ({ page }, use) => {
    // Set up the fixture.
    const sections = new Sections(page, pluginSelectors);
    await use(sections);
  },
  utils: async ({ page }, use) => {
    // Set up the fixture.
    const utils = new PageUtils(page, new Sections(page, pluginSelectors));
    await use(utils);
  }
});

export { expect } from '@playwright/test';