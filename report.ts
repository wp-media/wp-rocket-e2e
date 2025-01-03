import path from "path";
import {promises as fs} from "fs";
import {ENVIRONMENT_USERNAME} from "./config/wp.config";

interface MoveReportOptions {
    destinationDir?: string;
    newName?: string;
}

/**
 * Generates a default name using timestamp and username
 *
 * @returns string Generated name in format "YYYYMMDD_HHMMSS_username"
 */
async function generateDefaultName() : Promise<string>  {
    const timestamp = new Date().toISOString()
        .replace(/[-:]/g, '')
        .replace(/T/, '_')
        .replace(/\..+/, '');

    const username = ENVIRONMENT_USERNAME || 'unknown';
    return `${timestamp}_${username}`;
}

/**
 * Moves test results to a destination directory with optional renaming
 *
 * @param options Configuration options for moving the report
 * @returns Promise<string> Path where the folder was moved to
 */
export async function moveTestReport(options: MoveReportOptions = {}): Promise<string> {
    const SOURCE_FOLDER = 'test-results';
    const DEFAULT_DESTINATION = '/var/shared/rocket-e2e-reports';

    // Validate source folder exists
    try {
        await fs.access(SOURCE_FOLDER);
    } catch (error) {
        throw new Error(`Source folder '${SOURCE_FOLDER}' does not exist`);
    }

    // Determine destination directory
    const destinationDir = options.destinationDir || DEFAULT_DESTINATION;

    // Ensure destination directory exists
    try {
        await fs.access(destinationDir);
    } catch (error) {
        throw new Error(`Destination directory '${destinationDir}' does not exist`);
    }

    // Generate new folder name if not provided
    const newName = options.newName || await generateDefaultName();

    const newTestReportPath = path.join(destinationDir, newName);

    try {
        await fs.rename(SOURCE_FOLDER, newTestReportPath);

        return newTestReportPath;
    } catch (error) {
        throw new Error(`Failed to move folder: ${error.message}`);
    }
}

// Example of how to update your main execution code:
export async function main(): Promise<void> {
    try {
        const destination = process.argv[2];
        const tag = process.env.npm_config_tag;

        const options: MoveReportOptions = {
            destinationDir: destination,
            newName: tag ? `${tag}_test` : undefined
        };

        const newPath = await moveTestReport(options);
        console.log(`Folder successfully moved to '${newPath}'`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
}

/**
 * Get the script path and arguments for moving the report.
 *
 * @return MoveReportOptions
 */
async function initialization(): Promise<MoveReportOptions> {
    const destination = process.argv[2];
    const tag = process.env.npm_config_tag;

    return {
        destinationDir: destination,
        newName: tag ? `${tag}_test` : undefined
    };
}

(async (): Promise<void> => {
    try {
        const options = await initialization();
        await moveTestReport(options);
    } catch (err) {
        console.error(`Failed to execute the script: ${err.message}`);
        process.exit(1);
    }

    process.exit(0);
})();