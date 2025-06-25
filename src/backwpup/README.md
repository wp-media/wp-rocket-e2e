# Welcome to BackWpUp E2E Tests Repo
E2E tests here are written with Playwright. Without further ado, let's meet below below ⤵️


## Requirements
- Do you still not have node installed? You'll be needing it.
- You also need zip files of Backwpup pro, I'll explain:
    - zip the latest release - **rename the zip file name to `backwpup-pro.zip`. e.g `backwpup-5.3.1.zip` becomes `backwpup-pro.zip`**
    - Make sure to put the file in the `./plugin` folder in the root - Playwright will pick these files when needed and use them during tests.


## Installation
- Clone this repo
- run a `npm install` to install dependencies, well for this case it's just playwright.
- Additionally, in some cases on a fresh install you might also need to run `npx playwright install` to download the various browser engines as well.


## Configuration
You'll need to update the site you want to run tests on as well as the credentials.

Update the `wp.config.sample.ts` to `wp.config.ts` in https://github.com/wp-media/wp-rocket-e2e/blob/trunk/config/

Change the `live_username` & `live_password` & `WP_BASE_URL` to that of your test site.

You can find this [here](https://github.com/wp-media/wp-rocket-e2e/blob/trunk/config/wp.config.sample.ts)

## Running Tests
- Please delete forget to delete the backup after running your tests, We will automate this step in the future.
- To run tests on playwright, simply run `npm run test:bwpupsmoke` which ever you prefer.

**NB:** By default, test will run in headless mode.

## Debugging Tests
Use `npx playwright test --debug` to control and get a view of each test step.

You can also run `npx playwright test --headed` to view the tests being executed on the browser.


## TODO
- Add option for backwpup free plugin
- Create helper function to read debug.log content
- Automatically delete backup before and after tests.