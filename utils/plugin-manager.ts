/**
 * @fileoverview
 * Plugin Manager for WP Rocket E2E tests.
 * Automatically downloads or builds WP Rocket plugin versions based on configuration.
 * 
 * @requires {@link ../config/plugin.config}
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { exec } from 'child_process';
import { promisify } from 'util';
import { parseVersionOverrides, applyVersionOverrides, hasVersionOverrides, formatVersionOverrides } from './version-override';
import type { VersionOverrides } from './version-override';

const execAsync = promisify(exec);

// Gracefully handle missing config/plugin.config.ts
let basePluginConfig: PluginVersionConfig;

try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const config = require('../config/plugin.config');
    basePluginConfig = config.pluginConfig;
} catch (error) {
    console.error('❌ Plugin configuration not found!');
    console.error('Please copy config/plugin.config.sample.ts to config/plugin.config.ts and configure your plugin versions.');
    process.exit(1);
}

// Import type separately
import type { PluginVersionConfig } from '../config/plugin.config';

/**
 * Gets the active plugin configuration with any CLI overrides applied.
 * 
 * @param {VersionOverrides} overrides - Optional version overrides to apply
 * @return {PluginVersionConfig} Active plugin configuration
 */
function getActivePluginConfig(overrides?: VersionOverrides): PluginVersionConfig {
    const runtimeOverrides = overrides || parseVersionOverrides();
    
    if (hasVersionOverrides(runtimeOverrides)) {
        return applyVersionOverrides(basePluginConfig, runtimeOverrides);
    }
    
    return basePluginConfig;
}

/**
 * Plugin file mapping for different versions.
 */
const PLUGIN_FILES: Record<string, string> = {
    previousStable: 'previous_stable.zip',
    newRelease: 'new_release.zip',
    specificVersion: 'wp-rocket_3.10.9.zip',
};

/**
 * Plugin directory where zip files are stored.
 */
const PLUGIN_DIR = path.join(process.cwd(), 'plugin');

/**
 * Temporary directory for building plugins.
 */
const TEMP_DIR = path.join(process.cwd(), '.tmp-plugin-build');

/**
 * Global flag to track whether to force rebuild.
 * Used internally by processVersion to check against CLI/hook parameter.
 */
let shouldForceRebuild = false;

/**
 * Ensures the plugin directory exists.
 * 
 * @return {Promise<void>}
 */
async function ensurePluginDir(): Promise<void> {
    if (!fs.existsSync(PLUGIN_DIR)) {
        fs.mkdirSync(PLUGIN_DIR, { recursive: true });
    }
}

/**
 * Checks if a plugin file exists.
 * 
 * @param {string} filename - Plugin filename to check
 * @return {boolean} True if file exists
 */
function pluginFileExists(filename: string): boolean {
    return fs.existsSync(path.join(PLUGIN_DIR, filename));
}

/**
 * Downloads a file from a URL.
 * 
 * @param {string} url - URL to download from
 * @param {string} destination - Destination file path
 * @return {Promise<void>}
 */
async function downloadFile(url: string, destination: string): Promise<void> {
    // Validate destination is within allowed directory
    const resolvedDest = path.resolve(destination);
    const pluginDir = path.resolve(PLUGIN_DIR);
    if (!resolvedDest.startsWith(pluginDir + path.sep)) {
        throw new Error('Invalid destination path: must be within plugin directory');
    }
    
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(destination);
        
        https.get(url, (response) => {
            // Handle redirects
            if (response.statusCode === 301 || response.statusCode === 302) {
                file.close();
                fs.unlinkSync(destination);
                const redirectUrl = response.headers.location;
                if (!redirectUrl) {
                    return reject(new Error('Redirect response missing Location header'));
                }
                return downloadFile(redirectUrl, destination)
                    .then(resolve)
                    .catch(reject);
            }

            if (response.statusCode !== 200) {
                file.close();
                fs.unlinkSync(destination);
                return reject(new Error(`Failed to download: ${response.statusCode} ${response.statusMessage}`));
            }

            response.pipe(file);

            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            file.close();
            try {
                fs.unlinkSync(destination);
            } catch {
                // File may not exist, ignore
            }
            reject(err);
        });
    });
}

