---
name: dod
description: >
  Run the Definition of Done checklist for the current wp-rocket-e2e branch and report
  PASS/WARN/FAIL with evidence. Two modes: layer 1 (self-correction inside test-developer —
  resolves FAILs before handoff; runs lint, a tsc baseline comparison and a Cucumber
  dry-run locally) and layer 2 (independent orchestrator gate — fresh perspective after
  the PR is open; reads remote CI). Pass layer: "1" or layer: "2" when invoking.
---

# DOD SKILL

You are a quality gate checker. Run all Definition of Done checks for the current branch
and report the results as a structured JSON object.

In this repo the change under review **is** test code (features, steps, hooks, helpers,
selectors, npm scripts, configs). "Automated tests in place" therefore means: the new or
changed scenarios were **actually executed** against a test site and the evidence is
recorded — not that a unit test exists for them.

## Two-layer operation

**Layer 1 (implementation agent self-correction):**
Invoked inside `test-developer` as step 3 of its internal sequence (or `release-agent` for
release PRs). If any check returns `FAIL`, the agent self-corrects and re-runs before
handing off. `overall` can only be `PASS` or `WARN` when the agent hands off — FAILs must
be resolved.

**Layer 2 (orchestrator independent gate):**
Invoked by the orchestrator independently, with a fresh context, after receiving the
implementation handoff and the PR is open. Provides an unbiased second opinion. Can return
`FAIL`. Produces `layer1_delta` — issues found in L2 that L1 did not catch. Runs in
parallel with `lead-reviewer` and `qa-engineer`, so it must not depend on their output.

---

## Inputs

| Parameter | Type | Description |
|---|---|---|
| `layer` | `"1"` or `"2"` | Which gate to run. Layer 1 = self-correction inside the implementation agent; Layer 2 = independent orchestrator gate. |
| `file_scope` | array of file paths (optional) | Files declared in-scope by the orchestrator for this issue. Used by Check 6 (Layer 1 only). Omit or pass `null` for Layer 2. |
| `base_branch` | string (optional) | The PR base branch. Defaults to `develop`. Used in all `git diff` commands. |
| `pr_url` | string (optional) | The GitHub PR URL. Required for Layer 2 (Check 1, Check 4, Check 5). |
| `run_evidence` | object (optional, Layer 1) | The `e2e-run` result(s) the implementation agent got for the changed scenarios (`status`, `scenarios_tested`, `details`). Used by Check 2. |

---

## Anti-rationalization table

Before running the checks, acknowledge these. Agents are good at producing plausible reasons to skip steps — this table preempts them.

| You'll be tempted to say | Why you can't |
|---|---|
| "Lint passes, so the scenario is fine" | eslint is the only CI check, and it never executes a scenario. Check 2 needs a real run with `--retry 0`. |
| "The dry-run passes, so the tests work" | A dry-run proves steps are defined and unambiguous. It proves nothing about whether they pass against a site. |
| "It passed with the default profile" | The default profile retries 3 times. Evidence must come from a `--retry 0` run, or it hides flakiness. |
| "The site might be down, I'll skip running it" | Try it (via `e2e-run`). If it is down, `SKIP` with the concrete failing check is a valid outcome — but it must be attempted and named. |
| "Only a step file changed, there's no scenario to run" | Every step is used by some feature. Run at least one scenario that exercises the changed step/hook/helper. |
| "No public surface changed, skipping docs" | A new tag, npm script, `wp.config` key, hook behaviour or shared helper is the public surface of this repo. Check for those. |
| "The PR description section is present" | Present is not the same as filled. Thin is a WARN — name it explicitly. |
| "tsc shows errors, but they were already there" | Prove it: compare against the base branch. Only new errors may be waved through as baseline. |

---

## Base branch guard

Before running any check, determine the PR base branch. All `git diff` commands below assume `origin/develop`, but if the PR targets a different base (e.g. `trunk`) this silently compares the wrong tree.

