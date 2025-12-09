# WP Rocket E2E Testing Repository - Copilot Instructions

## Project Overview

This repository contains end-to-end (E2E) tests for WP Rocket, a WordPress performance optimization plugin. The test suite uses **Playwright** for browser automation and **Cucumber** for behavior-driven development (BDD) testing.

### Key Technologies
- **Playwright**: Browser automation framework
- **Cucumber.js**: BDD testing framework with Gherkin syntax
- **TypeScript**: Primary programming language
- **Node.js**: Runtime environment
- **BackstopJS**: Visual regression testing
- **SSH2/Node-SSH**: Remote server interactions

## Architecture & Structure

### Directory Organization

```
.
├── src/
│   ├── features/           # Cucumber feature files (*.feature)
│   ├── support/
│   │   ├── hooks.ts       # Cucumber hooks (Before/After/BeforeAll/AfterAll)
│   │   └── steps/         # Step definitions for features
│   ├── common/
│   │   ├── custom-world.ts    # Custom Cucumber World class
│   │   ├── sections.ts        # WP Rocket settings sections
│   │   └── selectors.ts       # Element selectors
│   ├── backwpup/          # BackWPup plugin specific tests
│   └── specs/             # Playwright spec files
├── utils/
│   ├── helpers.ts         # Utility functions
│   ├── page-utils.ts      # Page interaction utilities
│   ├── commands.ts        # WP-CLI and SSH commands
│   └── configurations.ts  # Server configuration management
├── config/
│   ├── wp.config.sample.ts    # WordPress configuration template
│   └── scenarioUrls.json      # URL configurations for scenarios
├── plugin/                # Plugin zip files directory
└── backstop_data/         # Visual regression test data
```

### Test Execution Patterns

1. **Feature-based tests**: Located in `src/features/*.feature` using Gherkin syntax
2. **Spec-based tests**: Located in `src/specs/**/*.spec.ts` using Playwright directly
3. **Visual regression tests**: Using BackstopJS with `@vr` tag

## Coding Standards & Best Practices

### TypeScript Guidelines

1. **Always use explicit types** for function parameters and return values
2. **Use interfaces and types** from `utils/types.ts` for consistency
3. **Document all functions** with JSDoc comments including:
   - Description
   - @param tags with types and descriptions
   - @return tags with Promise types where applicable
   - @requires tags for dependencies

Example:
```typescript
/**
 * Performs a Login action on WordPress.
 *
 * @param {string | null} user - Optional username for login
 * @return {Promise<void>}
 */
public wpAdminLogin = async (user: string | null = null): Promise<void> => {
    // Implementation
}
```

### Cucumber/Gherkin Standards

1. **Feature files** must use proper Gherkin syntax:
   ```gherkin
   @tag1 @tag2
   Feature: Feature name
     Background:
       Given preconditions
     
     Scenario: Scenario name
       When action
       Then assertion
   ```

2. **Step definitions** should:
   - Use `ICustomWorld` as context: `async function (this: ICustomWorld) {}`
   - Be atomic and reusable
   - Follow Given/When/Then pattern
   - Use descriptive step text

3. **Common tags**:
   - `@setup` - Tests requiring special setup/cleanup
   - `@vr` - Visual regression tests
   - `@smoke` - Smoke tests (critical path tests)
   - `@local` - Local environment only
   - `@online` - Online tests
   - `@test` - Test/development scenarios
   - `@long-test` - Long-running tests
   - `@export` - Settings export/import tests
   
   **Feature-specific tags:**
   - `@delayjs` - Delay JS feature tests
   - `@delaylcp` - Delay LCP (Largest Contentful Paint) tests
   - `@lcp` - LCP beacon tests
   - `@llcssbg` - Lazy load CSS background images tests
   - `@priorityelements` - Priority elements/performance hints tests
   - `@performancehints` - Performance hints feature tests
   - `@preloadfonts` - Preload fonts tests
   - `@selfhostgooglefonts` - Self-hosted Google fonts tests
   - `@cpcss` - Critical Path CSS tests
   - `@lrc` - Lazy Render Content tests
   - `@cdn` - CDN feature tests
   
   **BackWPup-specific tags:**
   - `@bwpup` - All BackWPup tests
   - `@bwpupsmoke` - BackWPup smoke tests
   - `@bwpupstorage` - BackWPup storage tests
   - `@bwpuponboarding` - BackWPup onboarding tests