/**
 * Downloads a plugin version from WP Rocket releases.
 * Note: This assumes public access to releases. Adjust if authentication is needed.
 * 
 * @param {string} version - Version number (e.g., '3.16.0')
 * @param {string} destination - Destination file path
 * @return {Promise<void>}
 */
async function downloadFromReleases(version: string, destination: string): Promise<void> {
    // Validate version format: allow alphanumeric, dots, underscores, and hyphens
    if (!/^[\w.-]+$/.test(version)) {
        throw new Error(`Invalid version format: ${version}`);
    }
    
    // This URL structure may need to be adjusted based on actual WP Rocket release hosting
    // For now, this is a placeholder structure
    const url = `https://wp-rocket.me/releases/wp-rocket_${version}.zip`;
    
    console.log(`Downloading WP Rocket ${version} from releases...`);
    await downloadFile(url, destination);
    console.log(`✓ Downloaded WP Rocket ${version}`);
}

/**
 * Sanitizes a string for use in shell commands.
 * Validates against allowed patterns to prevent command injection.
 * 
 * @param {string} input - Input string to sanitize
 * @param {string} type - Type of input ('ref', 'path', or 'url')
 * @return {string} Sanitized string
 */
function sanitizeShellInput(input: string, type: 'ref' | 'path' | 'url'): string {
    if (type === 'ref') {
        // Branch/tag names should only contain safe characters
        if (!/^[a-zA-Z0-9/_.-]+$/.test(input)) {
            throw new Error(`Invalid ref name: ${input}. Only alphanumeric, /, _, ., and - are allowed.`);
        }
    } else if (type === 'path') {
        // Paths should not contain suspicious patterns
        if (input.includes(';') || input.includes('|') || input.includes('&') || input.includes('`')) {
            throw new Error(`Invalid path: ${input}. Contains suspicious characters.`);
        }
    } else if (type === 'url') {
        // URLs should start with https://
        if (!input.startsWith('https://') && !input.startsWith('http://')) {
            throw new Error(`Invalid URL: ${input}. Must start with http:// or https://.`);
        }
    }
    return input;
}

/**
 * Clones and builds a plugin from a GitHub branch or tag.
 * 
 * @param {string} ref - Branch or tag name
 * @param {string} destination - Destination zip file path
 * @param {PluginVersionConfig['repository']} repo - Repository configuration
 * @return {Promise<void>}
 */
