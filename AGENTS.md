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

## Project Configuration

Read by the GAS delivery pipeline (`gas-delivery-pipeline-templates`) agents and skills.

This repo is a Cucumber/Playwright suite, not a WordPress plugin: there is no `gas-wordpress-engineering` configuration and no app to boot. Real runs target the WordPress site in `config/wp.config.ts` (see §4.2 and §9).

**Commands:**

| Setting | Value | Used by |
|---|---|---|
| Test command | Real runs are targeted by default. New or changed scenarios: `node ./node_modules/@cucumber/cucumber/bin/cucumber-js -p default --retry 0 --tags "<expr>"`. Full suite (only when shared code changes or the issue asks): `node ./node_modules/@cucumber/cucumber/bin/cucumber-js -p default --tags "not @vr and not @bwpup and not @cdn"` with **no** `--retry` flag, so the default `retry: 3` applies. Never `npm run test:e2e` (long, and pushes reports) | implementer, dod |
| Test — targeted subset | `--tags "<expr>"` or `--name "<scenario name>"` with `--retry 0`; static check first: `npx cucumber-js -p default --dry-run --tags "<expr>"` | implementer, dod |
| Lint command | `npm run lint` (the only code check in CI) | implementer, dod |
| Lint — auto-fix | `npm run lint:fix` | implementer, dod |
| Static analysis | `npx tsc --noEmit -p tsconfig.json` (local only, compare against baseline, only new errors count) | dod |
| Build command | none | implementer |
| Install command | `npm ci` | setup |

**Local run:**

| Setting | Value | Used by |
|---|---|---|
| Boot command | none: the suite never boots or creates a WordPress. `WP_ENV_TYPE=external` → the remote e2e site. `docker` with a running container → `npm_config_env=local`. Anything else → `CANNOT_VERIFY` | qa-engineer, e2e-qa-tester |
| Base URL | from `config/wp.config.ts` (`live` or `local`). Never print or paste it | qa-engineer, e2e-qa-tester |
| Test credentials / login flow | from `config/wp.config.ts` (gitignored). Never print, log or paste them | qa-engineer, e2e-qa-tester |

**Labels & branches:**

| Setting | Value | Used by |
|---|---|---|
| AI label | `Made by AI` | pr-opener, ticket-writer, orchestrator |
| Epic label | `project` (sub-issues carry `sub-task`) | ticket-writer, orchestrator |
| Type labels | `bug`, `enhancement`, `test`, `smoke`, `Test Maintenance` | ticket-writer |
| Effort labels | `effort: [XS]`, `[S]`, `[M]`, `[L]`, `[XL]` | ticket-writer |
| Issue status transition | none | orchestrator |
| Base branch | `develop` (`trunk` also exists, never a base unless asked) | all |
| Branch prefixes | `fix` / `enhancement` / `test` (see §6) | orchestrator |
| Worktree isolation | off | orchestrator |
| Protected branches (never push directly) | `develop`, `trunk` | all |

Use only labels that exist (`gh label list --repo wp-media/wp-rocket-e2e`). Never invent one, except ensuring `Made by AI` exists.

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
- The default profile retries 3 times. When validating a new/changed scenario or checking flakiness, run with `--retry 0`. For a full-suite run keep the default retries (do not pass `--retry 0`) and report separately any scenario that passed only after a retry.
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

**Exception — Delivery Pipeline:** When operating under the GAS `orchestrator` skill (triggered by `/task <number>`, `work on issue <number>`, or `#<number>`), the `implementer` and `pr-opener` agents MAY:

1. Run atomic `git commit` calls — one commit per logical, self-contained change set.
2. Run `git push` exactly once after all commits are ready, to publish the branch.
3. Create a draft GitHub Pull Request from the PR template.
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

Base branch is `develop`. Every PR body must follow `.claude/skills/orchestrator/refs/pr-template.md` (the `PR Template Checker` CI enforces it).

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

# 9. QA Conventions

The GAS `qa-engineer` agent validates PRs at the end of the delivery pipeline and delegates execution to `e2e-qa-tester`. This repo overrides `e2e-qa-tester` in `.claude/agents/e2e-qa-tester.md`: instead of driving a browser by hand, it runs the PR's Cucumber scenarios through the `e2e-run` skill against the configured test site. The scenarios drive their own Playwright browser.