### Playwright Patterns

1. **Use the custom world pattern**: Access page, context, sections, and utils through `this` in step definitions
   ```typescript
   async function (this: ICustomWorld) {
       await this.page.goto(url);
       await this.sections.set('cache').visit();
       await this.utils.wpAdminLogin();
   }
   ```

2. **Wait strategies**:
   - Prefer `waitForSelector()` over arbitrary timeouts
   - Use `waitForLoadState('load')` after navigation
   - Set appropriate timeouts: `{ timeout: 30000 }` for slow operations

3. **Element interaction**:
   - Use `page.locator()` for modern selectors
   - Use `page.getByRole()` for accessible queries
   - Always verify element visibility before interaction
   - Use `expect()` from Playwright for assertions

### WordPress-Specific Patterns

1. **Authentication**:
   - Use `PageUtils.wpAdminLogin()` for login
   - Use `PageUtils.wpAdminLogout()` for logout
   - Use `PageUtils.auth()` to ensure authentication

2. **Plugin operations**:
   - Use utility functions from `utils/commands.ts`:
     - `activatePlugin(slug)`
     - `deactivatePlugin(slug)`
     - `uninstallPlugin(slug)`
     - `isPluginActive(slug)`

3. **WP Rocket specific**:
   - Use `Sections` class for navigating WP Rocket settings
   - Use `PageUtils.gotoWpr()` to navigate to WP Rocket settings
   - Use `PageUtils.clearWPRCache()` to clear cache
   - Use `PageUtils.saveSettings()` to save settings
   - Use `PageUtils.disableAllOptions()` to disable all WP Rocket options
   - Use `PageUtils.enableAllOptions()` to enable all WP Rocket options
   - Use `PageUtils.importSettings(file)` to import settings from file
   - Use `PageUtils.removeWprViaUi()` to uninstall WP Rocket via UI
   
   **Available WP Rocket sections:**
   - `dashboard` - Dashboard section
   - `cache` - Cache settings
   - `fileOptimization` - File optimization (CSS/JS)
   - `media` - Media settings (lazy load, images, fonts)
   - `preload` - Preload settings
   - `advancedRules` - Advanced cache rules
   - `database` - Database optimization
   - `cdn` - CDN configuration
   - `heartbeat` - WordPress Heartbeat control
   - `addons` - Add-ons (Varnish, Cloudflare, WebP, etc.)

### SSH & Remote Operations

1. **Always test SSH connection** before operations:
   ```typescript
   await testSshConnection();
   ```

2. **File operations** should use functions from `utils/commands.ts`:
   - `exists(path)` - Check file existence
   - `readFile(path)` - Read file content
   - `rename(oldPath, newPath)` - Rename/move files
   - `rm(path)` - Remove files/directories

3. **Database operations**:
   - Use `dbQuery(sql)` for database queries
   - Always sanitize inputs
   - Use parameterized queries when possible

## Testing Workflow

### Hook Execution Order

1. **BeforeAll** (once before all scenarios):
   - Test SSH connection
   - Clean debug logs
   - Delete backstop test bitmaps
   - Activate template loader plugin if inactive
   - Launch Chromium browser

2. **Before** (before each scenario):
   - Create new browser context with video recording
   - Initialize page, sections, and utils
   - For `@setup` tagged scenarios: perform cleanup
   - For `@delaylcp` tagged scenarios: install/activate helper plugin
   - For `@vr` tagged scenarios: validate and set option labels

3. **After** (after each scenario):
   - Capture screenshot and video on failure
   - Check for WP Rocket errors in debug.log
   - Rename debug.log if errors found
   - Close page and context
   - For `@delaylcp`: uninstall helper plugin

