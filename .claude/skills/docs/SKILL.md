---
name: docs
description: >
  Update developer-facing documentation of wp-rocket-e2e to reflect changes on the current
  branch. Runs as an inline skill inside test-developer (step 2.5 of the internal sequence)
  after implementation and before DOD. Receives the explicit list of changed files from the
  implementation agent. Updates README.md, src/backwpup/README.md and
  .github/copilot-instructions.md when a change adds a tag, npm script, config key, hook
  behaviour, shared helper or site prerequisite. No-op otherwise.
---

# DOCS SKILL

You are a technical writer updating internal developer documentation for the WP Rocket E2E
suite. This skill runs inline inside the implementation agent and receives the list of
changed files explicitly — do not infer scope from git.

The "public surface" of this repo is whatever another engineer (or another AI agent) needs
to run and extend the suite: tags, npm scripts, config keys, hook behaviour, shared helpers,
and what must exist on the test site.

---

## When to run / when to skip

**Run this skill if the implementation touched any of the following:**

- A new or renamed **tag** on a feature/scenario (e.g. `@mynewfeature`)
- A new or changed **npm script** in `package.json` (`test:<tag>`, utilities), or a change to which tags `test:e2e` excludes
- A new or changed **config key** in `config/wp.config.sample.ts`, or a new environment variable the suite reads (e.g. `E2E_WPR_NEW_REF`, `npm_config_*`)
- A new or changed **hook behaviour** in `src/support/hooks.ts` / `src/backwpup/support/hooks.ts` (tag-scoped `Before`/`After`, `BeforeAll` setup, `PageUtils.cleanUp()`)
- A new or changed **shared helper** — `PageUtils` method, `utils/commands.ts` wrapper, `utils/helpers.ts` export — or a new **section/option** in `src/common/sections.ts`
- A new **site prerequisite** — plugin zip in `plugin/`, helper/third-party plugin, theme, external service account
- A change to `cucumber.json` profiles, report paths, or retry/parallel defaults

**Skip this skill (return no-op) if:**

- Only feature-specific scenarios/steps/selectors changed, using existing tags and scripts
- A flaky/broken step was fixed without changing its wording, parameters or side effects
- Only `.claude/`, `.github/workflows/`, lockfile, or `src/specs/**` (legacy, not run) changed
- Spec explicitly flags "no public surface change"

When skipping, return:
```json
{ "status": "SKIP", "reason": "No tag, npm script, config key, hook behaviour, shared helper or prerequisite change" }
```

---

## Process

### Step 1 — Read the changed files

Use the Read tool on the explicit list provided by the implementation agent. Do not run
`git diff` to discover scope — the agent already knows what changed.

Identify:
- New/renamed/removed tags (`grep -n "^\s*@" <feature files>`)
- New/changed/removed npm scripts (`package.json` `"scripts"`)
- New/changed config keys (`config/wp.config.sample.ts`) and env vars (`process.env.*`)
- New/changed hooks and their tag filters
- New/changed exported helpers and `PageUtils` public methods
- New prerequisites (zips, plugins, themes, services)
- Removed items (document as removed — delete stale doc lines, don't leave them behind)

### Step 2 — Review existing documentation

```bash
ls -la README.md src/backwpup/README.md .github/copilot-instructions.md
```

Read the relevant parts. Where things live today:

| Topic | File / section |
|---|---|
| Tags list (common, feature-specific, BackWPup) | `.github/copilot-instructions.md` → "Cucumber/Gherkin Standards" → "Common tags" |
| npm scripts | `.github/copilot-instructions.md` → "Test Execution Commands" |
| Config keys / env vars | `.github/copilot-instructions.md` → "Configuration Management"; setup steps in `README.md` → "Configuration" |
| Hook order and behaviour | `.github/copilot-instructions.md` → "Hook Execution Order" |
| Helpers (`PageUtils`, `utils/commands.ts`, `utils/helpers.ts`) | `.github/copilot-instructions.md` → "WordPress-Specific Patterns", "SSH & Remote Operations", "Common Patterns & Utilities" |
| Plugin zips / site prerequisites | `README.md` → "Requirements"; `.github/copilot-instructions.md` → "Plugin Files" |
| BackWPup tests, credentials, tags | `src/backwpup/README.md` |
| Troubleshooting | `.github/copilot-instructions.md` → "Troubleshooting" |

Verify against the current code before trusting a doc line — some may already have drifted.

### Step 3 — Identify gaps

For each public-surface change:
- Is it documented? Is the existing doc current?
- Which file/section should it go in (table above)? Prefer extending an existing list over creating a new section.
- Does the change make an existing line wrong (renamed script, removed tag, changed hook behaviour)? Fix it.

### Step 4 — Update documentation

For each gap:
1. Edit the correct existing file/section. Do not create new doc files unless a whole new area (comparable to `src/backwpup/README.md`) was added.
2. Write or update the content.
3. Stage the changes alongside the implementation commit (the implementation agent
   handles the actual `git add` / `git commit`).

**Style guidelines:**

- Purpose: help engineers run the right scenarios and find the relevant code fast
- Tone: neutral, technical, not promotional
- Structure: match the surrounding format (bullet lists of `` `@tag` - description ``, code blocks of `npm run …` with a trailing comment)
- Length: concise — one line per tag/script/key; a short example only for a new helper
- Reference helpers by name and file (`PageUtils.cleanUp()` in `utils/page-utils.ts`) rather than pasting their code
- Document the **current state**, not the change history
- **Never put real values** for credentials, API keys, SSH users/hosts/keys, or private site URLs in docs — key names and placeholders only

### Step 5 — Return

```json
{
  "status": "DONE|SKIP",
  "files_updated": [".github/copilot-instructions.md", "README.md"],
  "files_created": [],
  "reason": "Populated if SKIP"
}
```

---

## wp-rocket-e2e-specific notes

- `.github/copilot-instructions.md` is the main developer guide (it is also what Copilot agents read) — most updates land there. Editing it is allowed when this skill is invoked for a PR's own public-surface change.
- `README.md` is the onboarding doc (requirements, installation, configuration, running, reporting). Touch it only for setup/prerequisite/run-command changes.
- A new `config/wp.config.sample.ts` key triggers a Slack notification on merge to `develop` (`notify-config-change.yml`) — make sure the key is documented so people know what to set in their local `wp.config.ts`.
- A new tag normally comes with a `test:<tag>` npm script; document both together, and note if the tag is excluded from `test:e2e`.
