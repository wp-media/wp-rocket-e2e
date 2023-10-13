import { Then } from '@cucumber/cucumber';
import { ICustomWorld } from "../../common/custom-world";
import { WP_BASE_URL } from '../../../config/wp.config';
import { SCENARIO_URLS } from "../../../config/wp.config";
import { expect } from "@playwright/test";

Then('no error in the console different than nowprocket page', async function (this: ICustomWorld) {
    let consoleMsg1: string, consoleMsg2: string, i: number = 0;

    await this.page.route('**', (route) => {
        route.continue();
      });
    
      // Listen for console messages
      this.page.on('console', (msg) => {
        i += 1;
        const text = msg.text();

        switch (i) {
            case 1:
                consoleMsg1 = text;
                break;
            case 2:
                consoleMsg2 = text;
                break;
        }
      });
    
      await this.page.goto(`${WP_BASE_URL}/${SCENARIO_URLS.llcss}?nowprocket`);
      await this.page.waitForLoadState('load', { timeout: 50000 });
      await this.page.goto(`${WP_BASE_URL}/${SCENARIO_URLS.llcss}`);
      await this.page.waitForLoadState('load', { timeout: 50000 });

      expect(consoleMsg1 === consoleMsg2).toBeTruthy();
});