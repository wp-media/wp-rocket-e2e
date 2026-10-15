---
name: wp-rocket-e2e-architecture
description: Use this skill when writing or changing anything in wp-rocket-e2e — Gherkin features, step definitions, Cucumber hooks, the custom world, selectors, sections, WP-CLI/SSH helpers, tags, npm scripts, or when opening a pull request. Enforces the repo's test architecture and guardrails.
---

# WP Rocket E2E Architecture Integrity

Keep tests consistent with the framework's structure. The detailed guide (tag list, npm scripts, helper catalogue, config keys) is `.github/copilot-instructions.md` — read it, do not duplicate it here.

Best-practice references for writing test cases (Playwright best practices, and the `.github/agents/` domain guides for each test area) are in `refs/best-practices.md` next to this file.

## Layout

| Concern | Location |
|---|---|
| Features | `src/features/**`, `src/backwpup/features/**` |
| Steps | `src/support/steps/**`, `src/backwpup/steps/**` |
| Hooks | `src/support/hooks.ts`, `src/backwpup/support/hooks.ts` |
| Custom world | `src/common/custom-world.ts` (`ICustomWorld`) |
| Selectors / sections | `src/common/selectors.ts`, `src/common/sections.ts` |
| Page helpers | `utils/page-utils.ts` (`PageUtils`) |
| WP-CLI / SSH wrappers | `utils/commands.ts` |
| Generic helpers (VR, DB seed, tags, debug.log checks) | `utils/helpers.ts` |
| Types | `utils/types.ts` |
| Config | `config/wp.config.ts` (gitignored, from `wp.config.sample.ts`), `config/scenarioUrls.json` |
| Legacy Playwright specs | `src/specs/**` (eslint-ignored, not run by Cucumber — do not add new tests here) |

Cucumber loads steps and hooks through the `require` globs in `cucumber.json`. A new directory of steps or hooks must be added there.

## Custom world

- Every step is `async function (this: ICustomWorld) { ... }` — never an arrow function, `this` would be lost.
- Use `this.page`, `this.context`, `this.sections`, `this.utils` (all created in the `Before` hooks). `this.pickle`, `this.wprSection`, `this.wprOption` and `this.activatedPlugin` carry scenario state.
- Share state between steps through new optional properties on `ICustomWorld`, not module-level variables.

## Hooks and tag-scoped hooks

- `BeforeAll` (SSH check, plugin builds, log cleanup, template-loader plugin, browser launch) and `AfterAll` are global — do not add per-feature logic there.
- `Before({tags: 'not @setup'})` and `Before({tags: '@setup'})` create the context/page; `@setup` additionally calls `this.utils.cleanUp()`.
- Per-feature setup/teardown belongs in a tag-scoped hook (`Before({tags: '@x'})` / `After({tags: '@x'})`), as `@delaylcp`, `@qm`, `@imagify-compatibility`, `@cloudflare-compatibility`, `@plugin-compatibility` and `@renewal or @promo` already do. Teardown hooks must tolerate a half-finished scenario (check installed/active before removing, log and continue on cleanup errors).
- The global `After` hook checks `debug.log` on the site via `isWprRelatedError()` — a scenario that triggers PHP errors on the site will leave a renamed `debug-<scenario>.log`.

## Step reuse

- Search before writing: `grep -rn "Given('\|When('\|Then('" src/support/steps src/backwpup/steps`. Common ones live in `src/support/steps/general.ts` (`I am logged in`, `plugin is installed {string}`, `plugin is activated`, `I save settings {string} {string}`, `clear wpr cache`, ...).
- Cucumber fails the whole run on duplicate or ambiguous step text. Check with `npx cucumber-js -p default --dry-run --tags "<expr>"`.
- Steps are atomic and parameterised (`{string}`, `{word}`); feature-specific steps go in a file named after the feature.

## Selectors and sections

