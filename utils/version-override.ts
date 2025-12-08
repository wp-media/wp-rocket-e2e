/**
 * @fileoverview
 * Runtime plugin version override system for WP Rocket E2E tests.
 * Allows passing plugin versions via CLI arguments without modifying config files.
 * 
 * @example
 * # Override previous_stable version
 * npm run test:e2e -- --previous-stable=3.16.0
 * 
 * @example
 * # Override new_release version
 * npm run test:e2e -- --new-release=branch:develop
 * 
 * @example
 * # Override both versions
 * npm run test:e2e -- --previous-stable=3.16.0 --new-release=3.16.1
 */

/**
 * Interface for version overrides from CLI arguments.
 */
export interface VersionOverrides {
    previousStable?: string;
    newRelease?: string;
    specificVersion?: string;
}

/**
 * Interface for plugin version configuration (imported type).
 */
export interface PluginVersionConfig {
    previousStable: string;
    newRelease: string;
    specificVersion?: string;
    repository?: {
        owner: string;
        name: string;
        token?: string;
    };
}

/**
 * Extracts version overrides from npm config environment variables.
 * 
 * @param {VersionOverrides} overrides - Overrides object to populate
 * @return {void}
 */
function extractFromNpmConfig(overrides: VersionOverrides): void {
    if (process.env.npm_config_previous_stable) {
        overrides.previousStable = process.env.npm_config_previous_stable;
    }
    if (process.env.npm_config_new_release) {
        overrides.newRelease = process.env.npm_config_new_release;
    }
    if (process.env.npm_config_specific_version) {
        overrides.specificVersion = process.env.npm_config_specific_version;
    }
}

/**
 * Extracts version overrides from direct environment variables.
 * 
 * @param {VersionOverrides} overrides - Overrides object to populate
 * @return {void}
 */
function extractFromEnv(overrides: VersionOverrides): void {
    if (process.env.PREVIOUS_STABLE) {
        overrides.previousStable = process.env.PREVIOUS_STABLE;
    }
    if (process.env.NEW_RELEASE) {
        overrides.newRelease = process.env.NEW_RELEASE;
    }
    if (process.env.SPECIFIC_VERSION) {
        overrides.specificVersion = process.env.SPECIFIC_VERSION;
    }
}

/**
 * Parses a command line argument in --key=value or --key value format.
 * 
 * @param {string} arg - The argument to parse
 * @param {string[]} args - All arguments array
 * @param {number} index - Current index in args array
 * @param {VersionOverrides} overrides - Overrides object to populate
 * @return {number} Number of arguments consumed (0 or 1 additional)
 */
// eslint-disable-next-line complexity
function parseArgument(arg: string, args: string[], index: number, overrides: VersionOverrides): number {
    if (!arg.startsWith('--')) {
        return 0;
    }
    
    const match = arg.match(/^--([^=]+)(?:=(.+))?$/);
    if (!match) {
        return 0;
    }
    
    const [, key, value] = match;
    const normalizedKey = key.toLowerCase().replace(/-/g, '');
    
    // Get value from next arg if not in --arg=value format
    const argValue = value || args[index + 1];
    if (!argValue) {
        return 0;
    }
    
    const consumed = value ? 0 : 1;
    
    if (normalizedKey === 'previousstable') {
        overrides.previousStable = argValue;
        return consumed;
    } else if (normalizedKey === 'newrelease') {
        overrides.newRelease = argValue;
        return consumed;
    } else if (normalizedKey === 'specificversion') {
        overrides.specificVersion = argValue;
        return consumed;
    }
    
    return 0;
}

/**
 * Extracts version overrides from process.argv command line arguments.
 * 
 * @param {VersionOverrides} overrides - Overrides object to populate
 * @return {void}
 */
function extractFromArgv(overrides: VersionOverrides): void {
    const args = process.argv.slice(2);
    for (let i = 0; i < args.length; i++) {
        const consumed = parseArgument(args[i], args, i, overrides);
        i += consumed;
    }
}

/**
 * Parses CLI arguments to extract plugin version overrides.
 * Supports multiple formats:
 * - npm config style: --previous-stable=3.16.0 (via npm_config_previous_stable)
 * - process.argv style: --previous-stable=3.16.0
 * - environment variables: PREVIOUS_STABLE=3.16.0
 * 
 * @return {VersionOverrides} Parsed version overrides
 */
export function parseVersionOverrides(): VersionOverrides {
    const overrides: VersionOverrides = {};
    
    // Check npm config variables (when using npm run test:e2e -- --arg=value)
    extractFromNpmConfig(overrides);
    
    // Also check direct environment variables
    extractFromEnv(overrides);
    
    // Parse process.argv for direct arguments
    extractFromArgv(overrides);
    
    return overrides;
}

/**
 * Applies version overrides to plugin configuration.
 * 
 * @param {PluginVersionConfig} baseConfig - Base configuration from config file
 * @param {VersionOverrides} overrides - Version overrides from CLI/env
 * @return {PluginVersionConfig} Merged configuration with overrides applied
 */
export function applyVersionOverrides(
    baseConfig: PluginVersionConfig,
    overrides: VersionOverrides
): PluginVersionConfig {
    return {
        ...baseConfig,
        previousStable: overrides.previousStable || baseConfig.previousStable,
        newRelease: overrides.newRelease || baseConfig.newRelease,
        specificVersion: overrides.specificVersion || baseConfig.specificVersion,
    };
}

/**
 * Checks if any version overrides are present.
 * 
 * @param {VersionOverrides} overrides - Version overrides to check
 * @return {boolean} True if any overrides are present
 */
export function hasVersionOverrides(overrides: VersionOverrides): boolean {
    return !!(
        overrides.previousStable ||
        overrides.newRelease ||
        overrides.specificVersion
    );
}

/**
 * Formats version overrides for display.
 * 
 * @param {VersionOverrides} overrides - Version overrides to format
 * @return {string} Formatted string of overrides
 */
export function formatVersionOverrides(overrides: VersionOverrides): string {
    const lines: string[] = [];
    
    if (overrides.previousStable) {
        lines.push(`  previous_stable: ${overrides.previousStable}`);
    }
    if (overrides.newRelease) {
        lines.push(`  new_release: ${overrides.newRelease}`);
    }
    if (overrides.specificVersion) {
        lines.push(`  specific_version: ${overrides.specificVersion}`);
    }
    
    return lines.length > 0 ? lines.join('\n') : '  (none)';
}
