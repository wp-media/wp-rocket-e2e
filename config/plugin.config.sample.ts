/**
 * @fileoverview
 * Plugin version configuration sample for WP Rocket E2E tests.
 * Copy this file to plugin.config.ts and update with your desired versions.
 * 
 * The plugin manager will automatically download or build the specified versions
 * if they are not already present in the plugin/ directory.
 */

export interface PluginVersionConfig {
    /**
     * Previous stable release version.
     * This will be used for upgrade/downgrade tests.
     * 
     * Can be:
     * - A version number (e.g., '3.16.0') - will download from WP Rocket releases
     * - A GitHub branch name prefixed with 'branch:' (e.g., 'branch:release/3.16.0')
     * - A GitHub tag prefixed with 'tag:' (e.g., 'tag:3.16.0')
     * - A URL pointing to a zip file
     */
    previousStable: string;

    /**
     * New release version.
     * This is the main version being tested.
     * 
     * Can be:
     * - A version number (e.g., '3.16.1') - will download from WP Rocket releases
     * - A GitHub branch name prefixed with 'branch:' (e.g., 'branch:develop')
     * - A GitHub tag prefixed with 'tag:' (e.g., 'tag:3.16.1')
     * - A URL pointing to a zip file
     */
    newRelease: string;

    /**
     * GitHub repository information for building from branches.
     * Only required if using branch: or tag: prefixes.
     */
    repository?: {
        owner: string;
        name: string;
        /**
         * Personal Access Token for GitHub API (if needed for private repos or rate limits).
         * Can also be set via GITHUB_TOKEN environment variable.
         */
        token?: string;
    };
}

/**
 * Plugin version configuration.
 * 
 * @example
 * // Using version numbers (will download from releases)
 * export const pluginConfig: PluginVersionConfig = {
 *     previousStable: '3.16.0',
 *     newRelease: '3.16.1',
 * };
 * 
 * @example
 * // Using GitHub branches
 * export const pluginConfig: PluginVersionConfig = {
 *     previousStable: 'branch:release/3.16.0',
 *     newRelease: 'branch:develop',
 *     repository: {
 *         owner: 'wp-media',
 *         name: 'wp-rocket',
 *         token: process.env.GITHUB_TOKEN
 *     }
 * };
 * 
 * @example
 * // Using direct URLs
 * export const pluginConfig: PluginVersionConfig = {
 *     previousStable: 'https://example.com/wp-rocket-3.16.0.zip',
 *     newRelease: 'https://example.com/wp-rocket-3.16.1.zip',
 * };
 */
export const pluginConfig: PluginVersionConfig = {
    // Configure the versions you want to test here
    previousStable: '3.20.1',  // Previous stable version
    
    // NOTE: Pre-release (beta) versions like '3.20.2-beta5' may not be available at the standard release URL.
    // If you need to test a beta version, use a direct URL or a GitHub tag/branch instead (see examples above).
    newRelease: '3.20.2',      // Latest stable version to test
    
    // Optional: Configure GitHub repository for branch-based builds
    repository: {
        owner: 'wp-media',
        name: 'wp-rocket',
        token: process.env.GITHUB_TOKEN,
    }
};
