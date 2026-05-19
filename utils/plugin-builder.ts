/**
 * @fileoverview
 * PluginBuilder — Orchestrates building WordPress plugin artifacts from Git references using APVM.
 *
 * This module provides a `PluginBuilder` class that wraps the `apvm-napi` library to build
 * WP Rocket and BackWPUp plugin zip artifacts for E2E testing. It supports resolving Git references
 * from environment variables (priority 0) with programmatic fallback arguments (priority 1).
 *
 * Usage in hooks:
 * ```typescript
 * await PluginBuilder.buildAll();
 * ```
 *
 * Environment variables (highest priority):
 * - `E2E_WPR_PREV`     — Git ref for the previous stable WP Rocket build
 * - `E2E_WPR_NEW`      — Git ref for the new release WP Rocket build
 * - `E2E_WPR_BACKWPUP` — Git ref for the BackWPUp Pro build
 *
 * Git ref formats (auto-detected by APVM):
 * - `"123"`            → PR #123
 * - `"pr:123"`         → Force PR
 * - `"branch:develop"` → Force branch
 * - `"tag:v1.0.0"`     → Force tag
 * - `"commit:a1b2c3d"` → Force commit SHA
 * - `"develop"`        → Branch (if matches)
 * - `"v1.0.0"`         → Tag (if exists), else branch
 *
 * @requires {@link apvm-napi} — APVM N-API bindings for building WordPress plugins.
 * @requires {@link node:fs/promises} — Node.js filesystem operations for artifact management.
 * @requires {@link node:path} — Node.js path utilities for safe path construction.
 *
 * @see https://github.com/wp-media/automation-plugin-version-manager — APVM source repository (cli/v2.0.1)
 */

import { Apvm, BuildOptions, JsBuildEvent, JsBuildOutput, JsProducedArtifact } from 'apvm-napi';
import { access, rm, rename } from 'node:fs/promises';
import path from 'node:path';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Defines a single plugin build target with its environment variable,
 * APVM project identifier, and output location.
 */
export interface PluginBuildDefinition {
    /** Human-readable name for logging (e.g. "WP Rocket new release"). */
    pluginName: string;

    /** APVM project identifier: "wp-rocket" or "backwpup". */
    project: string;

    /**
     * Environment variable name to read the Git ref from (priority 0).
     * If set, this value takes precedence over `fallbackRef`.
     */
    envVar: string;

    /**
     * Programmatic fallback Git ref (priority 1).
     * Used only when the corresponding environment variable is not set.
     * @default null
     */
    fallbackRef?: string | null;

    /** Absolute path where the final artifact zip should be stored. */
    targetPath: string;

    /**
     * Build variants (only relevant for BackWPUp).
     * @example ['pro-en']
     */
    variants?: string[];

    /**
     * Explicit version string (required for BackWPUp, auto-detected for WP Rocket).
     */
    version?: string;
}

/**
 * Optional overrides passed to `PluginBuilder.buildAll()` for programmatic control.
 * Each field corresponds to a fallback Git ref for the respective plugin.
 */
export interface PluginBuildOverrides {
    /** Fallback Git ref for WP Rocket previous stable. */
    previousStable?: string | null;

    /** Fallback Git ref for WP Rocket new release. */
    newRelease?: string | null;

    /** Fallback Git ref for BackWPUp Pro. */
    backwpup?: string | null;

    /** BackWPUp version string (required when building BackWPUp). */
    backwpupVersion?: string;
}

/**
 * Result of a single plugin build operation.
 */
export interface PluginBuildResult {
    /** Human-readable plugin name. */
    pluginName: string;

    /** The resolved Git reference that was built. */
    resolvedRef: string;

    /** Short commit SHA (7 characters). */
    commitShort: string;

    /** Human-readable description from APVM (e.g. "PR #42 @ abc1234"). */
    description: string;

    /** Built version string. */
    version: string;

    /** Total artifact size in bytes. */
    totalSize: number;

