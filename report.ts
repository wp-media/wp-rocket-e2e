import path from "path";
import {promises as fs} from "fs";

/**
 * Moves test results to a destination directory with optional renaming
 *
 * @param {string} testTag Tag name of the report generated.
 * @returns Promise<string> Path where the folder was moved to
 */
export async function moveTestReport(testTag: string): Promise<string> {
    const SOURCE_FOLDER = 'test-results';
    const destinationDir = '/var/shared/rocket-e2e-reports';

    // Validate source folder exists
    try {
        await fs.access(SOURCE_FOLDER);
    } catch (error) {
        throw new Error(`Source folder '${SOURCE_FOLDER}' does not exist`);
    }

    // Ensure destination directory exists
    try {
        await fs.access(destinationDir);
    } catch (error) {
        throw new Error(`Destination directory '${destinationDir}' does not exist`);
    }

    const newTestReportPath = path.join(destinationDir, testTag);

    try {
        await fs.rename(SOURCE_FOLDER, newTestReportPath);

        return newTestReportPath;
    } catch (error) {
        throw new Error(`Failed to move folder: ${error.message}`);
    }
}

(async (): Promise<void> => {
    try {
        const tag = process.env.npm_config_tag;

        //If tag is not provided, then the report shouldn't be moved or renamed.
        if(! tag) {
            process.exit(1);
        }

        await moveTestReport(tag);
    } catch (err) {
        console.error(`Failed to execute the script: ${err.message}`);
        process.exit(1);
    }

    process.exit(0);
})();