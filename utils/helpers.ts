import os from 'os';
import fs from 'fs/promises';
import type { Page } from '@playwright/test';
import backstop from 'backstopjs';

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

/**
 * Checks if an input element is enabled.
 *
 * @param page Page object.
 * @param selector Element selector.
 *
 * @return True if input element is enabled; Otherwise false.
 */
export const isElementEnabled = async (page: Page, selector: string): Promise<boolean> => {
    await page.waitForSelector(selector);
    return await page.isEnabled(selector);
}

/**
 * Performs the activation click action on WPR option popup.
 *
 * @param page Page object.
 * @param state Parent element state.
 * @param selector Element selector.
 *
 * @return  {Promise<void>}
 */
export const activateFromPopUp = async(page: Page, state: boolean, selector: string): Promise<void> => {
    if (!state) {
        return;
    }

    await page.waitForSelector(selector);
    await page.locator(selector).click();
}

/**
 * Update backstopjs scenario url.
 *
 * @param   {string}   url  Updated url.
 *
 * @return  {Promise<void>}
 */
const updateVRTestUrl = async(url: string = ''): Promise<void> => {
    const fileName = './backstop.json';

    // Read the JSON file
    const data = await fs.readFile(fileName, 'utf8');
    const jsonData = JSON.parse(data);

    if (url === '') {
        url = jsonData.scenarios[0].url.replace(/\?nowprocket/g, '');
    }

    // Modify the JSON object
    jsonData.scenarios[0].url = url;

    // Convert the modified object back to JSON
    const updatedJsonData = JSON.stringify(jsonData, null, 2);

    // Write the updated JSON back to the file
    await fs.writeFile(fileName, updatedJsonData, 'utf8');
}

/**
 * Create reference snapshot for backstopjs to use during test.
 *
 * @param   {string}   url  Page url to create reference.
 *
 * @return  {Promise<void>}
 */
export const createReference = async(url: string): Promise<void> => {
    url = url.replace(/http.*\/\/|www\./g, '');

    try {
        await updateVRTestUrl(`https://${url}?nowprocket`);

        // Use BackstopJS to capture a snapshot of the webpage.
        await backstop('reference')
    } catch (error) {
        console.error(`Error editing JSON file: ${error}`);
    }
}

/**
 * Compare reference snapshot with latest snapshot.
 *
 * @return  {<Promise><void>}
 */
export const compareReference = async(): Promise<void> => {
    try {
        await updateVRTestUrl();
    
        // Use BackstopJS to compare snapshots.
        await backstop('test')
    } catch (error) {
        console.error(`Error editing JSON file: ${error}`);
    }
}
