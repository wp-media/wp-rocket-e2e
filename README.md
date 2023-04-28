# Welcome to WP Rocket E2E Tests Repo
E2E tests here are written with Playwright. Without further ado, let's meet below below ⤵️

## Requirements
- Do you still not have node installed? You'll be needing it.
- Some tests don't come easy with just Playwright, so you need to install the [helper plugin](https://github.com/wp-media/wp-rocket-e2e-test-helper) on your test site. just download the zip from the repo.
- You also need zip files of WP Rocket, I'll explain:
  - zip for new release - **rename the zip file name to `new_release.zip`. e.g `wp-rocket_3.13.1.zip` becomes `new_release.zip`**
  - zip for previous stable release - **rename the zip file name to `previous_stable`. e.g `wp-rocket_3.13.0.2.zip becomes `previous_stable.zip`**
  - zip for 3.10.9 - **leave this as `wp-rocket_3.10.9.zip`**
  - Make sure to put these files in the `./plugin` folder in the root - Playwright will pick these files when needed and use them during tests.
  
  **NB:** Files like the new release and previous stable release are not constant so make sure to always update as your tests fit.
  
 ## Installation
 - Clone this repo
 - run a `npm install` to install dependencies, well for this case it's just playwright.
 - Additionaly, in some cases on a fresh install you might also need to run `npx playwright install` to download the various browser engines as well.
 
 ## Configuration
 You'll need to update the site you want to run tests on as well as the credentials.
 
 Update the `wp.config.sample.ts` to `wp.config.ts` in https://github.com/wp-media/wp-rocket-e2e/blob/trunk/config/
 
 Change the `live_username` & `live_password` & `WP_BASE_URL` to that of your test site.
 
 You can find this [here](https://github.com/wp-media/wp-rocket-e2e/blob/trunk/config/wp.config.sample.ts)
 
 ## Running Tests
 - Please delete the debug.log from your test site before running tests, We will automate this step in the future.
 - Don't forget to install the [helper plugin](https://github.com/wp-media/wp-rocket-e2e-test-helper)
 - To run tests on playwright, simply run `npx playwright test` or `npm run test:e2e` which ever you prefer.
 
 **NB:** By default, test will run in headless mode.
 
 ## Debugging Tests
 Use `npx playwright test --debug` to control and get a view of each test step.
 
 You can also run `npx playwright test --headed` to view the tests being executed on the browser.
 
 ## Reporting
 At the end of a failed test cycle, playwright will launch a temporary server and open reports with videos and screenshot of failed tests.
 
If you ever get failed tests like the one below, it indicates that WP Rocket has some related errors in debug.log
![Screenshot 2023-04-27 at 09 55 37](https://user-images.githubusercontent.com/38788055/234812244-c1cd0c87-702a-49a9-baf6-0fab7afd2cd0.png)

