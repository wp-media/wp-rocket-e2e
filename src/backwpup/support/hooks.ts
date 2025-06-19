import { ICustomWorld } from "../../common/custom-world";
import { Sections } from '../../common/sections';
import { selectors as pluginSelectors } from "./../../common/selectors";
import { PageUtils } from "../../../utils/page-utils";
import { Before } from "@cucumber/cucumber";
import {ChromiumBrowser} from "@playwright/test";

/**
 * The Playwright Chromium browser instance used for testing.
 */
let browser: ChromiumBrowser;

/**
 * Before each test scenario with the @bwpsetup tag, performs setup tasks.
 */
Before({tags: '@bwpsetup'}, async function(this: ICustomWorld, {pickle}) {
    this.context = await browser.newContext({
        recordVideo: {
            dir: "test-results/videos",
        },
    });
    this.page = await this.context.newPage();
    this.sections = new Sections(this.page, pluginSelectors);
    this.utils = new PageUtils(this.page, this.sections);

    await this.utils.cleanUp('backwpup');
    this.pickle = pickle;
});