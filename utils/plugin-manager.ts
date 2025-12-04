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
import { pluginConfig, forceRebuild, PluginVersionConfig } from '../config/plugin.config';

const execAsync = promisify(exec);

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
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(destination);
        
        https.get(url, (response) => {
            // Handle redirects
            if (response.statusCode === 301 || response.statusCode === 302) {
                file.close();
                fs.unlinkSync(destination);
                return downloadFile(response.headers.location!, destination)
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
            if (fs.existsSync(destination)) {
                fs.unlinkSync(destination);
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
    // This URL structure may need to be adjusted based on actual WP Rocket release hosting
    // For now, this is a placeholder structure
    const url = `https://wp-rocket.me/releases/wp-rocket_${version}.zip`;
    
    console.log(`Downloading WP Rocket ${version} from releases...`);
    await downloadFile(url, destination);
    console.log(`✓ Downloaded WP Rocket ${version}`);
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

    const { owner, name, token } = repo;
    const repoUrl = token 
        ? `https://${token}@github.com/${owner}/${name}.git`
        : `https://github.com/${owner}/${name}.git`;
    
    // Clean up temp directory if it exists
    if (fs.existsSync(TEMP_DIR)) {
        await execAsync(`rm -rf ${TEMP_DIR}`);
    }
    
    fs.mkdirSync(TEMP_DIR, { recursive: true });
    
    try {
        console.log(`Building WP Rocket from ${ref}...`);
        
        // Clone the repository
        console.log('  Cloning repository...');
        await execAsync(`git clone --depth 1 --branch ${ref} ${repoUrl} ${TEMP_DIR}`);
        
        // Check if composer.json exists and install dependencies
        const composerFile = path.join(TEMP_DIR, 'composer.json');
        if (fs.existsSync(composerFile)) {
            console.log('  Installing Composer dependencies...');
            await execAsync(`cd ${TEMP_DIR} && composer install --no-dev --optimize-autoloader`);
        }
        
        // Check if package.json exists and build assets
        const packageFile = path.join(TEMP_DIR, 'package.json');
        if (fs.existsSync(packageFile)) {
            console.log('  Building assets...');
            await execAsync(`cd ${TEMP_DIR} && npm install && npm run build`);
        }
        
        // Create zip file
        console.log('  Creating zip file...');
        const pluginDirName = name;
        await execAsync(`cd ${TEMP_DIR}/.. && zip -r ${destination} ${path.basename(TEMP_DIR)} -x "*.git*" "node_modules/*" "tests/*" "*.md"`);
        
        console.log(`✓ Built WP Rocket from ${ref}`);
    } finally {
        // Clean up temp directory
        if (fs.existsSync(TEMP_DIR)) {
            await execAsync(`rm -rf ${TEMP_DIR}`);
        }
    }
}

/**
 * Processes a version configuration and downloads/builds the plugin if needed.
 * 
 * @param {string} versionConfig - Version configuration (version number, branch:name, tag:name, or URL)
 * @param {string} targetFilename - Target filename in plugin directory
 * @param {PluginVersionConfig['repository']} repo - Repository configuration
 * @return {Promise<void>}
 */
async function processVersion(
    versionConfig: string,
    targetFilename: string,
    repo?: PluginVersionConfig['repository']
): Promise<void> {
    const targetPath = path.join(PLUGIN_DIR, targetFilename);
    
    // Check if file already exists and we're not forcing rebuild
    if (!forceRebuild && pluginFileExists(targetFilename)) {
        console.log(`✓ ${targetFilename} already exists (use --force-plugin-rebuild to rebuild)`);
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
        await downloadFromReleases(versionConfig, targetPath);
    }
}

/**
 * Sets up all required plugin versions based on configuration.
 * 
 * @param {boolean} force - Force rebuild even if files exist
 * @return {Promise<void>}
 */
export async function setupPluginVersions(force: boolean = false): Promise<void> {
    console.log('\n🚀 WP Rocket Plugin Manager\n');
    console.log('Setting up plugin versions...\n');
    
    try {
        await ensurePluginDir();
        
        // Process each version
        await processVersion(
            pluginConfig.previousStable,
            PLUGIN_FILES.previousStable,
            pluginConfig.repository
        );
        
        await processVersion(
            pluginConfig.newRelease,
            PLUGIN_FILES.newRelease,
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
        console.error('\n❌ Plugin setup failed:', error.message);
        throw error;
    }
}

/**
 * Validates that all required plugin files exist.
 * 
 * @return {Promise<boolean>} True if all required files exist
 */
export async function validatePluginFiles(): Promise<boolean> {
    const requiredFiles = [
        PLUGIN_FILES.previousStable,
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