- **Execution QA is mandatory** whenever the diff adds or changes a feature, step, hook, helper, selector, section or `cucumber.json`. `qa-engineer` must delegate to `e2e-qa-tester` for these, not skip it as "no UI change".
- **Environment rule:** `WP_ENV_TYPE=external` → the remote site; `docker` with a running container → `npm_config_env=local`; otherwise `CANNOT_VERIFY`. Never build a fresh WordPress: the scenarios need the e2e environment snapshot.
- **`--retry 0` for new or changed scenarios.** For a flaky-test fix, repeat the in-scope scenarios 3 times and report `passes/runs`. A **full-suite** run keeps the default `retry: 3`; list scenarios that passed only on a retry as flaky, not as clean passes.
- **Non-vacuous proof:** every new or changed scenario is shown to fail when the behavior it tests is broken (precondition or product mutation, otherwise an assertion review that caps the criterion at `PARTIAL`). Mutations are always reverted.
- **Shared code** (hooks, shared steps, `PageUtils`, `utils/commands.ts`, selectors, sections, `cucumber.json`, npm scripts) → also run one unrelated scenario that uses it.
- **Guards:** a criterion that needs a plugin zip, helper plugin, config key (`IMAGIFY_INFOS`, `BACKWPUP_INFOS`) or service that is missing is `CANNOT_VERIFY`, naming exactly what is missing. A `SKIP` or `CANNOT_VERIFY` is never a pass.
- **One run per site:** never run on a site another agent or run is using. Nothing detects other users of a remote site, so for `external` always ask the user to confirm the hostname is free before the first real run, once per session and hostname. No confirmation means `SKIP`/`CANNOT_VERIFY`.
- **Browsers:** never use the shared Playwright MCP browser. Agents run in parallel. Use a standalone Playwright script with a fresh temporary profile and delete it afterwards.

---

# 10. Skills Activation

Generic pipeline skills come from the GAS plugin `gas-delivery-pipeline-templates`. The repository ships only the e2e-specific skills under `.claude/skills/`, plus the files the GAS skills expect to find in the repo (`orchestrator/refs/pr-template.md`, `orchestrator/scripts/issue-sync.sh`) and the local `e2e-qa-tester` agent.

Agents MUST activate the relevant skill depending on the task:

- Writing/changing features, steps, hooks, helpers, selectors, tags or npm scripts → `wp-rocket-e2e-architecture`
- Running scenarios against the test site (probe, validation, QA) → `e2e-run`
- Issue intake, branch, PR, review, QA → `gas-delivery-pipeline-templates:orchestrator`
- Public-surface changes (tag, npm script, config key, hook behaviour, shared helper) → `gas-delivery-pipeline-templates:docs`
- Pre-handoff checks → `gas-delivery-pipeline-templates:dod`

Use the fully qualified `gas-delivery-pipeline-templates:` names: bare `docs` also matches `anthropic-skills:docs`. Other entry points: `gas-delivery-pipeline-templates:groom`, `:challenge`, `:review`, `:qa`.

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

---

# 14. Delivery Pipeline Conventions

Project-specific guidance for the GAS delivery pipeline agents. It extends §1–§7 and never overrides them.

## Grooming conventions

Effort is sized by the grooming and challenger agents; this repo does not define its own scale.

**Spec additions required in every spec** (grooming-agent writes them, challenger and lead-reviewer check them):

1. **Proposed Scenarios** — a `gherkin` block with the scenarios to add or change, so the team can approve the wording before implementation. It is also copied into the grooming comment on the issue.
   - Reuse existing step text word for word (copied from the step definition pattern). Mark every step that doesn't exist yet with a trailing `# NEW`; each one appears as "Add" in the spec's Steps: Reuse vs Add table.
   - Include the tags (they decide which hooks run), the Background, and cleanup steps if no hook does the cleanup. Use a `Scenario Outline` for the same flow over several inputs.
   - Changing an existing scenario: show the full scenario after the change and name the feature file. A pure flaky-step fix with no scenario change says "No scenario change" and names the affected scenarios.
   - The implementer starts the `.feature` file from this block. The challenger checks it. The lead-reviewer flags any difference not explained in the PR description or the implementer's notes (`LOGIC` if it changes what is verified, otherwise `CONVENTIONS`).
2. **Simplest Option Considered** — the data-only or config-only fix, and either "chosen" or why it cannot work, with evidence.
   - When a test fails because the product behavior changed (changed counts, new default, renamed text, removed entry), the default is to update the expected data (`src/support/results/*.json`, `config/scenarioUrls.json`, feature-file examples) and nothing else. Step or helper code changes need a stated reason why the data-only fix cannot work.
   - Any claim that rules it out ("non-deterministic", "order not guaranteed", "cannot be predicted") must be verified, not assumed: read the linked `wp-rocket` code or PR, or run a probe, and cite the file/function. If it can't be verified, list it in `risk_notes` as an unverified assumption.
   - If the data-only fix means the test no longer checks some product behavior (a limit, for example), say so and name where that behavior is covered (TestRail case, another scenario).
   - The orchestrator does not skip the `challenger` on a small issue when this evidence is missing, and the challenger verifies it.