async function buildFromGitHub(
    ref: string,
    destination: string,
    repo?: PluginVersionConfig['repository']
): Promise<void> {
    if (!repo) {
        throw new Error('Repository configuration is required for building from GitHub branches/tags');
    }

    // Validate inputs to prevent command injection
    const sanitizedRef = sanitizeShellInput(ref, 'ref');
    const sanitizedDestination = sanitizeShellInput(destination, 'path');
    
    const { owner, name, token } = repo;
    
    // Use git credential helper or SSH instead of embedding token in URL
    // Note: For security, consider using SSH keys or git credential helpers
    const repoUrl = `https://github.com/${owner}/${name}.git`;
    
    // Clean up temp directory if it exists
    if (fs.existsSync(TEMP_DIR)) {
        await execAsync(`rm -rf "${TEMP_DIR}"`);
    }
    
    fs.mkdirSync(TEMP_DIR, { recursive: true });
    
    try {
        console.log(`Building WP Rocket from ${ref}...`);
        
        // Clone the repository
        console.log('  Cloning repository...');
        
        // If token provided, configure git credential for this clone operation
        let cloneCmd = `git clone --depth 1 --branch "${sanitizedRef}" ${repoUrl} "${TEMP_DIR}"`;
        if (token) {
            // Use GIT_ASKPASS to provide token securely without exposing in URL
            const tokenFile = path.join(TEMP_DIR, '..', '.git-credentials-temp');
            fs.writeFileSync(tokenFile, `https://${token}:x-oauth-basic@github.com`, { mode: 0o600 });
            cloneCmd = `GIT_TERMINAL_PROMPT=0 git -c credential.helper="store --file=${tokenFile}" clone --depth 1 --branch "${sanitizedRef}" ${repoUrl} "${TEMP_DIR}"`;
            
            try {
                await execAsync(cloneCmd);
            } finally {
                // Clean up credential file immediately after clone
                if (fs.existsSync(tokenFile)) {
                    fs.unlinkSync(tokenFile);
                }
            }
        } else {
            await execAsync(cloneCmd);
        }
        
        // Check if composer.json exists and install dependencies
        const composerFile = path.join(TEMP_DIR, 'composer.json');
        if (fs.existsSync(composerFile)) {
            console.log('  Installing Composer dependencies...');
            await execAsync(`cd "${TEMP_DIR}" && composer install --no-dev --optimize-autoloader`);
        }
        
        // Check if package.json exists and build assets
        const packageFile = path.join(TEMP_DIR, 'package.json');
        if (fs.existsSync(packageFile)) {
            console.log('  Building assets...');
            await execAsync(`cd "${TEMP_DIR}" && npm install && npm run build`);
        }
        
        // Create zip file
        console.log('  Creating zip file...');
        const tempParent = path.dirname(TEMP_DIR);
        const tempBasename = path.basename(TEMP_DIR);
        await execAsync(`cd "${tempParent}" && zip -r "${sanitizedDestination}" "${tempBasename}" -x "*.git*" "node_modules/*" "tests/*" "*.md"`);
        
        console.log(`✓ Built WP Rocket from ${ref}`);
    } finally {
        // Clean up temp directory
        if (fs.existsSync(TEMP_DIR)) {
            await execAsync(`rm -rf "${TEMP_DIR}"`);
        }
    }
}

/**
 * Processes a version configuration and downloads/builds the plugin if needed.
 * 
 * @param {string} versionConfig - Version configuration (version number, branch:name, tag:name, or URL)
 * @param {string} targetFilename - Target filename in plugin directory
 * @param {PluginVersionConfig['repository']} repo - Repository configuration
 * @param {string} label - Label for logging purposes (e.g., 'previous_stable', 'new_release')
 * @return {Promise<void>}
 */
