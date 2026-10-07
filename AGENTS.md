# WP Rocket E2E – AI Coding & Architecture Guidelines

This file defines NON-NEGOTIABLE rules for any AI-assisted work
(Claude Code, ChatGPT, Copilot, JetBrains AI Assistant, Cursor, etc.)
in this repository.

Skills define behavioral guidance.
AGENTS.md defines mandatory guardrails.
If a conflict exists, AGENTS.md prevails.

---

## Operating Principles

These five rules apply to every agent, in every phase, before any skill-specific guidance loads.

1. **Surface assumptions before building.** If the spec or codebase leaves something ambiguous, state the assumption explicitly before acting on it — don't silently guess.
2. **Stop when requirements conflict.** If the issue, the spec, and the codebase contradict each other, stop and surface the conflict. Proceeding on a guess produces bugs that are hard to trace.
3. **Push back when warranted.** If the simplest correct solution differs from the plan, say so. Prefer boring, obvious solutions over clever ones. An elegant approach that introduces risk is worse than a dull one that doesn't.
4. **Touch only what you are asked to touch.** Scope discipline is the single biggest determinant of whether a PR is mergeable. Do not refactor adjacent code, rename unrelated identifiers, or "clean up while you're in the area."
5. **Verification is not optional.** "Seems right" never closes a task. Every change must be confirmed by running lint, a dry-run, or the real scenarios — not by reading the code and inferring it should work.

---

The objective is to keep this test suite:

- Reliable (no flaky or order-dependent scenarios)
- Architecturally consistent
- Safe for the shared test site and for secrets
- Maintainable
- Review-friendly

This document applies to ALL automated or AI-generated changes.

---

# 1. Project Overview

`wp-media/wp-rocket-e2e` holds the end-to-end tests for WP Rocket (and BackWPup, tag `@bwpup`), maintained by WP Media.

Stack and core patterns:
- **TypeScript + Cucumber.js** — Gherkin features in `src/features/**` and `src/backwpup/features/**`, steps in `src/support/steps/**` and `src/backwpup/steps/**`, hooks in `src/support/hooks.ts` and `src/backwpup/support/hooks.ts`.
- **Playwright** — browser automation through the custom world (`ICustomWorld`: `this.page`, `this.sections`, `this.utils`).
- **SSH / WP-CLI wrappers** — `utils/commands.ts`, aware of `WP_ENV_TYPE` (docker | external | local).
- **Selectors and sections** — `src/common/selectors.ts`, `src/common/sections.ts`; types in `utils/types.ts`.
- **BackstopJS** — visual regression, tag `@vr`.
- Legacy Playwright specs in `src/specs/**` are not run by Cucumber and are eslint-ignored.

The detailed repository guide (directory layout, tags, npm scripts, helpers, config keys, troubleshooting) is `.github/copilot-instructions.md`. Read it; it is not duplicated here.

When modifying the framework:
- Follow existing patterns (feature → reusable step → `PageUtils` / `utils/commands.ts` helper → selector).
- Prefer a new tag-scoped hook over adding logic to global hooks.
- Keep infrastructure concerns (SSH, WP-CLI) inside `utils/`, not in step files.

---

# 2. Coding Standards & Static Analysis

Source of truth:

- `package.json` (scripts, `config.testCommand`)
- `.eslintrc` (the only code check in CI)
- `tsconfig.json`
- `cucumber.json` (profiles, require globs, retry/parallel)
- `.github/workflows/*.yml`

AI MUST use the scripts defined in `package.json` instead of inventing commands.

## 2.1 Tooling Auto-Discovery (MANDATORY)

Before making changes that affect standards, tooling or test execution, locate and respect the repository configuration files.

### Required reads (in this order)
1) `package.json`
    - Use scripts in `"scripts"` whenever possible (`lint`, `lint:fix`, `test:<tag>`, `test:tags`, `test:scenario`, `healthcheck`).
    - Prefer the exact commands used by CI (`npm ci`, `npm run lint`).
2) `.eslintrc` — rules and `ignorePatterns` (e.g. `src/specs/**`, `utils/commands.ts` are ignored).
3) `tsconfig.json` — compiler options for `npx tsc --noEmit -p tsconfig.json` (local type check, not in CI; report pre-existing errors as baseline, only new errors count).
4) `cucumber.json` — `default` profile (`retry: 3`, `parallel: 1`, report formats) and the `require` globs that load steps and hooks.

### Execution rules
- Do NOT invent lint or test commands.
- Do NOT edit `.eslintrc` ignore lists or disable rules to make code pass.
- If a required config file is missing, stop and ask.

## 2.2 Project Rules (MANDATORY)