**Always flag as HIGH risk regardless of effort:**
- Changes to `src/support/hooks.ts` or `src/backwpup/support/hooks.ts` (global `BeforeAll`/`Before`/`After`, or a tag filter on a hook)
- Changes to a shared step (`general.ts`, `steps.ts`), `PageUtils`, `utils/commands.ts`, `utils/helpers.ts`, `src/common/selectors.ts` or `sections.ts`: every feature depends on them
- Changes to `cucumber.json` (profiles, require globs, `retry`, `parallel`) or to the `test:e2e` tag exclusions
- A scenario that mutates the shared test site (plugins, options, theme, permalinks, cron events) without cleanup
- Anything touching `config/wp.config.ts` handling, `config/wp.config.sample.ts`, plugin zips, or `PluginBuilder` refs (`E2E_*_REF`)
- A fix that relies on a longer timeout, `retry`, `waitForTimeout` or a `debug.log` exclusion instead of the root cause

**Places that often need to change too:** the tag in `.github/copilot-instructions.md` and a `test:<tag>` npm script, `config/wp.config.sample.ts` for a new config key, `src/common/selectors.ts` / `sections.ts`, `utils/types.ts`.

**Probe:** for a flaky or broken step, `grooming-agent` may use `e2e-run` for one cheap targeted run to confirm today's behavior (§4.2). If the site is unreachable it notes "probe skipped: <reason>" and continues.

**Knowledge graph:** none (§10).

## Review conventions

Load `wp-rocket-e2e-architecture` and read `.github/copilot-instructions.md` for every diff. In this repo the "product" is the test suite, so review for three failure modes: **false confidence** (a scenario that passes while the feature is broken), **false alarms** (flaky or environment-coupled scenarios), and **breaking other scenarios** (a shared step or hook changed, missing cleanup).

