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

Then('I must see the correct style in the head.', async function (this: ICustomWorld) {
  const html = await this.page.evaluate(async () => {
    // Scroll to the bottom of page.
    const scrollPage: Promise<void> = new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if(totalHeight >= scrollHeight){
            clearInterval(timer);
            resolve();
        }
        }, 500);
    });

    await scrollPage;

    const styleTag = document.querySelector('#wpr-lazyload-bg');
    const match = document.documentElement.outerHTML.match(/const rocket_pairs = \[(.*?)\];/);

    return [
      styleTag ? styleTag.textContent : null,
      match ? match[1] : null
    ];
  });

  const styles = html[0];
  const rocketPairs = html[1];

  const regex = /:root[^}]+}/g;
  const matches = rocketPairs.match(regex);
  
  let isMatch = true;
  if (matches) {
    for (const match of matches) {
      const unescapedString = match.replace(/\\\//g, '/');
      if (!styles.includes(unescapedString)) {
          isMatch = false;
          break;
      }
    }
  } else {
    console.log("No matching style");
  }

  expect(isMatch).toBeTruthy();
});