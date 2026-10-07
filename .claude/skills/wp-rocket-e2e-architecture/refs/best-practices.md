# E2E Test Best Practices — References

Reference list for any agent writing or changing e2e test cases (`test-developer`,
`grooming-agent` when it specs a test, and `lead-reviewer` when it reviews one). Read the
entries that match the task before writing or reviewing code. This list is meant to grow: add a link plus one line on when to use it.

Repo rules in `.claude/skills/wp-rocket-e2e-architecture/SKILL.md` and `AGENTS.md` take
precedence when they conflict with an external guide.

## External

- **Playwright best practices** — https://playwright.dev/docs/best-practices
  Use for locator choice, web-first assertions, test isolation and debugging. Applied to this
  repo:
  - Test user-visible behavior, not implementation details.
  - Prefer `getByRole()` / `getByText()` / `getByLabel()` and chained or filtered locators
    over long CSS/XPath; shared selectors still go in `src/common/selectors.ts`.
  - Use web-first assertions (`await expect(locator).toBeVisible()`), not
    `expect(await locator.isVisible()).toBe(true)`.
  - Isolation: Playwright gives each scenario a fresh browser context, but the WordPress site
    is shared. Each scenario must set up what it needs and clean up what it changed (see
    "Cleanup" in the architecture skill).
  - Don't test third-party services you don't control; only the WP Rocket / BackWPup
    behavior under test.
  - Await every Playwright call (no floating promises).

## In this repo

Copilot agent guides in `.github/agents/` hold domain-specific patterns. Read the matching
one; don't copy it.

| Task | Guide |
|---|---|
| WP Rocket feature tests (settings sections, enable/disable, persistence, upgrade, export/import, delay JS, LCP, CPCSS, fonts) | `.github/agents/wp-rocket-tester.agent.md` |
| BackWPup tests (`@bwpup*`) | `.github/agents/backwpup-tester.agent.md` |
| Visual regression (`@vr`, BackstopJS) | `.github/agents/visual-regression-specialist.agent.md` |
| SSH / WP-CLI / remote server operations | `.github/agents/ssh-remote-specialist.agent.md` |
| Writing a new Gherkin feature + steps | `.github/agents/feature-test-creator.agent.md` |
| Legacy Playwright specs (`src/specs/**`) | `.github/agents/spec-test-developer.agent.md` |

General repo guide (tags, npm scripts, helpers, config keys): `.github/copilot-instructions.md`.
