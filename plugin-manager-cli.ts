#!/usr/bin/env node

/**
 * @fileoverview
 * CLI tool for managing WP Rocket plugin versions for E2E tests.
 * 
 * Usage:
 *   npm run plugin:setup              - Setup all configured plugin versions
 *   npm run plugin:setup -- --force   - Force rebuild/re-download even if files exist
 *   npm run plugin:list               - List all plugin files and their status
 *   npm run plugin:clean              - Remove all plugin files
 *   npm run plugin:validate           - Check if all required plugin files exist
 */

import { setupPluginVersions, listPluginFiles, cleanPluginFiles, validatePluginFiles } from './utils/plugin-manager';

const args = process.argv.slice(2);
const command = args[0] || 'setup';
const force = args.includes('--force') || args.includes('-f');

async function main(): Promise<void> {
    try {
        switch (command) {
            case 'setup':
                await setupPluginVersions(force);
                break;
            
            case 'list':
                await listPluginFiles();
                break;
            
            case 'clean':
                await cleanPluginFiles();
                break;
            
            case 'validate': {
                const isValid = await validatePluginFiles();
                if (isValid) {
                    console.log('✅ All required plugin files are present\n');
                    process.exit(0);
                } else {
                    console.log('❌ Some required plugin files are missing\n');
                    console.log('Run "npm run plugin:setup" to download/build them.\n');
                    process.exit(1);
                }
                break;
            }
            
            case 'help':
            case '--help':
            case '-h':
                printHelp();
                break;
            
            default:
                console.error(`Unknown command: ${command}`);
                printHelp();
                process.exit(1);
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Error:', errorMessage);
        process.exit(1);
    }
}

function printHelp(): void {
    console.log(`
WP Rocket Plugin Manager

Usage: npm run plugin:<command> [options]

Commands:
  setup                Setup all configured plugin versions
  list                 List all plugin files and their status
  clean                Remove all plugin files
  validate             Check if all required plugin files exist
  help                 Show this help message

Options:
  --force, -f         Force rebuild/re-download even if files exist

Examples:
  npm run plugin:setup
  npm run plugin:setup -- --force
  npm run plugin:list
  npm run plugin:clean
  npm run plugin:validate

Configuration:
  Edit config/plugin.config.ts to configure which plugin versions to use.
    `);
}

main();
