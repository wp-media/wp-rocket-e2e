import os from 'os';
import fs from 'fs/promises';

// Interfaces
import { exportedSettings } from './interfaces';

let home_dir: String, install_path: String;
home_dir = os.homedir();

switch(os.platform()) { 
    case 'linux': { 
       install_path = 'wp-env';
       break; 
    } 
    default: { 
       install_path = '.wp-env'; 
       break; 
    } 
} 

/**
 * 
 * @param err Error message.
 */
export async function log_error(err, prefix = ''){
    console.log(prefix != '' ? prefix + ' - ' : '', err);
}

/**
 * 
 * @param page Page Object.
 */
export const save_settings = async ( page ) => {
    await page.waitForSelector('#wpr-options-submit');
    // save settings
    await page.locator('#wpr-options-submit').click();
}

export const sleep = (ms:number) => new Promise(r => setTimeout(r, ms));

/**
 * 
 * @param file String File name.
 * @returns String Absolute path to give file from OS.
 */
const get_dir = async (file: String) => {
    let dir;
    dir = (await fs.readdir(home_dir + '/' + install_path, { withFileTypes: true })).filter(dirent => dirent.isDirectory())[0].name;
    dir = home_dir + '/' + install_path + '/' + dir + '/WordPress/' + file;

    return dir;
}

/**
 * 
 * @param file Path to file to be read.
 * @returns String File content.
 */
export const read_file = async (file) => {
    return await fs.readFile(await get_dir(file), 'utf8');
}

/**
 * 
 * @param file Path to file to be written.
 * @param data Data to be written to file.
 */
export const write_to_file = async (file: String, data: String) => {
    await fs.writeFile(await get_dir(file), data);
    await sleep(1000);
}

/**
 * 
 * @param file Path to file.
 * @returns bool.
 */
export const file_exist = async (file: String) => {
    try {
        await fs.access(await get_dir(file));
        return true;
    } catch {
        return false;
    }
}

/**
 * 
 * @returns bool.
 */
export const is_rocket_active = async () => {
    try {
        await fs.access(await get_dir('wp-content/wp-rocket-config/localhost.php'));
        return true;
    } catch {
        return false;
    }
}

/**
 * Read file content
 */
export const read_any_file = async (file) => {
    return await fs.readFile(file, 'utf8');
}

/**
 * Check that settings is exported correctly.
 *
 * @param   {exportedSettings}  exported_settings  Object of exported settings.
 * @param   {string}            exception          Object key to exclude from check.
 *
 * @return  {Promise<boolean>}                     Return bool.
 */
export const is_exported_correctly = async (exported_settings: exportedSettings, exception: string): Promise< boolean > => {
    const ui_reflected_settings = [
        'lazyload',
        'remove_unused_css',
        'async_css',
        'cache_logged_user',
        'cache_mobile',
        'do_caching_mobile_files',
        'minify_css',
        'minify_js',
        'minify_concatenate_css',
        'minify_concatenate_js',
        'defer_all_js',
        'lazyload_iframes',
        'lazyload_youtube',
        'database_revisions',
        'database_auto_drafts',
        'database_trashed_posts',
        'database_spam_comments',
        'database_trashed_comments',
        'database_all_transients',
        'database_optimize_tables',
        'schedule_automatic_cleanup',
        'manual_preload',
        'do_cloudflare',
        'sucury_waf_cache_sync',
        'control_heartbeat',
        'cdn',
        'varnish_auto_purge',
        'image_dimensions',
        'delay_js', 
    ];

    for (let key in exported_settings) {
        for (let option of ui_reflected_settings) {
            if (key == exception) {
                continue;
            }

            if (key === option && exported_settings[key] !== 0) {
                return false;
            }
        }
     }

     return true;
}

