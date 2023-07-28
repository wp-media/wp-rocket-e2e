import os from 'os';
import fs from 'fs/promises';

// Interfaces
import { ExportedSettings } from '../utils/types';
import { uiReflectedSettings } from './exclusions';

const homeDir: string = os.homedir();
let installPath: string;

switch(os.platform()) { 
    case 'linux': { 
       installPath = 'wp-env';
       break; 
    } 
    default: { 
       installPath = '.wp-env'; 
       break; 
    } 
}

export const sleep = async (ms: number): Promise<void> => new Promise(r => setTimeout(r, ms));

/**
 * 
 * @param file String File name.
 * @returns String Absolute path to give file from OS.
 */
const getDir = async (file: string): Promise<string> => {
    let dir: string;
    dir = (await fs.readdir(homeDir + '/' + installPath, { withFileTypes: true })).filter(dirent => dirent.isDirectory())[0].name;
    dir = homeDir + '/' + installPath + '/' + dir + '/WordPress/' + file;

    return dir;
}

/**
 * 
 * @param file Path to file to be read.
 * @returns String File content.
 */
export const readFile = async (file: string): Promise<string> => {
    return await fs.readFile(await getDir(file), 'utf8');
}

/**
 * 
 * @param file Path to file to be written.
 * @param data Data to be written to file.
 */
export const writeToFile = async (file: string, data: string): Promise<void> => {
    await fs.writeFile(await getDir(file), data);
    await sleep(1000);
}

/**
 * 
 * @param file Path to file.
 * @returns bool.
 */
export const fileExist = async (file: string): Promise<boolean> => {
    try {
        await fs.access(await getDir(file));
        return true;
    } catch {
        return false;
    }
}

/**
 * Checks if WP Rocket is active if config file exists.
 * 
 * Function to be removed.
 * 
 * @returns bool.
 */
export const isRocketActive = async (): Promise<boolean> => {
    try {
        await fs.access(await getDir('wp-content/wp-rocket-config/localhost.php'));
        return true;
    } catch {
        return false;
    }
}

/**
 * Read file content
 */
export const readAnyFile = async (file: string): Promise<string> => {
    return await fs.readFile(file, 'utf8');
}

/**
 * Check that settings is exported correctly.
 *
 * @param exported_settings  Object of exported settings.
 * @param exception          Object key to exclude from check.
 *
 * @return True if settings is exported correctly; Otherwise false.
 */
export const isExportedCorrectly = async (exportedSettings: ExportedSettings, exception: string): Promise< boolean > => {
    for (const key in exportedSettings) {
        for (const option of uiReflectedSettings) {
            if (key == exception) {
                continue;
            }

            if (key === option && exportedSettings[key] !== 0) {
                return false;
            }
        }
     }

     return true;
}