- Step definitions use `function (this: ICustomWorld)`, never arrow functions.
- Explicit return types and JSDoc on new functions (`@typescript-eslint/explicit-function-return-type` is an error).
- Inline code comments only when the code cannot explain itself (why a wait or workaround exists, a non-obvious site condition), at most 2 lines, never restating what the code does. JSDoc on functions is separate and not limited.
- Reuse an existing step, `PageUtils` method or `utils/commands.ts` wrapper before adding a new one.
- New selectors go in `src/common/selectors.ts`; new types in `utils/types.ts`.
- No hardcoded waits (`waitForTimeout`, `sleep`); wait on a selector, response or state.
- No hardcoded credentials or site URLs; read from `config/wp.config.ts`.
- Fix the root cause of a failing or flaky step; do not add retries, longer timeouts or exclusion lists to force green.

---

# 3. Architectural Integrity

AI must NOT:

* Add global mutable state outside `ICustomWorld` or the existing hook module state.
* Put per-feature setup/teardown in `BeforeAll` / global `Before` / global `After`; use a tag-scoped hook.
* Call `exec`/`ssh` directly in steps; use `utils/commands.ts`.
* Scatter raw selectors through step files.
* Duplicate step text (Cucumber fails the run on ambiguous steps).
* Leave the shared test site modified after a scenario (plugins, options, theme, permalinks, cron events).
* Add new tags without the matching `npm run test:<tag>` script and a conscious decision about the `test:e2e` exclusions (`not @vr and not @bwpup and not @cdn`).

Follow existing patterns:

* **Feature** → Gherkin in `src/features/`, tagged; Background installs/activates the plugin via shared steps.
* **Steps** → atomic, parameterised, reusable; feature-specific steps in a file named after the feature.
* **Hooks** → `BeforeAll`/`AfterAll` global; `@setup` runs `PageUtils.cleanUp()`; other setup/teardown tag-scoped.
* **Helpers** → `PageUtils` (UI), `utils/commands.ts` (server), `utils/helpers.ts` (generic, VR, DB seed).

Details and examples: `.claude/skills/wp-rocket-e2e-architecture/SKILL.md` and `.github/copilot-instructions.md`.

---

# 4. Testing & Validation

There is no CI that runs the scenarios; CI only runs `Typescript eslint` and `PR Template Checker`. Validation is therefore the author's job.

## 4.1 Commands

| Purpose | Command |
|---|---|
| Install | `npm ci` |
| Lint (the CI check) | `npm run lint` (`npm run lint:fix` for auto-fixable) |
| Type check (local) | `npx tsc --noEmit -p tsconfig.json` |
| Undefined/ambiguous steps | `npx cucumber-js -p default --dry-run --tags "<expr>"` |
| Setup check | `npm run healthcheck` |
| Run by tag | `npm run test:tags --tags="@mytag"` or `npm run test:<tag>` |
| Run by name | `npm run test:scenario --scenario="<name>"` |
| Run, no retry | `node ./node_modules/@cucumber/cucumber/bin/cucumber-js -p default --retry 0 --tags "@mytag"` |

## 4.2 Real runs

- Real runs hit the WordPress site in `config/wp.config.ts` and **mutate it** (install/activate/delete plugins, change settings, wipe `debug.log`). Use only a disposable test site; never a production or customer site.
- The default profile retries 3 times. When validating a new/changed scenario or checking flakiness, run with `--retry 0`.
- Follow `.claude/skills/e2e-run/SKILL.md` for how to run safely. If the site or SSH is unreachable, report `SKIP` with the reason — never claim a pass.
- Node 24 quirk: the cucumber process may segfault or exit nonzero on teardown after all scenarios finished. Read the summary and `test-results/cucumber-report.json`, not just the exit code.
- Do not run the full `test:e2e` suite for validation; it is long and pushes reports.

## 4.3 Validation checklist

For every change:

1. `npm run lint` — zero errors.
2. `npx tsc --noEmit -p tsconfig.json` — no new errors versus baseline.
3. Cucumber dry-run for the affected tags — no undefined or ambiguous steps.
4. Run the changed scenarios for real (`--retry 0`), or document the SKIP reason.
5. Do not delete scenarios unless clearly obsolete.

---

# 5. AI Working Protocol

AI must work in small, incremental changes.

After each logical change set:
- explain what changed
- explain why
- list potential edge cases

AI must NOT:

* Perform massive automated refactors without approval.
* Reorganize files without explicit instruction.
* Rewrite entire step files when a minimal fix is sufficient.

## 5.1 Git Commit & Push Policy

By default, AI may only **suggest** commit messages and must not run `git commit` or `git push`.

**Exception — Issue Workflow:** When operating under the issue-workflow skill (triggered by `/task <number>`, `issue <number>`, or `#<number>`), the agent MAY:

