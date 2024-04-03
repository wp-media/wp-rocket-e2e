import { When, Then } from '@cucumber/cucumber';
import { ICustomWorld } from "../../common/custom-world";
import { expect } from "@playwright/test";
import {LL_BACKGROUND_IMAGES} from '../../../config/wp.config';

Then('I must see the correct style in the head', async function (this: ICustomWorld) {
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
  let failMessage: string = '';

  if (matches) {
    for (const match of matches) {
      let unescapedString = match.replace(/\\\//g, '/');
      unescapedString = JSON.parse(`"${unescapedString}"`);
      // Check if Image is LL'ed
      if (!styles.includes(unescapedString)) {
          failMessage = `The variable: ${unescapedString} is not lazy loaded in wpr-lazyload-bg`
          isMatch = false;
          break;
      }
    }
  } else {
    console.log("No matching style");
  }

  console.log(failMessage);

  expect(isMatch, failMessage).toBeTruthy();
});

When('I go to {string} check initial image loaded', async function (this: ICustomWorld, page) {
    const images = [];

    this.page.on('request', request => {
        if (request.resourceType() === 'image') {
            images.push(request.url());
        }
    });
    await this.utils.visitPage(page);
    await this.page.waitForLoadState('load', { timeout: 100000 });
    const template = LL_BACKGROUND_IMAGES[page].initialImages

    expect(images).toEqual(template)
});

Then('I must see other {string} images', async function (this: ICustomWorld, page) {
    const images = [];
    this.page.on('request', request => {
        if (request.resourceType() === 'image') {
            images.push(request.url());
        }
    });
    await this.utils.scrollDownBottomOfAPage();

    expect(images).toEqual(LL_BACKGROUND_IMAGES[page].lazyLoadedImages)
});

Then('Check {string} input for background images', async function (this: ICustomWorld, page) {
    const images = [];
    this.page.on('request', request => {
        if (request.resourceType() === 'image') {
            images.push(request.url());
        }
    });

    await this.page.locator('input[name="lastName"]').nth(1).fill('Random text')

    await this.utils.scrollDownBottomOfAPage();

    expect(images).toEqual(LL_BACKGROUND_IMAGES[page].lazyLoadedImages)
});