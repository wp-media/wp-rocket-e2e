import fs from 'fs';
import path from "path";
import {exec} from "child_process";
import { GITHUB_PAT} from "./config/wp.config";

const GIT_PAT = GITHUB_PAT;

if (!GIT_PAT) {
    console.error('Github PAT is not defined in the environment variables.');
    process.exit(1);
}

const remoteUrl = `https://${GIT_PAT}@github.com/wp-media/e2e_release_reports.git`;
const sharedDirectory = '/var/shared/rocket-e2e-reports'
const testResultsDir = path.join(__dirname, 'test-results');

const args = process.argv.slice(2);

if(args.length < 1) {
    console.error('Please provide the new naming for test folder')
}
const newTestResultsDir = args[0];

const gitCommands = `
    git checkout -b ${newTestResultsDir};
    git add . && git commit -m "Test report";
    git push -u origin ${newTestResultsDir}
`;

/**
 * Setup git username and email
 *
 * @param {Function} callback - Function to execute after moving files.
 */
async function setGitGlobalConfig(callback: () => void): Promise<void>{
    //Execute command to have username, defaulted it to e2e environment.
    exec('git config --global user.name "E2E Environment" && git config --global user.email "e2e.report@wp-media.me"', (err) => {
        if (err) {
            console.error('Error setting global Git config:', err);
            process.exit(1);
        }
        console.log('Global Git config set.');
        callback();
    });
}

//Check if .git directory exists
export async function checkGitInitialized(callback) : Promise<void>{
    const gitDir = path.join(newTestResultsDir, '.git');
    if (!fs.existsSync(gitDir)) {
        console.info('Git is not initialized. Setting it up...');
        exec(`git init && git remote add origin ${remoteUrl}`, {cwd: newTestResultsDir }, (initErr) => {
            if (initErr) {
                console.error('Error initializing Git:', initErr);
                process.exit(1);
            }
            console.info('Git initialized and remote added.');
            callback();
        });

        await setGitGlobalConfig(() => callback());
    } else {
        callback();
    }
}

/**
 * Moves all files and directories inside the test-results folder to the new directory.
 * @param {string} testResultDir - The current test directory.
 * @param {string} newSubDir - The new test result sub-directory.
 * @param {Function} callback - Function to execute after moving files.
 */
export async function moveTestResultToSubdirectory(testResultDir, newSubDir, callback): Promise<void> {
    const newTestDir = path.join(sharedDirectory, newSubDir);

    // Main Process
    if (!fs.existsSync(newTestDir)) {
        fs.mkdirSync(newTestDir, { recursive: true });
    }

    fs.readdir(testResultDir, (err, items) => {
        if (err) {
            console.error('Error reading directory:', err);
            process.exit(1);
        }

        items.forEach(item => {
            const itemPath = path.join(testResultsDir, item);

            const destPath = path.join(newTestDir, item);

            // Move the file or directory
            fs.rename(itemPath, destPath, err => {
                if (err) {
                    console.error(`Error moving "${item}" to "archive":`, err);
                } else {
                    console.log(`Moved ${item} to ${newTestDir} successfully.`);
                }
            });
        });

        callback()
    });
}

export async function executeGitCommands() :Promise<void> {
    exec(gitCommands, (err, stdout, stderr) => {
        if (err) {
            console.error('Error executing git commands:', err);
        }

        if (stderr) {
            console.error('Git stderr output:', stderr);
        } else {
            console.log('Git commands executed successfully:', stdout);
        }
    });
}


moveTestResultToSubdirectory(testResultsDir, newTestResultsDir, async () => {
    //await checkGitInitialized(async () => await executeGitCommands());
});