4. **AfterAll** (once after all scenarios):
   - Close browser

### Test Execution Commands

```bash
# Run all E2E tests (excludes @vr, @delayjs, @bwpupsmoke)
npm run test:e2e

# Run with custom tag for reporting
npm run test:e2e --tag=wpr3.19.4_e2e_all_dev

# Run smoke tests
npm run test:smoke

# Environment-specific tests
npm run test:local         # Local environment only
npm run test:online        # Online tests

# Feature-specific tests
npm run test:delayjs       # Delay JS tests
npm run test:lcp           # LCP beacon tests
npm run test:llcssbg       # Lazy load CSS background images
npm run test:preloadfonts  # Preload fonts tests
npm run test:selfhostgooglefonts  # Self-hosted Google fonts
npm run test:priorityelements     # Priority elements
npm run test:performancehints     # Performance hints
npm run test:cpcss         # Critical Path CSS
npm run test:lrc           # Lazy Render Content
npm run test:cdn           # CDN feature tests
npm run test:export        # Settings export/import
npm run test:long-test     # Long-running tests
npm run test:test          # Test/development scenarios

# Visual regression tests
npm run test:vr --wproption=<optionName>
# Example: npm run test:vr --wproption=lazyloadCssBgImg

# BackWPup tests
npm run test:bwpupsmoke    # BackWPup smoke tests
npm run test:bwpupstorage  # BackWPup storage tests
npm run test:bwpuponboarding  # BackWPup onboarding
npm run test:bwpup         # All BackWPup tests

# Utilities
npm run healthcheck        # Verify test setup
npm run push-report        # Push reports to shared folder
```

## Configuration Management

### Environment Configuration

1. **wp.config.ts** (copy from wp.config.sample.ts):
   
   **WordPress credentials:**
   - `WP_BASE_URL` - Your test site URL (local or live)
   - `WP_USERNAME` / `WP_PASSWORD` - Primary admin credentials
   - `WP_USERNAME2` / `WP_PASSWORD2` - Secondary admin user (for multi-user tests)
   
   **Server configuration:**
   - `WP_ROOT_DIR` - WordPress installation directory
   - `WP_ENV_TYPE` - Server type: `docker`, `external`, or leave empty for local
   
   **Docker configuration (if using Docker):**
   - `WP_DOCKER_CONTAINER` - Container name
   - `WP_DOCKER_ROOT_DIR` - WordPress path inside container
   
   **SSH configuration (if using remote server):**
   - `WP_SSH_USERNAME` - SSH username
   - `WP_SSH_ADDRESS` - SSH host address
   - `WP_SSH_KEY` - Path to SSH private key
   - `WP_SSH_ROOT_DIR` - WordPress path on remote server
   
   **Imagify configuration (for Imagify tests):**
   - `IMAGIFY_INFOS.apiKey` - Imagify API key
   
   **BackWPup configuration (for BackWPup tests):**
   - `BACKWPUP_INFOS.msazure` - Azure storage credentials
   - `BACKWPUP_INFOS.sugarsync` - SugarSync credentials
   - `BACKWPUP_INFOS.ftp` - FTP server details (host, username, password, port, SSL, etc.)

2. **Environment variables**:
   - `npm_config_env=local` - Use local WordPress instance (switches to local credentials)
   - `PWDEBUG=1` - Enable Playwright debug mode (infinite timeout, inspector)
   - `npm_config_tag` - Custom tag for report naming (e.g., `wpr3.19.4_e2e_all_dev`)
   - `npm_config_wproption` - WP Rocket option name for visual regression tests

3. **Server types** (ServerType enum):
   - `docker` - Docker container (uses docker-compose exec)
   - `external` - Remote SSH server (uses SSH commands)
   - Default: local filesystem (direct file access)

## Special Considerations

### Plugin Files

