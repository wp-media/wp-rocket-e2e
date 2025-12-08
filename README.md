# Welcome to WP Rocket E2E Tests Repo
E2E tests here are written with Playwright. Without further ado, let's meet below below ⤵️

## Requirements
- Do you still not have node installed? You'll be needing it.
- Some tests don't come easy with just Playwright, so you need to install the [helper plugin](https://github.com/wp-media/wp-rocket-e2e-test-helper) on your test site. just download the zip from the repo.
- **WP Rocket plugin versions are now automatically managed!** 🎉
  - Configure which versions to use in `config/plugin.config.ts`
  - The test suite will automatically download/build the required versions
  - Manual setup is no longer required unless you want to customize versions
  
  **Optional manual management:**
  - `npm run plugin:setup` - Download/build all configured versions
  - `npm run plugin:list` - List all plugin files and their status
  - `npm run plugin:clean` - Remove all plugin files
  - `npm run plugin:validate` - Check if all required files exist
  - `npm run plugin:setup -- --force` - Force rebuild even if files exist
  
 ## Installation
 - Clone this repo
 - run a `npm install` to install dependencies, well for this case it's just playwright.
 - Additionaly, in some cases on a fresh install you might also need to run `npx playwright install` to download the various browser engines as well.
 
 ## Configuration
 You'll need to update the site you want to run tests on as well as the credentials.
 
 Update the `wp.config.sample.ts` to `wp.config.ts` in https://github.com/wp-media/wp-rocket-e2e/blob/trunk/config/
 
 Change the `live_username` & `live_password` & `WP_BASE_URL` to that of your test site.
 
 You can find this [here](https://github.com/wp-media/wp-rocket-e2e/blob/trunk/config/wp.config.sample.ts)
 
 ### Plugin Version Configuration
 
 Copy `config/plugin.config.sample.ts` to `config/plugin.config.ts` and configure which WP Rocket versions to use for testing. See the sample file for detailed examples and configuration options.
 
 #### CLI Version Overrides
 
 You can override plugin versions directly from the command line without modifying the config file! This is useful for quick testing with different versions:
 
 **Override single version:**
 ```bash
 # Test with a specific previous_stable version
 npm run test:e2e -- --previous-stable=3.16.0
 
 # Test with a development branch
 npm run test:e2e -- --new-release=branch:develop
 
 # Test with a specific tag
 npm run test:e2e -- --new-release=tag:3.16.1
 ```
 
 **Override multiple versions:**
 ```bash
 # Override both previous_stable and new_release
 npm run test:e2e -- --previous-stable=3.16.0 --new-release=3.16.1
 
 # Mix version numbers with branches
 npm run test:smoke -- --previous-stable=3.16.0 --new-release=branch:develop
 ```
 
 **Using environment variables:**
 ```bash
 # Set versions via environment variables
 PREVIOUS_STABLE=3.16.0 NEW_RELEASE=3.16.1 npm run test:e2e
 
 # Or export them for multiple test runs
 export PREVIOUS_STABLE=3.16.0
 export NEW_RELEASE=branch:develop
 npm run test:e2e
 npm run test:smoke
 ```
 
 **Supported version formats:**
 - Version number: `3.16.0` (downloads from GitHub release tags - requires GITHUB_TOKEN)
 - GitHub branch: `branch:develop` or `branch:release/3.16.0` (clones and builds from source)
 - GitHub tag: `tag:3.16.0` (clones and builds from tag)
 - Direct URL: `https://example.com/wp-rocket.zip`
 
 **Available override options:**
 - `--previous-stable` - Override the previous stable release version
 - `--new-release` - Override the new release version being tested
 
 **Examples for common scenarios:**
 ```bash
 # Test upgrade from 3.16.0 to latest develop branch
 npm run test:e2e -- --previous-stable=3.16.0 --new-release=branch:develop
 
 # Quick smoke test with specific versions
 npm run test:smoke -- --new-release=3.16.2
 
 # Visual regression with beta version
 npm run test:vr -- --new-release=tag:3.16.2-beta5 --wproption=lazyloadCssBgImg
 
 # Test with locally downloaded zip file
 npm run test:e2e -- --new-release=https://your-server.com/custom-build.zip
 ```
 
 The CLI overrides will automatically trigger a download/build of the specified versions if they're not already in your `plugin/` directory.
 
 ## Running Tests
 - Don't forget to install the [helper plugin](https://github.com/wp-media/wp-rocket-e2e-test-helper)
 - To run tests on playwright, simply run `npx playwright test` or `npm run test:e2e` which ever you prefer.
- To run Visual regression with certain feature run 
`npm run test:vr --wproption=lazyloadCssBgImg` This means to run visual regression for the pages defined for this feature LLCSSBG after enabling it
 
 ## Debugging Tests
 Use `npx playwright test --debug` to control and get a view of each test step.
 
 You can also run `npx playwright test --headed` to view the tests being executed on the browser.
 
 ## Reporting
 - In order to have report at the shared folder /var/shared/rocket-e2e-reports on remote e2e server, we can run this "WPRversion_e2e_testType_branch"
 `npm run test:e2e --tag=wpr3.19.4_e2e_all_dev` This means the test ran using WPR version 3.19.4 and e2e develop branch to run all tests

 - At the end of a failed test cycle, playwright will launch a temporary server and open reports with videos and screenshot of failed tests.
 
If you ever get failed tests like the one below, it indicates that WP Rocket has some related errors in debug.log
![Screenshot 2023-04-27 at 09 55 37](https://user-images.githubusercontent.com/38788055/234812244-c1cd0c87-702a-49a9-baf6-0fab7afd2cd0.png)

### BackWpUp Doc
- [BackWpUp Documentation](src/backwpup/README.md)