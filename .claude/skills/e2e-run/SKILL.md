---
name: e2e-run
description: Run wp-rocket-e2e Cucumber scenarios safely against the configured test site — prerequisites check, dry-run, targeted run by tag or name with --retry 0, and report reading. Returns PASS/FAIL/SKIP JSON. Invoked by grooming-agent (probe), test-developer and qa-engineer.
---

# E2E-RUN SKILL

Runs real scenarios against the WordPress site configured in `config/wp.config.ts`. There is no local app to boot in this repo: the target is a remote, Docker or local WordPress site reached through Playwright (browser) and SSH/WP-CLI (`utils/commands.ts`).

**Invokers:**
- `grooming-agent` — probe current behaviour before writing the spec: run the one existing scenario closest to the issue (or a dry-run if none exists) to confirm what the suite does today.
- `test-developer` — validate new/changed scenarios before committing (`--retry 0`).
- `qa-engineer` — validate a PR's scenarios and the neighbouring ones that share steps or hooks.

## Anti-rationalization table

| You'll be tempted to say | Why you can't |
|---|---|
| "The site is probably not configured, I'll skip" | Check `config/wp.config.ts` and run `npm run healthcheck`. Only report `SKIP` with the concrete failing check. |
| "The dry-run passed, so the scenario works" | A dry-run only resolves step definitions. It proves nothing about behaviour. `scenarios_tested` lists only scenarios that really ran. |
| "It passed on the second attempt, good enough" | The default profile retries 3 times and hides flakiness. Always run with `--retry 0` when validating. |
| "The exit code was non-zero, so it failed" | On Node 24 cucumber can crash on teardown after finishing. Read the summary and the JSON report. |
| "I'll point it at a quick production site to test" | Never. Scenarios install/delete plugins and change settings. Use only the site the user configured for testing. |

## Process

### 1. Config file present

```bash
test -f config/wp.config.ts || echo "MISSING config/wp.config.ts"
```

`config/wp.config.ts` is gitignored, so each person's copy points at their own test site. Never create it with guessed values.

**Running in a git worktree** (`git rev-parse --git-dir` differs from `git rev-parse --git-common-dir`): the worktree has no `config/wp.config.ts`. The main checkout's copy is at `$(git worktree list --porcelain | head -1 | cut -d' ' -f2)/config/wp.config.ts`. **Ask the user before copying it** into the worktree. If they agree, copy it, never stage or commit it, and delete it when the run is finished (unless the user says to keep it). If they decline or there is no copy, report `SKIP` ("config/wp.config.ts missing").

### 2. Choose the environment

Pick the target from `WP_ENV_TYPE` in `config/wp.config.ts`. Read only the keys named below, never the whole file:

```bash
grep -E "WP_ENV_TYPE *=" config/wp.config.ts
grep -oE "https?://[^/'\"]+" config/wp.config.ts | sort -u   # hostnames only
grep -E "WP_DOCKER_CONTAINER *=" config/wp.config.ts           # docker only
```

| `WP_ENV_TYPE` | Use it when | How to run |
|---|---|---|
| `external` | The live URL is a disposable e2e test site (not production/customer) and the health check passes. | Make sure `npm_config_env` is **not** set, so the `live` URL and credentials are used. |
| `docker` | The container named in `WP_DOCKER_CONTAINER` is running (`docker ps --format '{{.Names}}'` lists it) and the health check passes. The container must already hold the e2e environment snapshot. | Set `npm_config_env=local` on the health check and every real run, so the `local` URL and credentials are used. |
| anything else (empty/local, docker container not running, URL looks like production) | — | `SKIP` with the reason, e.g. "no usable test site: point config/wp.config.ts at your e2e site, or start a docker site loaded with the e2e snapshot". |

Never build a fresh WordPress (docker, `wp-env`) to run against: scenarios depend on the e2e environment snapshot (pages in `config/scenarioUrls.json`, themes, the helper and template-loader plugins, pre-installed helper plugins). A blank site produces false failures. Tell the caller which environment type was used (`external` or `docker`), without credentials.

### 3. Other prerequisites (no side effects)

```bash
ls plugin/*.zip
node --version
```

