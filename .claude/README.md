# Claude agent pipeline — how to use it

This folder lets Claude Code take a `wp-rocket-e2e` issue from grooming to a reviewed, QA-checked pull request. It is ported from WP Rocket's `.claude/` and adapted to this repo (TypeScript, Cucumber, Playwright, WP-CLI/SSH helpers).

Repo rules for all AI work are in [`AGENTS.md`](../AGENTS.md). The detailed repo guide is [`.github/copilot-instructions.md`](../.github/copilot-instructions.md).

## Before you start

- `gh auth login` (the pipeline reads issues, opens PRs and posts comments as you).
- `npm ci`.
- `config/wp.config.ts` points at **your** test site (see [Which environment QA uses](#which-environment-qa-uses)).
- The plugin zips the scenarios need are in `plugin/` (`new_release.zip`, `previous_stable.zip`, …), or the `E2E_WPR_NEW_REF` / `E2E_WPR_PREV_REF` variables are set.
- A display for the browser (Chromium runs headed). On a server without one, use `xvfb-run`.

## Run the full pipeline

In Claude Code, from the repo root:

```
/orchestrator 123
```

or just write `work on issue #123`.

Add a phrase to set how often it stops to ask you:

| You write | It does |
|---|---|
| "handle this autonomously", "just do it" | Stops only for hard blockers; records its assumptions in the final report. |
| nothing | Default: stops at loop limits, unclear acceptance criteria and partial QA results. |
| "keep this interactive", "check with me before…" | Confirms after grooming, implementation, review and QA. |

The steps are: issue sync → grooming → challenger (for riskier issues) → test-developer → draft PR → DoD, lead review and QA in parallel → nice-to-have review → PR marked ready.

Follow a run in the log: `.TemporaryItems/Issues/wp-rocket-e2e/issue-<N>-workflow-log.html` (gitignored, open it in a browser).

## Run one step only

Each of these runs alone and **asks before posting anything to GitHub**:

| Command | What it does |
|---|---|
| `/groom 123` | Writes the spec, including the proposed scenarios in Gherkin, to `.TemporaryItems/Issues/wp-rocket-e2e/issues/123-spec.md`. |
| `/challenge 123` | Reviews that spec for risks (flakiness, cleanup, ambiguous steps, env provisioning). Needs `/groom` first. |
| `/review 433` | Code review of a PR against the spec and repo rules. |
| `/qa 433` | Runs the PR's scenarios with `--retry 0` on your test site and writes a QA report. |
| `/dod` | Definition of Done check for the current branch. |

## What it creates on GitHub

- A branch `fix/…`, `enhancement/…` or `test/<issue>-<slug>` from `develop`.
- A grooming comment on the issue, with the proposed Gherkin scenarios for the team to approve.
- A **draft** PR that follows the PR template, with the `Made by AI` label and you as assignee.
- Review comments and a QA report on the PR.
- Follow-up issues for nice-to-haves you choose to ticket.
- At the end, the PR is marked ready for review and a summary is posted on the issue.

Commits carry a `Co-Authored-By` trailer naming the model.

## Which environment QA uses

QA and test-developer run real scenarios against the site in `config/wp.config.ts`, and **those runs change that site** (plugins, settings, `debug.log`). Use a disposable test site only, and run one suite at a time on it.

| `WP_ENV_TYPE` in your config | What happens |
|---|---|
| `external` | Uses your remote e2e site (the `live` URL). |
| `docker` | Uses the running container, with the `local` URL. The container must already hold the e2e environment snapshot. |
| anything else, or the site is unreachable | No run; QA reports CANNOT_VERIFY and says what to fix. |

The agents never create a fresh WordPress to test on: the scenarios need the e2e environment's pages, themes and helper plugins, so a blank site gives false failures.

In a git worktree, `config/wp.config.ts` doesn't exist. The agent asks before copying yours from the main checkout, and deletes the copy afterwards.

## What's in this folder

| Path | Contents |
|---|---|
| `agents/` | grooming-agent, challenger, test-developer, release-agent, lead-reviewer, qa-engineer, ticket-writer |
| `skills/orchestrator/` | The pipeline coordinator and its log format |
| `skills/issue-workflow/` | Issue sync, branch and PR-draft scripts, PR template |
| `skills/e2e-run/` | How to run scenarios safely (environment choice, `--retry 0`, reading the report) |
| `skills/wp-rocket-e2e-architecture/` | Test rules for this repo; `refs/best-practices.md` lists best-practice references |
| `skills/groom`, `challenge`, `review`, `qa`, `dod`, `docs` | The single-step commands above, plus the docs updater |

## Improving it

- **Session learnings:** after a run surprises you, add a dated line to `AGENTS.md` §13. Write it yourself; don't have an LLM regenerate that section. Agents read it on every run.
- **Best-practice references:** add a link and one line on when to use it to `skills/wp-rocket-e2e-architecture/refs/best-practices.md`. test-developer, grooming-agent and lead-reviewer read it.