async function processVersion(
    versionConfig: string,
    targetFilename: string,
    repo?: PluginVersionConfig['repository'],
    label?: string
): Promise<void> {
    const targetPath = path.join(PLUGIN_DIR, targetFilename);
    
    // Checkt labelInfo = label ? ` (${label})` : '';
        console.log(`✓ ${targetFilename}${labelInfo} already exists (use --force to rebuild)`);
        return;
    }
    
    // Log which version we're processing
    if (label) {
        console.log(`\nProcessing ${label}: ${versionConfig}`)dForceRebuild && pluginFileExists(targetFilename)) {
        console.log(`✓ ${targetFilename} already exists (use --force to rebuild)`);
        return;
    }
    
    // Handle different version config formats
    if (versionConfig.startsWith('http://') || versionConfig.startsWith('https://')) {
        // Direct URL download
        await downloadFile(versionConfig, targetPath);
    } else if (versionConfig.startsWith('branch:')) {
        // GitHub branch
        const branch = versionConfig.replace('branch:', '');
        await buildFromGitHub(branch, targetPath, repo);
    } else if (versionConfig.startsWith('tag:')) {
        // GitHub tag
        const tag = versionConfig.replace('tag:', '');
        await buildFromGitHub(tag, targetPath, repo);
    } else {
        // Assume it's a version number
    param {VersionOverrides} overrides - Optional version overrides from CLI/env
 * @return {Promise<void>}
 */
export async function setupPluginVersions(force: boolean = false, overrides?: VersionOverrides): Promise<void> {
    console.log('\n🚀 WP Rocket Plugin Manager\n');
    
    // Get active config with overrides applied
    const pluginConfig = getActivePluginConfig(overrides);
    
    // Show override information if any
    const runtimeOverrides = overrides || parseVersionOverrides();
    if (hasVersionOverrides(runtimeOverrides)) {
        console.log('📝 CLI Version Overrides Detected:');
        console.log(formatVersionOverrides(runtimeOverrides));
        console.log();
    }
    
    console.log('Setting up plugin versions...\n');
    
    // Set the internal flag based on parameter
    shouldForceRebuild = force;
    
    try {
        await ensurePluginDir();
        
        // Process each version
        await processVersion(
            pluginConfig.previousStable,
            PLUGIN_FILES.previousStable,
            pluginConfig.repository,
            'previous_stable'
        );
        
        await processVersion(
            pluginConfig.newRelease,
            PLUGIN_FILES.newRelease,
            pluginConfig.repository,
            'new_release'
        );
        
        if (pluginConfig.specificVersion) {
            await processVersion(
                pluginConfig.specificVersion,
                PLUGIN_FILES.specificVersion,
                pluginConfig.repository,
                'specific_version'
            pluginConfig.repository
        );
        
        if (pluginConfig.specificVersion) {
            await processVersion(
                pluginConfig.specificVersion,
                PLUGIN_FILES.specificVersion,
                pluginConfig.repository
            );
        }
        
        console.log('\n✅ Plugin setup completed successfully!\n');
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('\n❌ Plugin setup failed:', errorMessage);
        throw error;
    }
}

/**
 * Validates that all required plugin files exist.
 * 
 * @return {Promise<boolean>} True if all required files exist
 */param {VersionOverrides} overrides - Optional version overrides to display
 * @return {Promise<void>}
 */
export async function listPluginFiles(overrides?: VersionOverrides): Promise<void> {
    console.log('\n📦 Plugin Files:\n');
    
    // Get active config with overrides applied
    const pluginConfig = getActivePluginConfig(overrides);
    
    // Show override information if any
    const runtimeOverrides = overrides || parseVersionOverrides();
    if (hasVersionOverrides(runtimeOverrides)) {
        console.log('📝 Active CLI Overrides:');
        console.log(formatVersionOverrides(runtimeOverrides));
        console.log();
    }
        PLUGIN_FILES.newRelease,
    ];
    
    if (pluginConfig.specificVersion) {
        requiredFiles.push(PLUGIN_FILES.specificVersion);
    }
    
    const missingFiles = requiredFiles.filter(file => !pluginFileExists(file));
    
    if (missingFiles.length > 0) {
        console.warn('⚠️  Missing plugin files:', missingFiles);
        return false;
    }
    
    return true;
}

/**
 * Lists all plugin files in the plugin directory with their versions.
 * 
 * @return {Promise<void>}
 */
export async function listPluginFiles(): Promise<void> {
    console.log('\n📦 Plugin Files:\n');
    
    const files = [
        { name: PLUGIN_FILES.previousStable, config: pluginConfig.previousStable },
        { name: PLUGIN_FILES.newRelease, config: pluginConfig.newRelease },
        { name: PLUGIN_FILES.specificVersion, config: pluginConfig.specificVersion },
    ];
    
    for (const file of files) {
        const exists = pluginFileExists(file.name);
        const status = exists ? '✓' : '✗';
        const size = exists 
            ? (fs.statSync(path.join(PLUGIN_DIR, file.name)).size / 1024 / 1024).toFixed(2) + ' MB'
            : 'N/A';
        
        console.log(`${status} ${file.name.padEnd(30)} (${file.config}) - ${size}`);
    }
    
    console.log();
}

/**
 * Cleans up all plugin files.
 * 
 * @return {Promise<void>}
 */
export async function cleanPluginFiles(): Promise<void> {
    console.log('\n🧹 Cleaning plugin files...\n');
    
    const files = [
        PLUGIN_FILES.previousStable,
        PLUGIN_FILES.newRelease,
        PLUGIN_FILES.specificVersion,
    ];
    
    for (const file of files) {
        const filePath = path.join(PLUGIN_DIR, file);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`✓ Deleted ${file}`);
        }
    }
    
    console.log('\n✅ Cleanup completed!\n');
}
