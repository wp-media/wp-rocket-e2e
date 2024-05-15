/**
 * @fileoverview
 * This module provides utility functions for file operations, sleep, and interaction with Playwright for testing.
 * It includes functions for reading, writing, and checking the existence of files, as well as functions related to UI interactions.
 *
 * @requires {@link os}
 * @requires {@link fs/promises}
 * @requires {@link @playwright/test}
 * @requires {@link backstopjs}
 * @requires {@link ../utils/types}
 * @requires {@link ./exclusions}
 */
import os from 'os';
import fs from 'fs/promises';
import type { Page } from '@playwright/test';
import backstop from 'backstopjs';

// Interfaces
import { ExportedSettings, VRurlConfig, Viewport, Row } from '../utils/types';
import { uiReflectedSettings } from './exclusions';
import { WP_BASE_URL } from '../config/wp.config';

const backstopConfig = './backstop.json';
/**
 * The user's home directory.
 *
 * @type {string}
 * @constant
 */
const homeDir: string = os.homedir();
let installPath: string;

/**
 * Determine the installation path based on the operating system.
 */
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

/**
 * Pause execution for the specified duration.
 *
 * @param {number} ms - The duration to sleep in milliseconds.
 * @returns {Promise<void>} - A Promise that resolves after sleeping for the specified duration.
 */
export const sleep = async (ms: number): Promise<void> => new Promise(r => setTimeout(r, ms));

/**
 * Get the absolute path to a file in the user's home directory.
 *
 * @param {string} file - The file name.
 * @returns {Promise<string>} - A Promise that resolves to the absolute path of the file.
 */
const getDir = async (file: string): Promise<string> => {
    let dir: string;
    dir = (await fs.readdir(homeDir + '/' + installPath, { withFileTypes: true })).filter(dirent => dirent.isDirectory())[0].name;
    dir = homeDir + '/' + installPath + '/' + dir + '/WordPress/' + file;

    return dir;
}

/**
 * Read the content of a file.
 *
 * @param {string} file - The path to the file to be read.
 * @returns {Promise<string>} - A Promise that resolves to the content of the file.
 */
export const readFile = async (file: string): Promise<string> => {
    return await fs.readFile(await getDir(file), 'utf8');
}

/**
 * Write data to a file.
 *
 * @param {string} file - The path to the file to be written.
 * @param {string} data - The data to be written to the file.
 * @returns {Promise<void>} - A Promise that resolves after writing to the file.
 */
export const writeToFile = async (file: string, data: string): Promise<void> => {
    await fs.writeFile(await getDir(file), data);
    await sleep(1000);
}

/**
 * Check if a file exists.
 *
 * @param {string} file - The path to the file.
 * @returns {Promise<boolean>} - A Promise that resolves to true if the file exists, false otherwise.
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
 * Check if WP Rocket is active by verifying the existence of the configuration file.
 *
 * @deprecated This function is intended to be removed.
 *
 * @returns {Promise<boolean>} - A Promise that resolves to true if WP Rocket is active, false otherwise.
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
 * Read the content of any file.
 *
 * @param {string} file - The path to the file to be read.
 * @returns {Promise<string>} - A Promise that resolves to the content of the file.
 */
export const readAnyFile = async (file: string): Promise<string> => {
    return await fs.readFile(file, 'utf8');
}

/**
 * Check that settings are exported correctly, excluding a specified option.
 *
 * @param {ExportedSettings} exportedSettings - Object of exported settings.
 * @param {string} exception - Object key to exclude from the check.
 * @returns {Promise<boolean>} - A Promise that resolves to true if settings are exported correctly, false otherwise.
 */