- Element selectors live in `src/common/selectors.ts` under their settings section; do not scatter raw CSS/XPath strings through steps.
- WP Rocket settings navigation and option handling go through `this.sections.set('<section>').visit()`, `.toggle('<optionId>')`, `.fill(...)`; save with `this.utils.saveSettings()`. Section names come from `Section` in `utils/types.ts`.
- Prefer `page.locator()` / `getByRole()` and Playwright `expect()` assertions.

## WP-CLI / SSH wrappers

- Server-side actions (plugins, themes, options, transients, DB, files) go through `utils/commands.ts` (`activatePlugin`, `deactivatePlugin`, `uninstallPlugin`, `forceUninstallPlugin`, `isPluginInstalled`, `isPluginActive`, `installLocalPlugin`, `installRemotePlugin`, `setOption`, `deleteOption`, `setTransient`, `dbQuery`, `exists`, `readFile`, `rm`, `rmFiles`, `rename`, `wpWithOutput`, ...). They are SSH/Docker/local aware via `WP_ENV_TYPE`. Never call `exec`/`ssh` directly in steps.
- `utils/commands.ts` is eslint-ignored; new code in it should still be typed and documented.
- Validate SQL inputs; use `dbQuery()` or `seedData()`/`checkData()` from `utils/helpers.ts`.

## Cleanup

- Scenarios mutate a shared site. Leave it as found: uninstall helper/compat plugins, restore options, reset permalink/theme changes you made.
- Reuse `@setup` (runs `PageUtils.cleanUp()`) for tests that install/remove WP Rocket; otherwise add a tag-scoped `After` hook.
- BackWPup scenarios: the `@bwpup or @bwpupsetup` `After` hook deletes data; storage-specific cleanup uses its own tag hook.

## Tags, npm scripts and `test:e2e` exclusions

- Each feature tag has a matching `npm run test:<tag>` script in `package.json` (`"$npm_package_config_testCommand --tags @<tag>"`). Adding a tag means adding the script and listing the tag in `.github/copilot-instructions.md`.
- `test:e2e` runs `--tags "not @vr and not @bwpup and not @cdn"`. Decide deliberately whether a new tag must be excluded there (visual regression, BackWPup and CDN suites are run separately). Do not exclude tags just to hide a failing scenario.
- Ad-hoc runs: `npm run test:tags --tags="@x"` or `npm run test:scenario --scenario="<name>"`.
- The default Cucumber profile has `retry: 3` and `parallel: 1`. Do not raise parallelism (scenarios share one site), and validate new scenarios with `--retry 0`.

## No hardcoded waits

- No `page.waitForTimeout()` / `sleep()` as synchronisation. Wait on `waitForSelector`/locator state, `waitForLoadState`, `waitForResponse`, or poll a condition with a bounded timeout. Fix flakiness at its cause (the missing signal), not with a longer sleep.

## Structural guardrails

Avoid:
- Reading credentials or site URLs from anywhere but `config/wp.config.ts`; never hardcode or print them.
- Duplicating a helper that exists in `PageUtils`, `utils/commands.ts` or `utils/helpers.ts`.
- Business-specific setup in global hooks or in `PageUtils` when a tag-scoped hook fits.
- Adding exclusion lists, longer timeouts or extra retries to force green — fix the broken step.
- Committing `config/wp.config.ts`, `plugin/*.zip`, `test-results/`, `@rerun.txt`.

## Git Operations

Follow the policy defined in AGENTS.md §5.1. Outside the issue workflow, do not run `git commit` or `git push`.

## Pull request descriptions

Every PR body must follow `.claude/skills/issue-workflow/refs/pr-template.md` with its section headings copied exactly, including "What was tested" and "Mandatory Checklist". This applies outside the issue workflow too. The `PR Template Checker` CI (`wp-media/pr-checklist-action`) fails otherwise. The only other required PR check is `Typescript eslint` (`npm run lint`).
