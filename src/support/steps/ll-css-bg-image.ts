import { When, Then } from '@cucumber/cucumber';
import { ICustomWorld } from "../../common/custom-world";
import { expect } from "@playwright/test";
import {WP_BASE_URL} from "../../../config/wp.config";

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

const LL_BACKGROUND_IMAGES = {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    lazyload_css_background_images: {
        initialImages: [
            'https://new.rocketlabsqa.ovh/wp-content/rocket-test-data/images/test_inline1.jpeg',
            `${WP_BASE_URL}/`+'wp-content/rocket-test-data/images/test_inline2.jpeg',
            `${WP_BASE_URL}/`+'wp-content/rocket-test-data/images/test_internal0.webp'
        ],
        lazyLoadedImages: [
            'https://new.rocketlabsqa.ovh/wp-content/rocket-test-data/image/test3.webp',
            `${WP_BASE_URL}/`+'wp-content/rocket-test-data/image/file_example_JPG_100kB.jpg',
            'https://rocketlabsqa.ovh/wp-content/rocket-test-data/images/Spain.PNG',
            `${WP_BASE_URL}/`+'wp-content/rocket-test-data/images/paper.jpeg',
            `${WP_BASE_URL}/`+'wp-content/rocket-test-data/images/test_internal4.jpg',
            `${WP_BASE_URL}/`+'wp-content/rocket-test-data/images/testnotExist.png',
            `${WP_BASE_URL}/`+'wp-content/rocket-test-data/images/wp-rocket.svg',
            'https://new.rocketlabsqa.ovh/wp-content/rocket-test-data/images/butterfly.avif',
            `${WP_BASE_URL}/`+'wp-content/rocket-test-data/images/file_example_TIFF_1MB.tiff',
            'https://fastly.picsum.photos/id/976/200/300.jpg?hmac=s1Uz9fgJv32r8elfaIYn7pLpQXps7X9oYNwC5XirhO8',
            'https://rocketlabsqa.ovh/wp-content/rocket-test-data/images/fixtheissue.jpg',
            'https://mega.wp-rocket.me/avada/wp-content/rocket-test-data/prague-conference-center-1056491.jpg',
            `${WP_BASE_URL}/`+'wp-content/rocket-test-data/images/butterfly%202.avif',
            'https://new.rocketlabsqa.ovh/wp-content/rocket-test-data/images/paper%C3%A9quipesTest.jpeg',
            'https://new.rocketlabsqa.ovh/wp-content/rocket-test-data/images/test_internal2.jpg',
            `${WP_BASE_URL}/`+'wp-content/plugins/revslidertest/public/assets/assets/test_internal3.jpg',
            'https://new.rocketlabsqa.ovh/wp-content/rocket-test-data/images/paper.jpeg',
            `${WP_BASE_URL}/`+'wp-content/rocket-test-data/images/test.png',
            `${WP_BASE_URL}/`+'wp-content/rocket-test-data/image/test3.gif',
            `${WP_BASE_URL}/`+'wp-content/rocket-test-data/images/test_external1.jpeg',
            `${WP_BASE_URL}/`+'test.png',
            'https://upload.wikimedia.org/wikipedia/commons/1/11/Test-Logo.svg',
            `${WP_BASE_URL}/`+'kot%C5%82.png',
            `${WP_BASE_URL}/`+'wp-content/rocket-test-data/styles/assets/images/relative1.jpeg',
            `${WP_BASE_URL}/`+'wp-content/rocket-test-data/styles/assets/images/relative2.jpg',
            `${WP_BASE_URL}/`+'wp-content/rocket-test-data/images/lcp/testsvg.svg',
            'https://new.rocketlabsqa.ovh//wp-content/rocket-test-data/images/wp-rocket.svg',
            'https://new.rocketlabsqa.ovh/wp-content/rocket-test-data/images/wp-rocket2.svg',
        ]
    },
    // eslint-disable-next-line @typescript-eslint/naming-convention
    ll_bg_css_single_colon: {
        initialImages: [
            `${WP_BASE_URL}/`+'wp-content/rocket-test-data/images/fabio-sasso-UgpCjt4XLTY-unsplash.jpg',
            `${WP_BASE_URL}/`+'wp-content/rocket-test-data/images/lcp/testPng.png',
            `${WP_BASE_URL}/`+'wp-content/rocket-test-data/images/underline.png',
            `${WP_BASE_URL}/`+'wp-content/rocket-test-data/images/lcp/testjpg.jpg',
            `${WP_BASE_URL}/`+'wp-content/rocket-test-data/images/maxime-lebrun-6g3Akg708E0-unsplash.jpg',
            `${WP_BASE_URL}/`+'wp-content/rocket-test-data/images/lcp/testwebp.webp',
            `${WP_BASE_URL}/`+'wp-content/rocket-test-data/images/lcp/testavif.avif',
        ],
        lazyLoadedImages: [
            `${WP_BASE_URL}/` + 'wp-content/rocket-test-data/images/paper.jpeg',
            `${WP_BASE_URL}/` + 'wp-content/rocket-test-data/images/test-internal1.png',
            `${WP_BASE_URL}/` + 'wp-content/rocket-test-data/images/miguel-luis-6wxFtwSuXHQ-unsplash.jpg'
        ]
    },
    // eslint-disable-next-line @typescript-eslint/naming-convention
    ll_bg_css_double_colon:{
        initialImages: [
            `${WP_BASE_URL}/`+'wp-content/rocket-test-data/images/fabio-sasso-UgpCjt4XLTY-unsplash.jpg',
            `${WP_BASE_URL}/`+'wp-content/rocket-test-data/images/600px-Mapang-test.gif',
            `${WP_BASE_URL}/`+'wp-content/rocket-test-data/images/underline.png',
            `${WP_BASE_URL}/`+'wp-content/rocket-test-data/images/Przechwytywanie.PNG',
            `${WP_BASE_URL}/`+'wp-content/rocket-test-data/images/maxime-lebrun-6g3Akg708E0-unsplash.jpg',
            `${WP_BASE_URL}/`+'wp-content/rocket-test-data/images/Mapang-test.gif',
            `${WP_BASE_URL}/`+'wp-content/rocket-test-data/images/BigJPGImage_20mbmb.jpg',
        ],
        lazyLoadedImages: [
            `${WP_BASE_URL}/`+'wp-content/rocket-test-data/images/img_nature.jpg',
            `${WP_BASE_URL}/`+'wp-content/rocket-test-data/images/istockphoto-1184692500-612x612.webp',
            `${WP_BASE_URL}/`+'wp-content/rocket-test-data/images/miguel-luis-6wxFtwSuXHQ-unsplash.jpg',
        ]
    }
};

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