export const isExportedCorrectly = async (exportedSettings: ExportedSettings, exception: Array<string>): Promise< boolean > => {
    for (const key in exportedSettings) {
        for (const option of uiReflectedSettings) {
            if (exception.includes(key)) {
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
 * Check if an input element is enabled.
 *
 * @param {Page} page - The Page object.
 * @param {string} selector - The element selector.
 * @returns {Promise<boolean>} - A Promise that resolves to true if the input element is enabled, false otherwise.
 */
export const isElementEnabled = async (page: Page, selector: string): Promise<boolean> => {
    await page.waitForSelector(selector);
    return await page.isEnabled(selector);
}

/**
 * Perform the activation click action on WPR option popup.
 *
 * @param {Page} page - The Page object.
 * @param {boolean} state - Parent element state.
 * @param {string} selector - The element selector.
 * @returns {Promise<void>} - A Promise that resolves after performing the activation click action.
 */
export const activateFromPopUp = async(page: Page, state: boolean, selector: string): Promise<void> => {
    if (!state) {
        return;
    }

    await page.waitForSelector(selector);
    await page.locator(selector).click();
}

/**
 * Update backstopjs scenario URL.
 *
 * @param {string} url - Updated URL.
 * @returns {Promise<void>} - A Promise that resolves after updating the backstopjs scenario URL.
 */
const updateVRTestUrl = async(url: string): Promise<void> => {
    // Read the JSON file
    const data = await fs.readFile(backstopConfig, 'utf8');
    const jsonData = JSON.parse(data);

    // Empty scenario.
    jsonData.scenarios = [];

    let readyScript = '';

    if (!url.includes('nowprocket')) {
        readyScript = 'scrollToBottom.js';
    }

    // Modify the JSON object
    jsonData.scenarios.push({
        label: "general",
        url: url,
        referenceUrl: "",
        readyEvent: "",
        readySelector: "",
        delay: 0,
        hideSelectors: [],
        removeSelectors: [],
        hoverSelector: "",
        clickSelector: "",
        postInteractionWait: 0,
        selectors: [],
        selectorExpansion: true,
        expect: 0,
        misMatchThreshold: 0.1,
        requireSameDimensions: true,
        onReadyScript: readyScript
    });

    // Convert the modified object back to JSON
    const updatedJsonData = JSON.stringify(jsonData, null, 2);

    // Write the updated JSON back to the file
    await fs.writeFile(backstopConfig, updatedJsonData, 'utf8');
}

export const batchUpdateVRTestUrl = async(config: VRurlConfig): Promise<void> => {
    // Read the JSON file
    const data = await fs.readFile(backstopConfig, 'utf8');
    const jsonData = JSON.parse(data);

    // Empty scenario.
    jsonData.scenarios = [];

    let optimize: string = '?nowprocket';
    let path: string;
    let beforeScript = '';
    let readyScript = '';
    let viewports: Viewport[];

    const mobileViewport: Viewport[] = [
        {
            "name": "mobile",
            "width": 500,
            "height": 480
        }
    ];

    if (config.optimize) {
        optimize = '';
    }

    const urls = config.urls;
    for (const key in urls) {
        // Check that path is not empty(meaning home);
        if (urls[key].path !== '') {
            path = urls[key].path;
        }
        else {
            path = '';
        }

        if ( 'disableJs' in urls[key] && urls[key].disableJs ) {
            beforeScript = 'disableJavascript.js';
            readyScript = 'wait.js';
        }
        else{
            beforeScript = '';
            readyScript = config.optimize ? 'scrollToBottom.js' : '';
        }

        viewports = 'mobile' in urls[key] && urls[key].mobile ? mobileViewport : [];
        readyScript = 'mobile' in urls[key] && urls[key].mobile ? 'mobileMenuThemeSwitch.js' : readyScript;

        jsonData.scenarios.push({
            label: key,
            url: `${WP_BASE_URL}/${path}${optimize}`,
            referenceUrl: "",
            readyEvent: "",
            readySelector: "",
            delay: 0,
            hideSelectors: [],
            removeSelectors: [],
            hoverSelector: "",
            clickSelector: "",
            postInteractionWait: 0,
            selectors: [],
            selectorExpansion: true,
            expect: 0,
            misMatchThreshold: 0.1,
            requireSameDimensions: true,
            onReadyScript: readyScript,
            onBeforeScript: beforeScript,
            viewports: viewports
        });
    }

    // Convert the modified object back to JSON
    const updatedJsonData = JSON.stringify(jsonData, null, 2);

    // Write the updated JSON back to the file
    await fs.writeFile(backstopConfig, updatedJsonData, 'utf8');
}

/**
 * Create a reference snapshot for backstopjs to use during testing.
 *
 * @param {string} url - Page URL to create a reference.
 * @returns {Promise<void>} - A Promise that resolves after creating a reference snapshot.
 */
export const createReference = async(url: string): Promise<void> => {
    if (url === '') {
        return;
    }

    url = url.replace(/http.*\/\/|www\./g, '');

    try {
        // Update test url to use nowprocket query string.
        await updateVRTestUrl(`https://${url}?nowprocket`);

        // Use BackstopJS to capture a snapshot of the webpage.
        await backstop('reference');

         // Update test url request page with wprocket optimizations.
         await updateVRTestUrl(`https://${url}`);
    } catch (error) {
        console.error(error);
    }
}

/**
 * Compare a reference snapshot with the latest snapshot.
 *
 * @param {string} label Scenario label. 
 * 
 * @returns {Promise<void>} - A Promise that resolves after comparing snapshots.
 */
export const compareReference = async(label: string = ''): Promise<void> => {
    try {
        // Use BackstopJS to compare snapshots.
        await backstop('test', {
            filter: label
        });
    } catch (error) {
        console.error(error);
    }
}

/**
 * Delete a folder.
 *
 * @param   {string}   folderPath  Path to folder
 *
 * @return  {Promise<void>}
 */
export const deleteFolder = async(folderPath: string): Promise<void> => {
    try {
        await fs.rm(folderPath, { recursive: true });
        console.log(`Folder "${folderPath}" deleted successfully.`);
    } catch (error) {
        console.error(`Error deleting folder "${folderPath}": ${error.message}`);
    }
}

export const extractFromStdout = async(data: string): Promise<Row[]> => {
    // Split the data into lines
    const lines: string[] = data.trim().split('\n');

    // Extract headers from the first line
    const headers: string[] = lines[0].split('\t');

    // Initialize an array to store objects
    const result: Row[] = [];

    // Iterate over the remaining lines and create objects
    for (let i: number = 1; i < lines.length; i++) {
        const values: string[] = lines[i].split('\t');
        const obj: Row = {} as Row;
        for (let j: number = 0; j < headers.length; j++) {
            // Use keyof Row to ensure type safety
            let value: string = values[j];
            // Perform multiple replacements until no more backslashes are found
            while (value.includes('\\\\')) {
                value = value.replace(/\\\\/g, '');
            }
            obj[headers[j] as keyof Row] = value;
        }
        result.push(obj);
    }

    return result;
}
