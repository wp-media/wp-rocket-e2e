# Claude agent pipeline — how to use it

This repo uses the GAS delivery pipeline (the `gas-delivery-pipeline-templates` plugin) to take a `wp-rocket-e2e` issue from grooming to a reviewed, QA-checked pull request. The plugin holds the generic agents and skills. This folder holds only what is specific to this repo (TypeScript, Cucumber, Playwright, WP-CLI/SSH helpers), the same way WP Rocket does after [wp-media/wp-rocket#8996](https://github.com/wp-media/wp-rocket/issues/8996).

Repo rules for all AI work, and the settings the pipeline reads (commands, labels, branches, conventions), are in [`AGENTS.md`](../AGENTS.md). The detailed repo guide is [`.github/copilot-instructions.md`](../.github/copilot-instructions.md).

## Before you start

- Accept the plugin prompt when you trust this folder. `.claude/settings.json` registers the `group-ai-skills` marketplace and enables `gas-delivery-pipeline-templates` and `gas-wpm-qa`. Make sure `gas-delivery-pipeline-templates` is version **2.1.1 or later** (`claude plugin marketplace update group-ai-skills`, then `claude plugin update gas-delivery-pipeline-templates@group-ai-skills`, then restart). Older versions lack the dry-run mode.
- `gh auth login` (the pipeline reads issues, opens PRs and posts comments as you).
- `npm ci`.
- `config/wp.config.ts` points at **your** test site (see [Which environment QA uses](#which-environment-qa-uses)).
- The plugin zips the scenarios need are in `plugin/` (`new_release.zip`, `previous_stable.zip`, …), or the `E2E_WPR_NEW_REF` / `E2E_WPR_PREV_REF` variables are set.
- A display for the browser (Chromium runs headed). On a server without one, use `xvfb-run`.

## Run the pipeline

In Claude Code, from the repo root, write `work on issue #123` or use the orchestrator skill directly:

```
/gas-delivery-pipeline-templates:orchestrator 123
```

Add a phrase to set how often it stops to ask you: "handle this autonomously" stops only for hard blockers, nothing is the default, and "keep this interactive" confirms after each phase.

To try the pipeline without touching GitHub, say "dry run" (for example "work on issue #123, dry run"): everything runs locally, nothing is pushed or posted, and the commands it would have run are printed.

Single steps are available as `/gas-delivery-pipeline-templates:groom`, `:challenge`, `:review`, `:qa` and `:dod`. Each asks before posting anything to GitHub.

## Which environment QA uses

QA and the implementer run real scenarios against the site in `config/wp.config.ts`, and **those runs change that site** (plugins, settings, `debug.log`). Use a disposable test site only, and run one suite at a time on it. Nothing detects other users of a remote site, so for an `external` site the agent asks you to confirm the hostname is free before its first real run.

| `WP_ENV_TYPE` in your config | What happens |
|---|---|
| `external` | Uses your remote e2e site (the `live` URL), after you confirm it is free. |
| `docker` | Uses the running container, with the `local` URL. The container must already hold the e2e environment snapshot. |
| anything else, or the site is unreachable | No run; QA reports CANNOT_VERIFY and says what to fix. |

The agents never create a fresh WordPress to test on: the scenarios need the e2e environment's pages, themes and helper plugins, so a blank site gives false failures.

In a git worktree, `config/wp.config.ts` doesn't exist. The agent asks before copying yours from the main checkout, and deletes the copy afterwards.

## What's in this folder

| Path | Contents |
|---|---|
| `agents/e2e-qa-tester.md` | Overrides the GAS agent: runs the PR's Cucumber scenarios with `--retry 0`, repeats them for flakiness fixes, proves they can fail. Called by the GAS `qa-engineer`. |
| `skills/e2e-run/` | How to run scenarios safely (environment choice, `--retry 0`, reading the report) |
| `skills/wp-rocket-e2e-architecture/` | Test rules for this repo; `refs/best-practices.md` lists best-practice references |
| `skills/orchestrator/refs/pr-template.md` | The PR body template the `PR Template Checker` CI enforces |
| `skills/orchestrator/scripts/issue-sync.sh` | Issue sync that also pulls parent epics and sub-issues |

The GAS orchestrator, grooming, challenger, implementer, PR, review, QA, DoD and docs agents and skills are not copied here. Do not add a repo copy of one: two copies make a plain request match both.

## Improving it

- **Session learnings:** after a run surprises you, add a dated line to `AGENTS.md` §13. Write it yourself; don't have an LLM regenerate that section. Agents read it on every run.
- **Best-practice references:** add a link and one line on when to use it to `skills/wp-rocket-e2e-architecture/refs/best-practices.md`.
- **Conventions for a pipeline phase** (grooming risks, review checks, implementer pitfalls, docs, DoD) go in `AGENTS.md` §14, not in a new agent file.
