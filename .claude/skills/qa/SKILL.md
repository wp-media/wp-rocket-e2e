---
name: qa
description: Run QA validation on a wp-rocket-e2e pull request — checks out the PR, installs, lints, dry-runs the PR's Cucumber tags, executes the new/changed scenarios against the configured test site with --retry 0, checks they are not vacuous, and optionally posts the report as a PR comment. Standalone entry point for the qa-engineer agent.
argument-hint: <PR-number-or-URL>
---

# QA

Standalone QA run for any wp-rocket-e2e PR. Executes the PR's scenarios against the
WordPress test site configured in `config/wp.config.ts`, validates every acceptance
criterion, and produces a test report. Posting to GitHub is your choice — you are prompted
at the end.

> **Heads-up:** a real run **mutates the configured site** (installs/activates/deletes
> plugins, changes WP Rocket settings, wipes `debug.log`). Make sure `config/wp.config.ts`
> points at a disposable test site that nobody else is running a suite against right now.
> If the config, site/SSH or required plugin zips are unavailable, QA still lints and
> dry-runs, and reports the execution part as `CANNOT_VERIFY` with the reason.

## Step 1 — Config

This skill targets `wp-media/wp-rocket-e2e`. Specs live at `.TemporaryItems/Issues/wp-rocket-e2e/issues/<N>-spec.md`.

## Step 2 — Resolve the PR

Use `$ARGUMENTS` as the PR number or URL. If empty, resolve from the current branch:

```bash
gh pr list --repo wp-media/wp-rocket-e2e --head "$(git branch --show-current)" --json number,url -q '.[0] | "\(.number) \(.url)"'
```

If no PR is found, tell the user and stop.

Get the base branch and the linked issue:
```bash
gh pr view <PR_NUMBER> --repo wp-media/wp-rocket-e2e --json baseRefName,body -q '{base: .baseRefName, body: .body}'
```

Extract the linked issue number from the body (`Fixes #N`, `Closes #N`, or an issue URL).

## Step 3 — Invoke the qa-engineer agent

Invoke the `qa-engineer` sub-agent with:
- PR number and PR URL, and the linked issue number if found
- Base branch from Step 2 (as `origin/<base>`)
- Spec path if `.TemporaryItems/Issues/wp-rocket-e2e/issues/<N>-spec.md` exists
- Tags under test, if the user named them (otherwise the agent derives them from the diff)
- Repo: `wp-media/wp-rocket-e2e`

> **STANDALONE MODE** — two differences from the normal pipeline run:
> 1. **Skip the PR-comment posting step (Step 6b).** Instead, output the full QA report as
>    formatted Markdown in your response, in a section titled `## QA Report`. Use the same
>    format the pipeline would post (including the `<!-- ai-pipeline:qa-report -->` marker).
> 2. **Skip the StructuredOutput JSON return.** Output a short human-readable summary
>    instead: overall result, pass/fail per criterion (with run counts), whether each new
>    scenario was proven non-vacuous, and any blockers.

All other steps run normally — the PR branch is checked out, `npm ci`, lint and dry-run
are performed, the scenarios are executed against the target site with `--retry 0`
(repeated for flakiness fixes), and temporary mutations are reverted.

## Step 4 — Offer to post

After the agent responds, display its `## QA Report` and ask:

> **Post this QA report to PR #\<PR_NUMBER\>?**
> Reply `yes` to post, `no` to finish here.

Before posting, re-check the report contains no credentials, SSH details or private hostnames.

**If yes** — post with dedup: check for an existing `<!-- ai-pipeline:qa-report -->` comment,
update it with `gh api --method PATCH repos/wp-media/wp-rocket-e2e/issues/comments/$EXISTING_ID` if found, otherwise create a new comment with `gh pr comment <PR_NUMBER> --repo wp-media/wp-rocket-e2e`.

**If no** — confirm the QA run is complete and finish.