- Never print, log, quote or commit values from `config/wp.config.ts` (`WP_PASSWORD*`, `WP_SSH_*`, `IMAGIFY_INFOS`, `BACKWPUP_INFOS`). To inspect which keys are set, list key names only. Do not paste the site URL into reports beyond what is needed.
- Plugin zips the scenarios need (`new_release.zip`, `previous_stable.zip`, version zips for upgrade tests, the helper plugin) must be in `plugin/` (gitignored). If the targeted scenario needs one that is absent: `SKIP` with the file name.
- Confirm the target is a disposable test site, not a production/customer site. If unsure, stop and ask.
- `node_modules` present (`npm ci` otherwise).

### 4. Health check

```bash
npm run healthcheck                      # external
npm_config_env=local npm run healthcheck # docker
```

It runs WP-CLI over the configured transport and opens a browser (headed by default). If it fails (SSH refused, WP-CLI not running, site unreachable): `SKIP` with the reason. Do not block the pipeline.

### 5. Dry-run first

```bash
npx cucumber-js -p default --dry-run --tags "<expr>"
# or by name
npx cucumber-js -p default --dry-run --name "<scenario name>"
```

Catches undefined and ambiguous steps and tag-expression typos without touching the site. Zero matching scenarios means the tag/name is wrong — fix it before a real run. Any undefined/ambiguous step is a `FAIL` (for new code) before running anything.

### 6. Targeted real run — `--retry 0`

Run the smallest selection that covers the change. Never the whole `test:e2e` suite.

```bash
node ./node_modules/@cucumber/cucumber/bin/cucumber-js -p default --retry 0 --tags "@mytag"
node ./node_modules/@cucumber/cucumber/bin/cucumber-js -p default --retry 0 --name "<exact scenario name>"
# docker environment: prefix with npm_config_env=local
```

(`npm run test:tags --tags="@mytag"` and `npm run test:scenario --scenario="<name>"` also work if you append `-- --retry 0`; the `node ...` form above is the unambiguous one for validating.)

Notes:
- `parallel` is 1: scenarios share one site. Do not run two cucumber processes against the same site at once — they will corrupt each other's plugin and settings state.
- Browsers launch headed (`headless: false`); on a machine without a display use `xvfb-run`. If no browser can start: `SKIP`.
- Visual regression (`@vr`) needs `--wproption`: `npm run test:vr --wproption=<optionName>`; it also needs BackstopJS references. Run it only when the change touches `@vr`.
- A scenario may take minutes (plugin install, preload, cron). Run in the background and poll the report rather than killing it early.

### 7. Read the results

Use the cucumber summary printed at the end and `test-results/cucumber-report.json` (HTML: `test-results/cucumber-report.html`; failures also write `@rerun.txt`; screenshots/videos in `test-results/`).

```bash
node -e '
const r=require("./test-results/cucumber-report.json");
for(const f of r) for(const s of f.elements||[]) {
  const st=(s.steps||[]).map(x=>x.result.status);
  console.log((st.every(x=>x==="passed")?"PASS":"FAIL")+"  "+f.name+" :: "+s.name);
}'
```

For a failing scenario, find the first non-passed step and its `error_message`, and check the screenshot in `test-results/`. If the After hook renamed the site's `debug.log` to `debug-<scenario>.log`, a PHP error occurred on the site — mention it.

**Node 24 teardown crash:** the cucumber process can segfault or exit nonzero on teardown even when every scenario finished. Judge by the summary line and the JSON report, not the exit code alone. If the JSON report is missing or older than the run (check mtime), the run did not complete: investigate instead of reporting PASS.

### 8. Report

```json
{
  "status": "PASS|FAIL|SKIP",
  "scenarios_tested": ["Scenario name (tag) — passed", "Scenario name (tag) — failed at step '...'"],
  "details": "Environment (external|docker), command run (tags/name, --retry 0), counts passed/failed, first failing step and error, report path. No credentials."
}
```

- `PASS`: all selected scenarios passed in a real run with `--retry 0`.
- `FAIL`: at least one scenario failed, or a step is undefined/ambiguous.
- `SKIP`: prerequisites or health check failed; state which one. A `SKIP` is not a pass — callers must report it as unverified.

## Boundaries

- Do: run only the scenarios relevant to the spec or PR, plus one neighbour when shared steps/hooks changed.
- Do: tell the caller about side effects (installed/removed plugins, changed options, theme/permalink switches) if a run aborted mid-way and the site may need cleanup.
- Do not: run the full suite, `npm run test:e2e` (it also pushes reports via `push-report`), or `push-report`.
- Do not: edit `config/wp.config.ts`, print its secrets, or commit `test-results/`, `@rerun.txt`, `plugin/*.zip`.
- Do not: hide a failure by raising retries, timeouts or adding tag exclusions. Report it.