    /** Absolute path where the artifact was stored. */
    artifactPath: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Terminal Output Utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Determines whether the current stdout supports interactive TTY features
 * (in-place line updates via clearLine/cursorTo).
 *
 * Returns `false` when:
 * - stdout is piped to a file or another process
 * - Running inside a CI environment without TTY
 *
 * @see https://nodejs.org/docs/latest-v18.x/api/tty.html#writestreamisTTY
 */
const isTTY: boolean = Boolean(process.stdout.isTTY);

/**
 * Determines whether ANSI color codes should be emitted.
 *
 * Colors are disabled when:
 * - `NO_COLOR` env var is set (any value) — https://no-color.org/
 * - `NODE_DISABLE_COLORS` env var is set — Node.js convention
 * - stdout is not a TTY (piped output)
 *
 * @see https://nodejs.org/docs/latest-v18.x/api/tty.html#writestreamgetcolordepthenv
 */
const colorsEnabled: boolean = isTTY && !process.env.NO_COLOR && !process.env.NODE_DISABLE_COLORS;

/**
 * ANSI color codes for terminal output.
 * When colors are disabled, all codes resolve to empty strings for safe concatenation.
 */
const C = {
    reset: colorsEnabled ? '\x1b[0m' : '',
    bold: colorsEnabled ? '\x1b[1m' : '',
    dim: colorsEnabled ? '\x1b[2m' : '',
    green: colorsEnabled ? '\x1b[32m' : '',
    yellow: colorsEnabled ? '\x1b[33m' : '',
    blue: colorsEnabled ? '\x1b[34m' : '',
    cyan: colorsEnabled ? '\x1b[36m' : '',
    red: colorsEnabled ? '\x1b[31m' : '',
} as const;

/**
 * Clears the current terminal line and moves cursor to column 0.
 * No-op when stdout is not a TTY (safe to call unconditionally).
 *
 * Uses Node.js TTY WriteStream methods:
 * @see https://nodejs.org/docs/latest-v18.x/api/tty.html#writestreamclearlinedir-callback
 * @see https://nodejs.org/docs/latest-v18.x/api/tty.html#writestreamcursortox-y-callback
 */
function clearLine(): void {
    if (isTTY && typeof process.stdout.clearLine === 'function') {
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
    }
}

/**
 * Writes text to stdout without a trailing newline.
 * Used for in-place line updates in TTY mode.
 *
 * @param {string} text - The text to write.
 */
function write(text: string): void {
    process.stdout.write(text);
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Default BackWPUp version when not explicitly provided. */
const DEFAULT_BACKWPUP_VERSION = '5.99.99';

/** Default BackWPUp variants to build. */
const DEFAULT_BACKWPUP_VARIANTS = ['pro-en'];

// ─────────────────────────────────────────────────────────────────────────────
// PluginBuilder Class
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Orchestrates building WordPress plugin artifacts from Git references using APVM.
 *
 * The `PluginBuilder` class provides:
 * - Dual-source Git ref resolution (env vars priority 0, programmatic fallback priority 1)
 * - Compact, in-place progress output (TTY) with graceful CI fallback (non-TTY)
 * - Safe artifact file management (atomic move with cleanup)
 * - Token resolution from multiple sources (GITHUB_TOKEN, GH_TOKEN, gh CLI)
 * - Convenience static method `buildAll()` for single-call usage in test hooks
 *
 * @example
 * ```typescript
 * // In BeforeAll hook — simplest usage:
 * await PluginBuilder.buildAll();
 *
 * // With programmatic overrides (env vars still take priority):
 * await PluginBuilder.buildAll({ newRelease: 'branch:feature/new-thing' });
 * ```
 */
export class PluginBuilder {
    private apvm: Apvm;

    private constructor(apvm: Apvm) {
        this.apvm = apvm;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Static Entry Point
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Builds all configured plugins whose Git refs are available (via env vars or overrides).
     *
     * This is the primary entry point intended for use in the `BeforeAll` hook.
     * It resolves token authentication, determines which plugins need building,
     * and builds them sequentially with compact progress output.
     *
     * **Resolution priority for Git refs:**
     * 1. Environment variable (e.g. `E2E_WPR_NEW=branch:develop`)
     * 2. Programmatic override (e.g. `{ newRelease: 'branch:develop' }`)
     * 3. If neither is set, the plugin is skipped.
     *
     * @param {PluginBuildOverrides} [overrides] - Optional programmatic fallback refs.
     * @returns {Promise<PluginBuildResult[]>} Array of results for each successfully built plugin.
     * @throws {Error} If APVM initialization fails or a required build fails.
     *
     * @example
     * ```typescript
     * // CI usage (env vars set externally):
     * // E2E_WPR_NEW=tag:3.17.1 E2E_WPR_PREV=tag:3.16.4 npm run test:e2e
     * await PluginBuilder.buildAll();
     *
     * // Local development with explicit refs:
     * await PluginBuilder.buildAll({
     *     newRelease: 'branch:feature/my-feature',
     *     previousStable: 'tag:3.16.4'
     * });
     * ```
     */
    public static async buildAll(overrides: PluginBuildOverrides = {}): Promise<PluginBuildResult[]> {
        const workspaceRoot = process.env.PWD ?? process.cwd();
        const pluginOutputDir = path.resolve(workspaceRoot, 'plugin');

        const definitions: PluginBuildDefinition[] = [
            {
                pluginName: 'WP Rocket (previous stable)',
                project: 'wp-rocket',
                envVar: 'E2E_WPR_PREV',
                fallbackRef: overrides.previousStable ?? null,
                targetPath: path.join(pluginOutputDir, 'previous_stable.zip'),
            },
            {
                pluginName: 'WP Rocket (new release)',
                project: 'wp-rocket',
                envVar: 'E2E_WPR_NEW',
                fallbackRef: overrides.newRelease ?? null,
                targetPath: path.join(pluginOutputDir, 'new_release.zip'),
            },
            {
                pluginName: 'BackWPUp Pro',
                project: 'backwpup',
                envVar: 'E2E_WPR_BACKWPUP',
                fallbackRef: overrides.backwpup ?? null,
                targetPath: path.join(pluginOutputDir, 'backwpup-pro.zip'),
                variants: DEFAULT_BACKWPUP_VARIANTS,
                version: overrides.backwpupVersion ?? DEFAULT_BACKWPUP_VERSION,
            },
        ];

        // Determine which plugins have a Git ref to build
        const toBuild = definitions.filter(def => PluginBuilder.resolveGitRef(def.envVar, def.fallbackRef));

        if (toBuild.length === 0) {
            console.log(`${C.dim}[PluginBuilder] No plugin build refs configured — skipping builds.${C.reset}`);
            return [];
        }

        // Initialize APVM with automatic token resolution
        console.log(`\n${C.bold}${C.blue}\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510${C.reset}`);
        console.log(`${C.bold}${C.blue}\u2502  Plugin Builder \u2014 APVM Build Orchestrator   \u2502${C.reset}`);
        console.log(`${C.bold}${C.blue}\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518${C.reset}\n`);

        const builder = await PluginBuilder.create();

        // Log authentication status
        builder.logTokenStatus();

        // Build each plugin sequentially
        const results: PluginBuildResult[] = [];
        console.log(`${C.cyan}Building ${toBuild.length} plugin(s)...${C.reset}\n`);

        for (const definition of toBuild) {
            const result = await builder.build(definition);
            results.push(result);
        }

        // Summary
        PluginBuilder.logSummary(results);

        return results;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Factory
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Creates a new `PluginBuilder` instance with automatic GitHub token resolution.
     *
     * Token is resolved in order: GITHUB_TOKEN env → GH_TOKEN env → `gh auth token` → gh config file.
     *
     * @returns {Promise<PluginBuilder>} Initialized builder with APVM instance.
     * @throws {Error} If APVM fails to initialize (e.g. missing native binary for platform).
     */
    private static async create(): Promise<PluginBuilder> {
        try {
            const apvm = await Apvm.createWithTokenResolution();
            return new PluginBuilder(apvm);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            throw new Error(
                `[PluginBuilder] Failed to initialize APVM: ${message}\n` +
                `Ensure a GitHub token is available via GITHUB_TOKEN, GH_TOKEN, or gh CLI.`
            );
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Build
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Builds a single plugin artifact and moves it to the target path.
     *
     * Progress output uses in-place line updates when stdout is a TTY:
     * - Each phase occupies a single live line that updates with step labels
     * - Completed phases become permanent lines with a ✓ indicator
     * - A dot trail accumulates to show overall phase progress
     *
     * When stdout is NOT a TTY (CI, piped), falls back to simple line-per-phase logging.
     *
     * @param {PluginBuildDefinition} definition - The plugin build definition.
     * @returns {Promise<PluginBuildResult>} The build result with metadata.
     * @throws {Error} If the Git ref cannot be resolved, the build fails, or the artifact cannot be stored.
     */
    public async build(definition: PluginBuildDefinition): Promise<PluginBuildResult> {
        const { pluginName, project, envVar, fallbackRef, targetPath, variants, version } = definition;

        // Resolve Git ref (env var has priority)
        const gitRef = PluginBuilder.resolveGitRef(envVar, fallbackRef);
        if (!gitRef) {
            throw new Error(
                `[PluginBuilder] No Git ref found for "${pluginName}". ` +
                `Set env var ${envVar} or provide a fallback ref.`
            );
        }

        const refSource = process.env[envVar] ? `env:${envVar}` : 'argument';

        // Log build header
        console.log(`${C.bold}\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501${C.reset}`);
        console.log(`${C.bold}  Building: ${C.cyan}${pluginName}${C.reset}`);
        console.log(`${C.dim}  Git ref:  ${gitRef} (source: ${refSource})${C.reset}`);
        console.log(`${C.dim}  Target:   ${targetPath}${C.reset}`);
        if (variants?.length) {
            console.log(`${C.dim}  Variants: ${variants.join(', ')}${C.reset}`);
        }
        if (version) {
            console.log(`${C.dim}  Version:  ${version}${C.reset}`);
        }
        console.log(`${C.bold}\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501${C.reset}`);

        // Construct build options
        const buildOptions: BuildOptions = {
            project,
            gitRef,
            outputDir: path.dirname(targetPath),
        };

        if (variants?.length) {
            buildOptions.variants = variants;
        }
        if (version) {
            buildOptions.version = version;
        }

        // ── Progress state ──────────────────────────────────────────────────
        let currentPhase = '';
        let currentStepLabel = '';
        let failedPhase = '';
        let hasActiveLine = false; // Tracks if there's an in-place line to clear

        /**
         * Renders the current phase progress on a single line (TTY only).
         * In non-TTY mode this is a no-op; phases are logged line-by-line instead.
         */
        const renderActiveLine = (): void => {
            if (!isTTY) return;
            clearLine();
            const label = currentStepLabel
                ? `${C.blue}  \u25B6 ${currentPhase}: ${C.dim}${currentStepLabel}${C.reset}`
                : `${C.blue}  \u25B6 ${currentPhase}${C.reset}`;
            write(label);
            hasActiveLine = true;
        };

        /**
         * Finalizes the active line (prints newline) so subsequent output starts clean.
         */
        const finalizeActiveLine = (): void => {
            if (hasActiveLine) {
                write('\n');
                hasActiveLine = false;
            }
        };

        // ── APVM progress callback ─────────────────────────────────────────
        const onProgress = (_error: Error | null, event: JsBuildEvent): void => {
            if (_error) {
                finalizeActiveLine();
                console.error(`${C.red}  [error] ${_error.message}${C.reset}`);
                return;
            }

            switch (event.type) {
                case 'phase_started':
                    // If a previous phase's active line is still showing, finalize it
                    finalizeActiveLine();
                    currentPhase = event.phase ?? '';
                    currentStepLabel = event.message ?? '';

                    if (isTTY) {
                        renderActiveLine();
                    } else {
                        // Non-TTY: simple line per phase start
                        console.log(`  \u25B6 ${currentPhase}${event.message ? `: ${event.message}` : ''}`);
                    }
                    break;

                case 'phase_completed':
                    currentStepLabel = '';

                    if (isTTY) {
                        // Replace the active line with the completed marker
                        clearLine();
                        write(`${C.green}  \u2713 ${event.phase ?? currentPhase}${C.reset}\n`);
                        hasActiveLine = false;
                    } else {
                        console.log(`  \u2713 ${event.phase ?? currentPhase}`);
                    }
                    break;

                case 'step_started':
                    currentStepLabel = event.step?.label ?? '';
                    if (isTTY) {
                        renderActiveLine();
                    }
                    break;

                case 'step_completed':
                    // Step completed — just clear the label so dots update on next render
                    currentStepLabel = '';
                    if (isTTY) {
                        renderActiveLine();
                    }
                    break;

                case 'warning':
                    finalizeActiveLine();
                    console.log(`${C.yellow}  \u26A0 ${event.message}${C.reset}`);
                    break;

                case 'build_failed':
                    finalizeActiveLine();
                    failedPhase = currentPhase;
                    // Detailed failure output is handled in the catch block below
                    break;

                case 'build_succeeded':
                    finalizeActiveLine();
                    break;

                // 'command_output' intentionally not logged to keep output compact.
            }
        };

        // ── Execute build ───────────────────────────────────────────────────
        let buildOutput: JsBuildOutput;
        try {
            buildOutput = await this.apvm.build(buildOptions, onProgress);
        } catch (error) {
            finalizeActiveLine();
            const message = error instanceof Error ? error.message : String(error);

            // Pretty failure block
            console.error('');
            console.error(`${C.red}${C.bold}  \u2718 BUILD FAILED${C.reset}`);
            console.error(`${C.red}  Plugin:  ${pluginName}${C.reset}`);
            console.error(`${C.red}  Git ref: ${gitRef}${C.reset}`);
            if (failedPhase) {
                console.error(`${C.red}  Phase:   ${failedPhase}${C.reset}`);
            }
            console.error(`${C.red}  Error:   ${message}${C.reset}`);
            console.error('');

            throw new Error(
                `[PluginBuilder] Build failed for "${pluginName}" (ref: ${gitRef})`
                + (failedPhase ? ` during phase "${failedPhase}"` : '')
                + `:\n  ${message}`
            );
        }

        // Validate build output
        const artifact = this.selectArtifact(buildOutput, definition);

        // Move artifact to target path
        await this.moveArtifact(artifact.path, targetPath);

        // Log success (compact)
        const sizeKB = (artifact.size / 1024).toFixed(1);
        console.log(`${C.green}  \u2713 Artifact stored: ${path.basename(targetPath)} (${sizeKB} KB)${C.reset}`);
        console.log(`${C.dim}    ${buildOutput.description} | v${buildOutput.result.version} @ ${buildOutput.commitShort}${C.reset}\n`);

        return {
            pluginName,
            resolvedRef: buildOutput.resolvedRef.gitRef,
            commitShort: buildOutput.commitShort,
            description: buildOutput.description,
            version: buildOutput.result.version,
            totalSize: artifact.size,
            artifactPath: targetPath,
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private Helpers
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Resolves a Git ref from an environment variable (priority 0) or a fallback value (priority 1).
     *
     * @param {string} envVar - Environment variable name to check first.
     * @param {string | null | undefined} fallback - Fallback value if env var is not set.
     * @returns {string | null} The resolved Git ref, or null if neither source provides one.
     */
    private static resolveGitRef(envVar: string, fallback?: string | null): string | null {
        const envValue = process.env[envVar]?.trim();
        if (envValue) {
            return envValue;
        }
        return fallback?.trim() || null;
    }

    /**
     * Selects the appropriate artifact from the build output.
     * For single-variant builds (WP Rocket), takes the first artifact.
     * For multi-variant builds (BackWPUp), selects the matching variant.
     *
     * @param {JsBuildOutput} output - The APVM build output.
     * @param {PluginBuildDefinition} definition - The build definition for context.
     * @returns {JsProducedArtifact} The selected artifact.
     * @throws {Error} If no suitable artifact is found.
     */
    private selectArtifact(output: JsBuildOutput, definition: PluginBuildDefinition): JsProducedArtifact {
        const { artifacts, artifactCount } = output.result;

        if (artifactCount < 1 || !artifacts.length) {
            throw new Error(
                `[PluginBuilder] No artifacts produced for "${definition.pluginName}". ` +
                `Build may have succeeded but produced no output files.`
            );
        }

        // For multi-variant builds, try to match the requested variant
        if (definition.variants?.length && artifacts.length > 1) {
            const preferredVariant = definition.variants[0];
            const matched = artifacts.find(a => a.variantId === preferredVariant);
            if (matched) {
                return matched;
            }
            console.log(
                `${C.yellow}  \u26A0 Variant "${preferredVariant}" not found in artifacts, using first artifact.${C.reset}`
            );
        }

        return artifacts[0];
    }

    /**
     * Safely moves a build artifact to the target path.
     * Removes any existing file at the target path first to ensure a clean state.
     *
     * @param {string} sourcePath - Absolute path to the built artifact.
     * @param {string} targetPath - Absolute path where the artifact should be stored.
     * @throws {Error} If the source artifact doesn't exist or the move operation fails.
     */
    private async moveArtifact(sourcePath: string, targetPath: string): Promise<void> {
        // Verify source exists before attempting move
        try {
            await access(sourcePath);
        } catch {
            throw new Error(
                `[PluginBuilder] Built artifact not found at expected path: ${sourcePath}\n` +
                `The build reported success but the file is missing.`
            );
        }

        // Remove existing target (idempotent — no error if missing)
        await rm(targetPath, { force: true });

        // Move artifact to target location
        try {
            await rename(sourcePath, targetPath);
        } catch (renameError) {
            // rename() fails across filesystem boundaries; this shouldn't happen
            // in normal E2E setups but guard against it gracefully.
            const message = renameError instanceof Error ? renameError.message : String(renameError);
            throw new Error(
                `[PluginBuilder] Failed to move artifact to target path.\n` +
                `  Source: ${sourcePath}\n` +
                `  Target: ${targetPath}\n` +
                `  Error:  ${message}`
            );
        }
    }

    /**
     * Logs the token authentication status to help diagnose access issues.
     */
    private logTokenStatus(): void {
        const hasToken = this.apvm.hasToken();
        const tokenSource = this.apvm.tokenSource();

        if (hasToken) {
            console.log(`${C.green}  \u2713 GitHub token resolved${C.dim} (source: ${tokenSource})${C.reset}`);
        } else {
            console.log(`${C.yellow}  \u26A0 No GitHub token found \u2014 private repos will not be accessible.${C.reset}`);
            console.log(`${C.dim}    Set GITHUB_TOKEN or GH_TOKEN, or authenticate with: gh auth login${C.reset}`);
        }

        // Log available projects
        const projects = this.apvm.listProjects();
        console.log(`${C.dim}  Available projects: ${projects.join(', ')}${C.reset}\n`);
    }

    /**
     * Logs a formatted summary table of all build results.
     *
     * @param {PluginBuildResult[]} results - Array of completed build results.
     */
    private static logSummary(results: PluginBuildResult[]): void {
        console.log(`\n${C.bold}${C.blue}\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510${C.reset}`);
        console.log(`${C.bold}${C.blue}\u2502            Build Summary                    \u2502${C.reset}`);
        console.log(`${C.bold}${C.blue}\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518${C.reset}`);

        for (const result of results) {
            const sizeKB = (result.totalSize / 1024).toFixed(1);
            console.log(
                `  ${C.green}\u2713${C.reset} ${C.bold}${result.pluginName}${C.reset}` +
                `${C.dim} \u2014 v${result.version} @ ${result.commitShort} (${sizeKB} KB)${C.reset}`
            );
            console.log(`    ${C.dim}${result.description}${C.reset}`);
            console.log(`    ${C.dim}\u2192 ${result.artifactPath}${C.reset}`);
        }

        console.log('');
    }
}
