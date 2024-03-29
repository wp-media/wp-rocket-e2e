import { Then } from '@cucumber/cucumber';
import { ICustomWorld } from "../../common/custom-world";
import { expect } from "@playwright/test";

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