```bash
BASE=$(gh pr view "$PR_URL" --repo wp-media/wp-rocket-e2e --json baseRefName --jq .baseRefName 2>/dev/null)
if [ -n "$BASE" ] && [ "$BASE" != "develop" ]; then
  echo "WARNING: Base branch is '$BASE', not 'develop'. Adjust git diff commands accordingly."
fi
BASE=${BASE:-develop}
git fetch origin "$BASE" --quiet
```

Use `origin/$BASE` in place of `origin/develop` in every diff command throughout this skill. If `$BASE` is empty (Layer 1, no PR yet), default to `develop` (or the `base_branch` input).

Identify the changed files once and reuse the list:
```bash
git diff origin/$BASE --name-only
```

---

## The 6 checks

Run each check in order. Report **PASS**, **WARN**, or **FAIL** with specific evidence for each.

---

### Check 1 — Manual validation confirmed

Look at the PR description:
- In Layer 1: read the local draft at `.TemporaryItems/Issues/wp-rocket-e2e/pull/<N>.md`
- In Layer 2: fetch from GitHub: `gh pr view <PR_NUMBER> --repo wp-media/wp-rocket-e2e --json body -q .body`

Look at the "What was tested" section. It must contain **concrete runs** — which tags/scenarios were executed, against what kind of site (docker / local / external test site — never credentials or private hostnames), how many times, and the result. Not "N/A", not "tested locally".

For a flakiness fix, it should state the repeat count and pass rate (e.g. "`@lcp` with `--retry 0`, 3/3 green").

If manual validation appears insufficient, consider invoking the `qa-engineer` agent: it is
designed to independently run a PR's scenarios and share feedback.

- **PASS**: Section names the scenarios/tags run, the retry setting, and their outcome
- **WARN**: Section is present but thin (e.g. one run of a flakiness fix, or no mention of `--retry 0`), or honestly states the run was SKIPPED with a concrete environment reason
- **FAIL**: Section is empty, says "N/A" without justification, claims a pass with no detail, or no PR draft exists at all (Layer 1 only — in Layer 2 this is FAIL since the PR is open)

---

### Check 2 — Automated tests in place (the scenarios themselves were executed)

From the changed files, determine what must have been executed:

- Changed/added `*.feature` files (`src/features/**`, `src/backwpup/features/**`) → those scenarios.
- Changed step definitions (`src/support/steps/**`, `src/backwpup/steps/**`), hooks (`src/support/hooks.ts`, `src/backwpup/support/hooks.ts`), helpers (`utils/*.ts`), `src/common/selectors.ts` / `sections.ts`, `cucumber.json` → at least one scenario that exercises each changed step/hook/helper (find them with `grep -rn "<step text>" src/features src/backwpup/features`).
- Docs-only, `.github/`, `.claude/`, or `package.json` metadata-only changes → nothing to execute; Check 2 is PASS with evidence "no executable change".
- If the issue asked to automate a test case (TestRail case / WP Rocket QA checklist item), confirm a scenario for it exists in the diff.

**Static gate (always, both layers)** — the scenarios in scope must resolve:
```bash
npx cucumber-js -p default --dry-run --tags "<expr covering the changed scenarios>"
```
Read the summary lines (`N scenarios (… skipped)` / `… undefined` / `… ambiguous`), not the exit code — the dry-run also segfaults on exit under Node 24. Zero matching scenarios means the tag expression is wrong. Undefined or ambiguous steps → **FAIL**. (Hooks import `config/wp.config.ts`; if it is missing, copy `config/wp.config.sample.ts` to it for the dry-run and delete it afterwards. Never commit or print it.)

**Execution evidence:**