The `plugin/` directory must contain:
- `new_release.zip` - Latest WP Rocket version
- `previous_stable.zip` - Previous stable version
- `wp-rocket_3.10.9.zip` - Specific version for upgrade tests
- Helper plugin: [wp-rocket-e2e-test-helper](https://github.com/wp-media/wp-rocket-e2e-test-helper)

### Visual Regression Testing

1. **BackstopJS configuration** in `backstop.json`:
   - Engine: Puppeteer
   - Default viewport: 1920x1080 (desktop)
   - Mobile viewport: 500x480 (when specified in scenario)
   - Timeouts: 30000ms for ready and goto
   - Headless: false (runs with browser visible)
   - Engine scripts location: `backstop_data/engine_scripts/`
     - `scrollToBottom.js` - Scrolls page to bottom
     - `disableJavascript.js` - Disables JavaScript
     - `wait.js` - Waits for page load
     - `mobileMenuThemeSwitch.js` - Switches mobile menu theme

2. **Reference creation**: Use `createReference(url)` to capture baseline
   - Creates reference snapshot with `?nowprocket` query string (unoptimized)
   - Stores in `backstop_data/bitmaps_reference/`

3. **Comparison**: Use `compareReference(label)` to test against baseline
   - Compares current state against reference
   - Generates HTML report in `backstop_data/html_report/`
   - Mismatch threshold: 0.1 (configurable per scenario)

4. **Batch updates**: Use `batchUpdateVRTestUrl(config)` for multiple scenarios
   - Supports multiple URLs with different configurations
   - Can disable JavaScript per scenario
   - Can specify mobile viewport per scenario
   - Configuration structure:
     ```typescript
     {
       optimize: boolean,  // true = with WP Rocket, false = ?nowprocket
       urls: {
         [key: string]: {
           path?: string,        // URL path
           disableJs?: boolean,  // Disable JavaScript
           mobile?: boolean      // Use mobile viewport
         }
       }
     }
     ```

5. **Scenario URLs**: Defined in `config/scenarioUrls.json`
   - Pre-configured URL sets for common test scenarios
   - Used by `getScenarioTag()` helper to match tags to URL configs

### Error Handling

1. **WP Rocket errors**: Automatically detected in debug.log via `isWprRelatedError()`
2. **Screenshots**: Auto-captured on test failure
3. **Videos**: Auto-recorded for all scenarios, attached to failed tests
4. **Debug logs**: Renamed with scenario name when errors found

### Template Loader Plugin

The **template-loader-plugin-master** must be active before running tests to avoid false positives. The framework automatically checks and activates it in BeforeAll hook.

## Code Quality Rules (Codacy Integration)

### CRITICAL: After ANY file edit
- **MUST** immediately run `codacy_cli_analyze` tool for edited files
- If issues found, propose and apply fixes
- Never skip this step - it's a critical error

### After dependency changes
- Run `codacy_cli_analyze` with tool="trivy" for security checks
- Fix vulnerabilities before continuing

### General rules
- Focus on complexity issues, not metrics
- Don't analyze for duplicated code or coverage
- Use workspace path as rootPath (non-URL-encoded)

## Common Patterns & Utilities

### Page Navigation
```typescript
await this.utils.visitPage('wp-admin/options-general.php?page=wprocket');
await this.utils.gotoWpr();
await this.utils.gotoPlugin();
```

### Settings Management
```typescript
await this.sections.set('media').visit();
await this.sections.toggle('lazyloadCssBgImg');
await this.sections.fill('cnames', 'cdn.example.com');
await this.utils.saveSettings();
```

### Cache Management
```typescript
await this.utils.clearWPRCache();
```

### Assertions
```typescript
import { expect } from '@playwright/test';
await expect(this.page.getByText('Settings saved.')).toBeVisible();
await expect(element).toHaveValue('expected-value');
```

### Database Operations
```typescript
// Seed data into database tables
await seedData(['table1', 'table2'], [
    { column1: 'value1', column2: 123 },
    { column1: 'value2', column2: 456 }
]);

// Check data exists (true) or removed (false)
await checkData(['table1'], data, true);  // Check exists
await checkData(['table1'], data, false); // Check removed

// Execute raw SQL query
const result = await dbQuery('SELECT * FROM wp_options WHERE option_name = "rocket_settings"');

// Extract and parse query results
const rows = await extractFromStdout(result);
```

### LCP and Viewport Checking
```typescript
// Check that LCP/ATF images are not lazy-loaded
const { isValid, errorMessages } = await checkLcpOrViewport(
    images,           // LLImagesData object
    'LCP',           // Type: 'LCP' or 'viewport'
    'lcp_image',     // Key to check
    ['image.jpg']    // Image URLs to verify
);
```

### Cucumber Tag Utilities
```typescript
// Check if tag is present in current scenario
const hasTag = await isTagPresent(pickle, '@smoke');

// Get matching scenario tag for VR tests
const scenarioTag = await getScenarioTag(['@llcssbg', '@delayjs']);
```

### Page Scrolling
```typescript
// Scroll to bottom of page with controlled intervals
await this.utils.scrollDownBottomOfAPage();
```

## Writing New Tests

### Adding a New Feature Test

1. Create feature file in `src/features/`:
   ```gherkin
   @mytag @setup
   Feature: My Feature
     Background:
       Given I am logged in
       And plugin is installed 'new_release'
       And plugin is activated
   
     Scenario: My scenario
       When I perform action
       Then I see result
   ```

2. Create step definitions in `src/support/steps/`:
   ```typescript
   import { ICustomWorld } from "../../common/custom-world";
   import { When, Then } from '@cucumber/cucumber';
   
   When('I perform action', async function (this: ICustomWorld) {
       await this.page.click('#element');
   });
   
   Then('I see result', async function (this: ICustomWorld) {
       await expect(this.page.getByText('Result')).toBeVisible();
   });
   ```

3. Add selectors if needed in `src/common/selectors.ts`

4. Run with: `npm run test:e2e --tags @mytag`

### Adding a New Spec Test

1. Create spec file in `src/specs/`:
   ```typescript
   import { test, expect } from '@playwright/test';
   
   test('my test', async ({ page }) => {
       await page.goto('url');
       await expect(page.getByText('text')).toBeVisible();
   });
   ```

## Debugging

1. **Headed mode**: Tests run with `headless: false` by default
2. **Debug mode**: Set `PWDEBUG=1` for inspector and unlimited timeout
3. **Screenshots**: Automatically saved to `test-results/screenshots/`
4. **Videos**: Automatically saved to `test-results/videos/`
5. **Reports**: 
   - Cucumber HTML report: `test-results/cucumber-report.html`
   - Cucumber JSON report: `test-results/cucumber-report.json`
   - Multiple Cucumber HTML Reporter: Generated after test completion
   - Open report: `npm run open-report` (opens Cucumber HTML report in browser)
6. **Health check**: Run `npm run healthcheck` to verify setup
7. **Rerun failed tests**: Failed scenarios are saved to `@rerun.txt`
   - Rerun configuration available in `cucumber.json` profile

## Troubleshooting

### Common Issues

**SSH Connection Failures:**
- Verify SSH credentials in `wp.config.ts`
- Check SSH key path and permissions (`chmod 600 ~/.ssh/id_rsa`)
- Test connection manually: `ssh user@host -i /path/to/key`
- Ensure `testSshConnection()` passes in BeforeAll hook

**Plugin Installation Errors:**
- Verify plugin zip files exist in `plugin/` directory:
  - `new_release.zip` (latest WP Rocket)
  - `previous_stable.zip` (previous stable)
  - `wp-rocket_3.10.9.zip` (for upgrade tests)
  - Helper plugin zip (from GitHub)
- Check file permissions and naming
- Ensure plugin activation via `activatePlugin(slug)` succeeds

**Template Loader Plugin Issues:**
- The `template-loader-plugin-master` must be active
- Framework auto-activates in BeforeAll hook
- Manual check: `isPluginActive('template-loader-plugin-master')`
- Deactivation causes false positives in tests

**Debug Log Errors:**
- WP Rocket errors auto-detected via `isWprRelatedError()`
- Debug logs renamed to `debug-{scenario-name}.log` when errors found
- Location: `wp-content/debug.log` (or renamed version)
- Clean logs before tests in BeforeAll hook

**Browser Launch Issues:**
- Run `npx playwright install` to install browsers
- Check Playwright version compatibility
- Verify system dependencies (Linux may need additional packages)
- Try headless mode if headed fails: modify `hooks.ts` browser launch

**Video Recording Problems:**
- Videos saved to `test-results/videos/`
- Attached to Cucumber report on failure
- Check disk space if videos fail to save
- Video path available via `page.video().path()`

**Configuration Issues:**
- Ensure `wp.config.ts` exists (copy from `wp.config.sample.ts`)
- Verify all required environment variables are set
- Check server type matches actual environment
- For local: set `npm_config_env=local`

**Permalink Structure:**
- Tests may require specific permalink structure
- Use `updatePermalinkStructure('/%postname%/')` to reset
- Check via `PageUtils.permalinkChanged(structure)`

**Database Query Failures:**
- Sanitize all SQL inputs
- Use `dbQuery()` wrapper instead of raw queries
- Check database credentials in server configuration
- Verify table prefixes match (usually `wp_`)

**BackstopJS Visual Regression:**
- Ensure reference images exist before comparison
- Create references first: `createReference(url)`
- Check mismatch threshold (default 0.1)
- Clear test bitmaps: `deleteFolder('./backstop_data/bitmaps_test')`
- Report location: `backstop_data/html_report/`

**Timeout Errors:**
- Default timeout: 60 seconds (60000ms)
- Increase for slow operations: `{ timeout: 120000 }`
- Check waitForLoadState usage after navigation
- Debug mode has infinite timeout (PWDEBUG=1)

**Multi-User Tests:**
- Configure both `WP_USERNAME`/`WP_PASSWORD` and `WP_USERNAME2`/`WP_PASSWORD2`
- Pass user parameter: `wpAdminLogin('admin2')`
- Ensure secondary user exists in WordPress

## Important Notes

- **Never hardcode credentials** - use configuration files
- **Always clean up** after tests (use `@setup` tag or `cleanUp()` utility)
- **Respect retries**: Default retry is 3 attempts (cucumber.json)
- **Parallel execution**: Default parallel=1 (cucumber.json) - can be increased for speed but may cause conflicts
- **Timeout management**: Default 60 seconds (60000ms), infinite in debug mode (PWDEBUG=1)
- **Browser state**: Each scenario gets fresh context, shared browser instance
- **SSH vs Docker vs Local**: Configuration determines execution environment
- **Debug logs**: Always check `wp-content/debug.log` for WP Rocket errors
- **Template loader plugin**: Must remain active to avoid false positives
- **Video recording**: All scenarios record video, attached to reports on failure
- **Report sharing**: Use `--tag` parameter to organize reports in shared folder
- **BackWPup cleanup**: Manually delete backups after BackWPup tests (will be automated)
- **Step definitions**: Use `ICustomWorld` context, avoid arrow functions for `this` binding
- **Selectors**: Always add new selectors to `src/common/selectors.ts`
- **Types**: Import types from `utils/types.ts` for consistency
- **WP-CLI commands**: Use wrappers from `utils/commands.ts`, not direct exec
- **File operations**: Use SSH-aware helpers for Docker/remote environments
- **Performance hints**: Some tests seed database with performance data
- **Rerun capability**: Failed scenarios saved to `@rerun.txt` for quick reruns

## Resources

- [WP Rocket E2E Test Helper Plugin](https://github.com/wp-media/wp-rocket-e2e-test-helper)
- [Playwright Documentation](https://playwright.dev/)
- [Cucumber.js Documentation](https://cucumber.io/docs/cucumber/)
- [BackstopJS Documentation](https://github.com/garris/BackstopJS)
- [BackWPup Tests Documentation](src/backwpup/README.md)

## Repository Information

- **Owner**: wp-media
- **Repository**: wp-rocket-e2e
- **Default branch**: develop
- **License**: ISC
