import path from "path";
import { execFile } from "child_process";
import {promises as fs} from "fs";

/**
 * Get the script path and arguments for moving the report.
 *
 * @return {Promise<{ scriptPath: string; args: string[] }>}
 */
async function initialization(): Promise<{ scriptPath: string; args: string[] }> {
    const scriptPath = path.resolve('move_report.sh');
    const destination = process.argv[2];
    const newName = process.argv[3];

    if (!destination) {
        console.error('Usage: npm run push-report <destination_directory> [new_name]');
        process.exit(1);
    }

    // Prepare the arguments for the script
    const args = [destination];
    if (newName) {
        args.push(newName);
    }

    return { scriptPath, args };
}
/**
 * Check if script has permission and if not add the right permission, so it can be executed.
 * @param {string} scriptPath The script path.
 *
 * @return {Promise<void>}
*/
export async function checkScriptPermission(scriptPath: string): Promise<void> {
    try {
        await fs.access(scriptPath, fs.constants.X_OK);
        console.log(`Script already has execute permission: ${scriptPath}`);
    } catch (err) {
        console.log(`Adding execute permission to ${scriptPath}`);
        try {
            await fs.chmod(scriptPath, 0o755);
            console.log(`Execute permission added successfully: ${scriptPath}`);
        } catch (chmodErr) {
            console.error(`Failed to set execute permission: ${chmodErr.message}`);
            throw chmodErr;
        }
    }
}

/**
 * Move the test-results directory to the given directory.
 * @param {string} scriptPath The script path.
 * @param args Script argument.
 *
 * @return {Promise<void>}
 */
export async function moveTestReport(scriptPath: string, args: readonly string[]): Promise<void> {
    execFile(scriptPath, args, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`Stderr: ${stderr}`);
            return;
        }
        console.log(`Output: ${stdout}`);
    });
}

(async (): Promise<void> => {
    try {
        const { scriptPath, args } = await initialization();
        await checkScriptPermission(scriptPath);
        await moveTestReport(scriptPath, args);
    } catch (err) {
        console.error(`Failed to execute the script: ${err.message}`);
        process.exit(1);
    }

    process.exit(0);
})();