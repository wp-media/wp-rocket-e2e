---
name: issue-workflow
description: Work on a GitHub issue by number for wp-media/wp-rocket-e2e. Fetches the issue and hands control to the orchestrator skill (running inline in this conversation), which manages grooming, spec review, test implementation, lead review, CI, and QA end-to-end.
---

# Issue Workflow

Repository: `wp-media/wp-rocket-e2e`

When the user asks to work on an issue by number, such as:
- `/task 123`
- `issue 123`
- `#123`

follow this workflow. The orchestrator runs **inline in this conversation** — read the
user's opening message before kicking it off, since it uses that for escalation
calibration (high autonomy / standard / high oversight).

## Tooling

Use shell commands as the primary approach. The GitHub MCP (`mcp_github_*`) may be used if it is connected — but shell is always the safe fallback and is preferred for reliability.

| Operation | Shell (primary) | GitHub MCP (if connected) |
|---|---|---|
| Issue fetch | `bash .claude/skills/issue-workflow/scripts/issue-sync.sh <N>` | `mcp_github_github_issue_read` |
| Branch creation | `bash .claude/skills/issue-workflow/scripts/make-issue-branch.sh` | — |
| PR draft body | `bash .claude/skills/issue-workflow/scripts/init-pr-draft.sh <N>` | — |
| Staging & committing | `git add` / `git commit` | — |
| Pushing | `git push -u origin <branch>` | — |
| PR creation | `gh pr create` | `mcp_github_github_create_pull_request` |
| CI monitoring | `gh pr checks <PR#>` | `mcp_github_github_pull_request_read` |

CI on PRs is only "Typescript eslint" and "PR Template Checker" — no CI job runs the Cucumber scenarios. Scenario validation happens in the QA step, against the WordPress site configured in `config/wp.config.ts`.

## Steps

1. **Extract** the issue number from the user's message.

2. **Fetch the issue** — run `bash .claude/skills/issue-workflow/scripts/issue-sync.sh <N>` (or use the MCP equivalent). Read the resulting file at `.TemporaryItems/Issues/wp-rocket-e2e/issues/<N>.md`.

3. **Check for parent epics** — if `Parent Epic (GitHub)` or `Parent Epics (Task List)` has entries, sync each parent with `issue-sync.sh <epic-N>` and read those files for context. (Related issues are synced automatically unless `WPROCKET_E2E_SYNC_RELATED=0`.)

4. **Check for a linked WP Rocket / BackWPup issue or PR** — e2e issues often automate a TestRail case or a QA checklist from a `wp-media/wp-rocket` (or BackWPup) issue/PR. If one is linked, note it; the grooming agent will read it with `gh issue view <N> --repo wp-media/wp-rocket` / `gh pr view`. The `issue-sync.sh` script only syncs `wp-media/wp-rocket-e2e` issues.

5. **Check if this is an Epic** — if the issue has label `epics`, Issue Type `EPIC`, or has sub-issues listed, ask the user: "Work the epic as a whole, or a specific sub-issue?" If a sub-issue is chosen, sync it and proceed with the epic context in mind.

6. **Determine base branch** — default is `origin/develop` unless the user specified otherwise (`trunk` also exists; do not use it as a base unless asked).

7. **Invoke the `orchestrator` skill inline** (do not spawn it as a sub-agent — it runs in this conversation context so it can read the user's intent for escalation calibration):
   > Inputs: issue number `N`, issue file `.TemporaryItems/Issues/wp-rocket-e2e/issues/<N>.md`, base branch

The orchestrator skill manages everything from here: calibration → grooming → spec review → implementation → lead review → push & PR → CI → QA → finalize. It spawns the specialist agents (`grooming-agent`, `challenger`, `test-developer`, `release-agent`, `lead-reviewer`, `qa-engineer`, `ticket-writer`) as isolated sub-agents, but the orchestrator itself stays inline so it can surface decisions back to the user naturally.

Monitor progress at `.TemporaryItems/Issues/wp-rocket-e2e/issue-<N>-workflow-log.html`.