- Every `Then` must be able to fail. Flag assertions on always-truthy values, swallowed errors, loops over possibly empty collections. A vacuous assertion is HIGH.
- Search every changed step, helper, selector, section key, hook, tag or npm script across the whole suite. A consumer outside the diff is a cross-file finding.
- No new `waitForTimeout`/`sleep`, no raised `retry`, no new arrow-function steps, no raw selectors in steps, no raw `exec`/`ssh` in steps.
- No duplicate or ambiguous step text (verify with a dry-run).
- Secrets: a committed `config/wp.config.ts`, plugin zip, credential, SSH detail or private hostname is CRITICAL. `config/wp.config.sample.ts` holds placeholders only.
- Sibling updates: new tag → `test:<tag>` script and a deliberate `test:e2e` decision; new config key → `wp.config.sample.ts`; new prerequisite → documented.
- Observable behavior of shared infrastructure (a step's wording, implicit waits, which hooks run for which tags, npm script names that automation calls such as `test:e2e`, `test:smoke`, `push-report`, report paths under `test-results/`) is public surface: a change needs to be intentional and documented.
- Compare the feature file with the spec's **Proposed Scenarios** block (see Grooming conventions): same tags, step order and step text.
- Do not run scenarios during review. A `--dry-run` is fine.

## IMPLEMENTER configuration

Single implementer for the whole change: there is no frontend/backend split. Commit format and permissions: §5.1.

**Common pitfalls:**
- ❌ Arrow-function steps → ✅ `async function (this: ICustomWorld): Promise<void>`
- ❌ Adding a step that rephrases an existing one → ✅ reuse it, then dry-run for ambiguity
- ❌ Per-feature setup in `BeforeAll`, global `Before` or copied steps → ✅ a tag-scoped hook
- ❌ `waitForTimeout`, a longer timeout or `retry` to force green → ✅ wait on a selector, response or state and fix the cause
- ❌ Validating a new/changed scenario with the default profile → ✅ `--retry 0` on the narrowest tag or `--name` (full-suite runs keep the default retries)
- ❌ Running `npm run test:e2e` or `push-report` → ✅ a targeted run only
- ❌ Trusting the exit code on Node 24 → ✅ read the summary and `test-results/cucumber-report.json`
- ❌ Leaving plugins, options or theme changed on the shared site → ✅ clean up in `@setup` or a tag-scoped `After`
- ❌ Real values in `config/wp.config.sample.ts`, features or docs → ✅ placeholders and key names only
- ❌ `gh pr edit`, `gh issue edit`, or `gh pr/issue view` without `--json`: on older `gh` versions (2.45 confirmed) they fail with a GitHub error about the deprecated classic Projects. Upgrade `gh` first (2.102 works). If you can't, → ✅ edit with `gh api` (REST PATCH), always pass `--json` to views, and fall back to the GraphQL `markPullRequestReadyForReview` mutation for `gh pr ready`
- ❌ Invoking the bare `docs` or `dod` skill → ✅ `gas-delivery-pipeline-templates:docs` and `gas-delivery-pipeline-templates:dod`

## PR description sync

The PR body must match the code after every fix push (a fix loop from review, QA or CI).

- After each fix push, before re-running the gates, update every PR template section whose content no longer matches the diff: **How to test** (tags or commands changed), **Documentation** (steps, hooks, helpers added or changed), **Risks** (shared hooks or helpers touched, new site side effects), **Affected Features & Quality Assurance Scope**, and **What was tested** (the new QA/run evidence).
- The implementer reports these as `pr_description_updates` (section heading plus its full new text) in its return notes. The orchestrator applies them with a REST PATCH, keeping every heading verbatim.
- The DoD PR-description check compares the body with the diff. If How to test no longer covers the change, or a tag, step or hook in the diff is missing from How to test or Documentation, it is a FAIL.
- Headings are copied exactly from `.claude/skills/orchestrator/refs/pr-template.md`, including a mandatory `### Documentation` even for data-only changes. A missing or renamed heading is a FAIL, because the `PR Template Checker` CI rejects it.

## Ticket conventions

For `ticket-writer`, in both modes and for follow-ups from review, QA or the challenger:

- Search for duplicates before every `gh issue create`: 2–3 searches over open and closed issues with different keywords (title words, the tag or feature such as `@delayjs`, the file/step/helper name such as `clearWPRCache`). Use the REST search so the closed reason is returned: `gh api -X GET search/issues -f q="repo:wp-media/wp-rocket-e2e is:issue <keywords>"`.
- A duplicate asks for the same change to the same scenario, step, helper or behavior. The same area with a different change is "related": mention it, don't merge.
- From a user request, show the duplicate and ask before creating. For pipeline follow-ups, don't ask: an **open** duplicate gets a comment instead of a new issue; one **closed as not planned** is skipped; one **closed as completed** gets a new issue that links the old one ("Previously fixed in #N").
- Labels: see Project Configuration. Epics are `project` with `sub-task` children. Follow-ups are `enhancement`, or `Test Maintenance` for cleanup of existing tests. Always `Made by AI`.

## Documentation conventions

**Docs location:** `README.md` (setup, prerequisites, run commands), `src/backwpup/README.md` (BackWPup), `.github/copilot-instructions.md` (the main developer guide: tags, npm scripts, config keys, hooks, helpers, troubleshooting).

**Public surface** (what the `docs` skill treats as documentation-worthy):
- a new or renamed tag, a new or changed npm script, or a change to the `test:e2e` exclusions
- a new or changed `config/wp.config.sample.ts` key, or an environment variable the suite reads (`E2E_*_REF`, `npm_config_*`)
- hook behaviour in `src/support/hooks.ts` / `src/backwpup/support/hooks.ts`
- a shared helper (`PageUtils`, `utils/commands.ts`, `utils/helpers.ts`) or a section/option in `src/common/sections.ts`
- a new site prerequisite (plugin zip, helper plugin, theme, service account)
- `cucumber.json` profiles, report paths, retry/parallel defaults

**Skip** when only feature-specific scenarios, steps or selectors changed with existing tags and scripts, or a flaky step was fixed without changing its wording, parameters or side effects.

A new `config/wp.config.sample.ts` key triggers a Slack notification on merge to `develop` (`notify-config-change.yml`): document the key. A new tag comes with a `test:<tag>` script; document both, and say whether `test:e2e` excludes it. Document the current state, never real credentials, hosts or URLs.

**Inline comment style:** §2.2.

## Definition of Done

- `npm run lint` passes.
- `npx tsc --noEmit -p tsconfig.json` shows no new errors in code that Cucumber loads. Errors in eslint-ignored files (`src/specs/**`, `utils/commands.ts`, `utils/configurations.ts`) are a WARN, not a pass.
- `npx cucumber-js -p default --dry-run` reports no undefined or ambiguous steps for the affected tags. A new step can make an existing feature ambiguous, so also dry-run the whole suite.
- The changed scenarios ran with `--retry 0` and passed, or the DoD reports the `SKIP` reason from `e2e-run`. A `SKIP` is "unverified", never "passed".
- Flaky-test fixes: repeated runs all green, not a single green run.
- The PR body follows `.claude/skills/orchestrator/refs/pr-template.md` with headings copied exactly. The `PR Template Checker` CI (`wp-media/pr-checklist-action`) fails otherwise.
- No `config/wp.config.ts`, plugin zip, `test-results/`, `@rerun.txt` or `.TemporaryItems/` committed.