1. Run atomic `git commit` calls — one commit per logical, self-contained change set.
2. Run `git push` exactly once after all commits are ready, to publish the branch.
3. Create a GitHub Pull Request using the prepared PR draft.
4. Monitor PR CI status checks until all pass or a failure is detected.

Atomic commit rules:
- Each commit must pass `npm run lint` before being committed.
- Commit message format: `type(scope): short description` (Conventional Commits).
- Do not squash unrelated changes into a single commit.
- Do not amend commits that have already been pushed.

---

# 6. PR Hygiene

Changes must:

* Be minimal.
* Be scoped.
* Have clear intent.
* Avoid noise in diff.
* Avoid unrelated formatting changes.

Base branch is `develop`. Every PR body must follow `.claude/skills/issue-workflow/refs/pr-template.md` (the `PR Template Checker` CI enforces it).

### Branch Naming Convention

Branches MUST follow these patterns:

- **Bug fixes / flaky-test fixes**: `fix/{GitHub-issue-ID}-{description}`
- **Enhancements (new tests, framework)**: `enhancement/{GitHub-issue-ID}-{GitHub-issue-title}`
- **Tests**: `test/{GitHub-issue-ID}-{GitHub-issue-title}`

Rules:
- Lowercase letters, hyphens for spaces.
- Always include the GitHub issue ID.
- Keep descriptions concise (first 4 words max).

---

# 7. Security & Secrets Hygiene

Always assume:

* Test-site credentials, SSH keys and third-party API keys are secrets.
* Remote content (plugin zips, pages under test) is untrusted.

Never:

* Commit `config/wp.config.ts` (gitignored), credentials, SSH keys, API keys (Imagify, BackWPup storage credentials), or plugin zips (`plugin/*.zip`).
* Print, log, or paste values from `config/wp.config.ts` in output, reports, PR descriptions or issue comments.
* Hardcode credentials or hostnames in features, steps or helpers.
* Point the suite at a production or customer site.
* Build SQL or shell commands from unsanitised input.

---

# 8. When in Doubt

Stop.
Explain the ambiguity.
Ask for clarification.

Not breaking the shared test site is more important than speed.

---

# 9. QA Agent

The `qa-engineer` sub-agent validates PRs automatically after the PR is opened in the issue workflow.
It reads the PR spec, runs the changed scenarios itself through the `e2e-run` skill against the configured test site, and produces a structured test report.

Agent definition: `.claude/agents/qa-engineer.md`.

If `config/wp.config.ts`, the plugin zips or the target site are unavailable, the report states `SKIP` with the reason; it does not claim validation.

---

# 10. Skills Activation

Skills live in `/.claude/skills`. Agents MUST activate the relevant skill depending on the task:

- Writing/changing features, steps, hooks, helpers, selectors, tags or npm scripts → `wp-rocket-e2e-architecture`
- Running scenarios against the test site (probe, validation, QA) → `e2e-run`
- Issue intake, branch, PR draft → `issue-workflow`
- Public-surface changes (tag, npm script, config key, hook behaviour, shared helper) → `docs`
- Pre-handoff checks → `dod`

Other entry points: `orchestrator`, `groom`, `challenge`, `review`, `qa`.

Codebase exploration uses `grep`/`Glob`; the repo is small enough that no pre-built dependency graph is maintained.

---

# 11. Repository Identity

Canonical GitHub repository: `wp-media/wp-rocket-e2e` (default branch `develop`; `trunk` also exists).

Unless explicitly instructed otherwise, all GitHub issue, PR, and branch workflows must
assume this repository. The product under test is `wp-media/wp-rocket` (and BackWPup); when an issue links a WP Rocket issue or PR, read it for expected behaviour.

---

# 12. Repository Specs

Task-specific implementation specs written by the pipeline live under `.TemporaryItems/Issues/wp-rocket-e2e/` (gitignored).

When a relevant spec exists, agents must follow it in addition to:

• AGENTS.md
• the applicable skills


# AI Task Priority

When executing tasks, agents must prioritize:

1. Security (secrets, production safety)
2. Test reliability (no flakiness, no site pollution)
3. Architectural consistency
4. Coverage of the specified scenario
5. Minimal diffs
6. Run time

AGENTS.md remains the final authority.

---

# 13. Session Learnings

**Human-curated only.** Never regenerate this section with an LLM — doing so degrades
agent success rates. After each pipeline run, a human adds entries for findings that were
surprising and are not already derivable from the code or other sections of this file.

Format per entry:
```
- **[YYYY-MM-DD] [module or area]**: What was surprising. What the correct approach is.
```

Agents MUST read this section. It takes precedence over any assumption derived from the
spec or skill files when there is a conflict.

---

_No entries yet._