- **Layer 1:** use `run_evidence` from the implementation agent (its `e2e-run` result). If absent, look for a fresh `test-results/cucumber-report.json`: its mtime must be newer than the last modification of the changed files, and it must contain the in-scope scenarios. Read pass/fail from the report (not the process exit code — on Node 24 cucumber can segfault on teardown after a green run). If there is no evidence at all, run the in-scope scenarios via the `e2e-run` skill (`.claude/skills/e2e-run/SKILL.md`) with `--retry 0`.
- **Layer 2:** the evidence is what the PR declares (Check 1's "What was tested") plus the dry-run above. Do not run scenarios against the site at Layer 2 — `qa-engineer` does that in parallel, and two concurrent runs on the same site corrupt each other.

- **PASS**: Dry-run clean AND every in-scope scenario passed in a `--retry 0` run (Layer 1: report/run evidence; Layer 2: the PR states it concretely), or there is no executable change
- **WARN**: Dry-run clean but the real run was `SKIP`ped by `e2e-run` with a concrete environment reason (config missing, site/SSH unreachable, plugin zip unavailable). You MUST include the reason in `evidence`. A SKIP is "unverified", never "passed".
- **FAIL**: Undefined/ambiguous steps; any in-scope scenario failed; a run was never attempted with no environment reason; the only green evidence used retries; or the stated reason for missing execution is "I'll do it in a follow-up" ("later" is the load-bearing word — there is no later)

---

### Check 3 — Documentation updated

The public surface of this repo is what other people use to run and extend the suite. Run `git diff origin/$BASE` and look for:
- A new or renamed **tag** on a feature/scenario
- A new or changed **npm script** in `package.json` (`test:<tag>`, etc.)
- A new or changed **config key** in `config/wp.config.sample.ts` (or a new required env var such as the `E2E_*_REF` build refs)
- A new or changed **hook behaviour** (tag-scoped `Before`/`After`, `BeforeAll` setup, cleanup in `PageUtils.cleanUp()`)
- A new or changed **shared helper** in `utils/` or `PageUtils`, or a new **section** in `src/common/sections.ts`
- A new **prerequisite** on the test site (plugin zip in `plugin/`, helper plugin, theme, third-party service)

Docs that should reflect them: `.github/copilot-instructions.md` (tags list, npm scripts, helpers, config keys, hook order), `README.md` (setup/prerequisites/running), `src/backwpup/README.md` (BackWPup tests). See the `docs` skill.

- **PASS**: No public surface changed, or the matching doc was updated in the diff
- **WARN**: One public-surface change (e.g. a new tag + script) without the doc update
- **FAIL**: Multiple public-surface changes, or a new required config key / prerequisite, with no doc update and no acknowledgement in the PR

---

### Check 4 — PR description matches template

Read the repo's PR template:
```bash
cat .claude/skills/issue-workflow/refs/pr-template.md
```

Then fetch the PR body:
- Layer 1: read `.TemporaryItems/Issues/wp-rocket-e2e/pull/<N>.md`
- Layer 2: `gh api repos/wp-media/wp-rocket-e2e/pulls/<PR_NUMBER> --jq .body`

Check that all required sections from the template are present and non-empty:
- Description (with `Fixes #N`)
- Type of change (one checkbox ticked)
- Detailed scenario → What was tested
- Detailed scenario → How to test (should give the exact command / tags to run)
- Detailed scenario → Affected Features & Quality Assurance Scope
- Technical description → Documentation
- Technical description → New dependencies
- Technical description → Risks (e.g. site state left behind, longer run time, shared step changed)
- Mandatory Checklist → Code validation
- Mandatory Checklist → Code style
- Unticked items justification (when any mandatory box is unticked)
- Additional Checks

The `PR Template Checker` CI (`wp-media/pr-checklist-action`) enforces the checklist — an unticked mandatory item without justification fails it.

**Layer 2 — description matches the code.** Present is not enough; compare the body with the full PR diff (`git diff origin/<base>...HEAD`):
- Every tag added or renamed in a `.feature` file, and every new `test:<tag>` script, appears in **How to test** (the command to run it) and **Documentation**. "How to test" pointing at tags or scenarios that no longer exist or no longer cover the change → **FAIL**.
- New or changed steps, hooks and shared helpers are mentioned in **Documentation**.
- Changes to shared infrastructure (`src/support/hooks.ts`, `src/backwpup/support/hooks.ts`, `utils/page-utils.ts`, `utils/commands.ts`, `src/common/*`, steps in `general.ts`) are listed under **Risks** / **Affected Features**.
- New site prerequisites (plugin zips, pre-installed plugins, config keys) are under **New dependencies**.
Any other mismatch → **WARN**, naming the section and what is missing, so the orchestrator can sync it (Step 6b).

Also confirm the body contains no credentials, SSH details, or private hostnames.

- **PASS**: All required sections present and filled
- **WARN**: One section is thin or partially filled
- **FAIL**: PR not created yet (Layer 2 only), 2+ sections missing / left with placeholder text, or secrets in the body

---

### Check 5 — CI passes

**Layer 1 (no PR yet — local commands):**

```bash
npm run lint                      # the CI check — must be 0 errors
```
If lint reports violations: `npm run lint:fix`, review the resulting diff, then `npm run lint` again. Never edit `.eslintrc` (rules or `ignorePatterns`) to make it pass.

**Type check with baseline comparison** (not in CI; the repo has pre-existing errors, only new ones count). Strip line/column numbers so shifted lines don't look new:

```bash
norm() { grep -E "error TS[0-9]+" | sed -E 's/\([0-9]+,[0-9]+\)//' | sort -u; }
npx tsc --noEmit -p tsconfig.json 2>&1 | norm > /tmp/dod-tsc-head.txt

BASE_WT=$(mktemp -d)                # outside the repo: tsconfig has no "include", so a worktree inside it would be compiled too
git worktree add --detach "$BASE_WT" "origin/$BASE" >/dev/null 2>&1
ln -s "$PWD/node_modules" "$BASE_WT/node_modules"
cp config/wp.config.sample.ts "$BASE_WT/config/wp.config.ts"   # sample only — never copy the real config
(cd "$BASE_WT" && npx tsc --noEmit -p tsconfig.json 2>&1 | norm) > /tmp/dod-tsc-base.txt
git worktree remove --force "$BASE_WT"

comm -13 /tmp/dod-tsc-base.txt /tmp/dod-tsc-head.txt   # errors new on this branch
```
Ignore errors located in `config/wp.config.ts` itself (local file, differs per machine). If `config/wp.config.ts` is absent for the head run, temporarily copy the sample as above and delete it afterwards.

**Cucumber dry-run of the whole suite** (cheap; a new step can make an *existing* feature's step ambiguous):
```bash
npx cucumber-js -p default --dry-run 2>&1 | tail -5
```
Any undefined/ambiguous step that is not also present on the base branch is a FAIL.

**Layer 2 (PR exists — remote CI status):**

The expected checks on PRs (from `.github/workflows/`) are:
- `Typescript eslint` (job `E2E Tests lint with eslint` — `npm ci` + `npm run lint` on Node 20)
- `PR Template Checker` (job `task-check`)

No CI job runs the scenarios. Confirm the list is still current with `ls .github/workflows/`.

```bash
# Wait for all checks to complete
gh pr checks "$PR_URL" --watch

# Then report any failures
gh pr checks "$PR_URL" --json name,state,link \
  --jq '.[] | select(.state == "FAILURE") | {name, link}'
```

`gh pr checks --watch` blocks until all checks complete, so no manual polling loop is needed. State values from the JSON API are uppercase: `SUCCESS`, `FAILURE`, `CANCELLED`.

For any check with state `FAILURE`, fetch the run ID and extract the relevant error excerpt:
```bash
gh pr checks "$PR_URL" --json name,state,link
gh run view <run_id> --repo wp-media/wp-rocket-e2e --log-failed 2>/dev/null | tail -30
```

Include each failure as a separate blocker in the return JSON with:
- `check`: the check name
- `error_excerpt`: the relevant log lines (eslint rule + file:line, or the template item the checker rejected)
- `suggested_fix`: one sentence on what likely caused it

Also verify the `Co-Authored-By` trailer is present on every commit on the branch:
```bash
git log origin/$BASE..HEAD --format="%H %s" | while read sha msg; do
  git show $sha --format="%b" -s | grep -qE "Co-Authored-By: .+ <noreply@anthropic.com>" \
    || echo "MISSING Co-Authored-By on $sha"
done
```

Also verify nothing that must never be committed is on the branch:
```bash
git diff origin/$BASE --name-only | grep -E '^config/wp\.config\.ts$|^plugin/.*\.zip$|^test-results/|^@rerun\.txt$|^\.TemporaryItems/' && echo "FORBIDDEN FILE COMMITTED"
```

- **PASS**: Lint clean, no new tsc errors, dry-run clean (L1) / all checks green (L2), AND trailer present on every commit, AND no forbidden file
- **WARN**: New tsc errors in files eslint ignores (`src/specs/**`, `utils/commands.ts`, `utils/configurations.ts`, …) that do not affect the Cucumber run — name them; or a non-blocking check failing
- **FAIL**: Lint errors, new tsc errors in code loaded by Cucumber, undefined/ambiguous steps, any required check failing, any commit missing the trailer, or a forbidden file committed

---

### Check 6 — File scope compliance

**Layer 1 only** (in Layer 2, file scope is not tracked — this check is skipped with status `N/A`).

The orchestrator passes `file_scope` (array of paths) in the dispatch inputs. Compare it against the branch diff:

```bash
git diff origin/$BASE..HEAD --name-only
git status --porcelain            # uncommitted changes count too at Layer 1
```

Flag any file that appears in the diff but not in `file_scope`.

Exceptions that do not count as violations:
- `package-lock.json` when `package.json` is in scope
- Doc files updated by the `docs` skill (`README.md`, `src/backwpup/README.md`, `.github/copilot-instructions.md`)
- `config/wp.config.sample.ts` when a new config key is in scope
- Files the orchestrator explicitly added to scope via a `blocked_reason` note
- Files modified solely by `npm run lint:fix`. Note which files were auto-fixed and exclude them from the scope-violation count — but prefer reverting auto-fixes outside scope to keep the diff minimal.

- **PASS**: All modified files are within declared scope (or no scope was declared)
- **WARN**: One or more files outside scope were modified — name them and explain why
- **FAIL**: Two or more files outside scope were modified without explanation

**Layer differentiation:**
- **Layer 1:** a Check 6 FAIL is reported as WARN in the overall verdict — handoff proceeds with a note. The L1 overall verdict is only ever PASS or WARN, never FAIL.
- **Layer 2:** a Check 6 FAIL is a genuine FAIL that blocks the gate.

---

## Output format constraints

Apply these constraints strictly for both Layer 1 and Layer 2 reports:

**Length targets:**
- Total report: aim for ≤ 400 words (excluding JSON). If you exceed this, cut PASS summaries first.
- `evidence` field: one sentence maximum per check. State the finding, not the process ("`@lcp` 4 scenarios passed with --retry 0" not "I ran cucumber and reviewed the output and found that…").
- Do NOT repeat the check criteria in the evidence — the reader knows the criteria.
- Never put credentials, SSH details or private hostnames in evidence.

**What to omit:**
- PASS checks with no nuance: replace with a one-line table row.
- Commands you ran: never narrate "I ran `npm run lint` and saw…" — state only what you found.
- Justifications for doing the check: skip the preamble, go straight to the verdict.

**Condensed PASS format:** For checks that simply pass with no nuance, use a one-liner in a summary table instead of a prose paragraph:

| Check | Result | Note |
|---|---|---|
| 2. Automated tests | ✅ PASS | `@lcp` 4/4 scenarios green, --retry 0 |
| 3. Docs | ✅ PASS | No new tag/script/config key |
| 5. CI | ✅ PASS | eslint 0 errors, no new tsc errors, dry-run clean |

Reserve prose evidence for: WARN, FAIL, and PASS-with-caveats checks only.

**What must always appear:**
- The overall verdict (PASS / WARN / FAIL) as the first line
- Any WARN or FAIL check with its evidence and a concrete remediation step
- The JSON result block (required for orchestrator integration)

```
| Check | Status | Evidence |
|-------|--------|----------|
| 1. Manual validation  | PASS | "What was tested" lists @lcp run, 3/3 green with --retry 0 |
| 2. Automated tests    | WARN | Dry-run clean; real run SKIP — healthcheck failed (SSH timeout) |
| 3. Documentation      | WARN | New tag @mytag + test:mytag script not in .github/copilot-instructions.md |
| 4. PR description     | PASS | All sections filled |
| 5. CI                 | FAIL | eslint: explicit-function-return-type in src/support/steps/foo.ts:42 |
| 6. File scope         | PASS | All 4 changed files within declared scope |

Overall: FAIL

Blockers:
- Check 5: src/support/steps/foo.ts:42 missing return type — add `: Promise<void>` to the step callback

Warnings (non-blocking):
- Check 2: scenarios not executed (site unreachable) — QA must run them before merge
- Check 3: add @mytag and test:mytag to the tags/scripts lists in .github/copilot-instructions.md
```

If all checks pass: print **PASS** clearly.
If any check fails: print **FAIL** and list each blocker with a suggested fix.

---

## Structured return object

Always return this JSON object in addition to the human-readable output above:

```json
{
  "overall": "PASS|WARN|FAIL",
  "checks": [
    { "name": "manual-validation", "status": "PASS|WARN|FAIL", "evidence": "string" },
    { "name": "automated-tests", "status": "PASS|WARN|FAIL", "evidence": "string" },
    { "name": "documentation", "status": "PASS|WARN|FAIL", "evidence": "string" },
    { "name": "pr-description", "status": "PASS|WARN|FAIL", "evidence": "string" },
    { "name": "ci", "status": "PASS|WARN|FAIL", "evidence": "string" },
    { "name": "file-scope", "status": "PASS|WARN|FAIL|N/A", "evidence": "string" }
  ],
  "blockers": [
    {
      "check": "ci|automated-tests|manual-validation|pr-description|documentation|file-scope",
      "description": "Check 5: eslint explicit-function-return-type in src/support/steps/foo.ts:42",
      "error_excerpt": "relevant log lines for CI failures — empty string for non-CI blockers",
      "suggested_fix": "add `: Promise<void>` return type to the step callback — empty string if unknown"
    }
  ],
  "warnings": ["Check 2: real run SKIPPED — healthcheck failed (SSH timeout)"],
  "layer1_delta": ["Issues found in L2 that L1 did not catch — populated by orchestrator in layer 2 only"]
}
```

**Layer 1:** `overall` must be `PASS` or `WARN` when the implementation agent hands off.
**Layer 2:** `overall` can be `PASS`, `WARN`, or `FAIL`. Populate `layer1_delta` with
any issues that were not flagged in layer 1.


---

## wp-rocket-e2e-specific notes

- Base branch defaults to `origin/develop`. If the issue branched off something else (e.g. `origin/trunk` for a hotfix), the orchestrator passes the right base.
- eslint (`npm run lint`) is the only code check in CI. `.eslintrc` makes `@typescript-eslint/explicit-function-return-type`, `naming-convention`, `ban-ts-comment` and `ban-types` errors, and ignores `src/specs/**`, `backstop_data/engine_scripts`, `utils/commands.ts`, `utils/configurations.ts` and a few `src/common/*` files — changes in ignored files get no CI coverage at all, so the tsc baseline matters most there.
- `cucumber.json` default profile has `retry: 3`, `parallel: 1`. Validation evidence must come from `--retry 0` runs. Reports land in `test-results/cucumber-report.{json,html}`; failed scenarios in `@rerun.txt`.
- The "public surface" for Check 3 is: tags, npm scripts, `wp.config` keys / env vars, hook behaviour, shared helpers, site prerequisites.
- The `Co-Authored-By` trailer uses the model form passed by the orchestrator: `Co-Authored-By: <CURRENT_MODEL> <noreply@anthropic.com>`. Match the pattern, not a hardcoded model name.
