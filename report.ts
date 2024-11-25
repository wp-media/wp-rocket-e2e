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

const testResults = path.join(__dirname, 'test-results');

const args = process.argv.slice(2);
if(args.length < 1) {
    console.log(GIT_PAT);
    console.error('Please provide the new naming for test folder')
}
const newTestDir = args[0];

const gitCommands = `
    git checkout -b ${newTestDir};
    git add . && git commit -m "Test report";
    git push origin test
`;


//Check if .git directory exists
export async function checkGitInitialized(callback) : Promise<void>{
    const gitDir = path.join(newTestDir, '.git');
    if (!fs.existsSync(gitDir)) {
        console.log('Git is not initialized. Setting it up...');
        exec(`git init && git remote add origin ${remoteUrl}`, {cwd: newTestDir}, (initErr) => {
            if (initErr) {
                console.error('Error initializing Git:', initErr);
                process.exit(1);
            }
            console.log('Git initialized and remote added.');
            callback();
        });

        //Execute command to have username, default it to e2e environment
        exec('git config --global user.name "E2E Environment" && git config --global user.email "e2e.report@wp-media.me"', (err) => {
            if (err) {
                console.error('Error setting global Git config:', err);
            } else {
                console.log('Global Git config set.');
            }
        });
    } else {
        callback();
    }
}

// Rename test folder and push
fs.rename(testResults, newTestDir, (err) => {
    if (err) {
        console.error('Error renaming/moving file:', err);
    } else {
        checkGitInitialized(() => {
            exec(gitCommands, { cwd: newTestDir }, (err, stdout, stderr) => {
                if (err) {
                    console.error('Error executing git commands:', err);
                }

                if (stderr) {
                    console.error('Git stderr output:', stderr);
                    return;
                }

                //Revert the renaming of test folder to avoid tracking it in e2e
                fs.rename(newTestDir, testResults, (err) => {
                    if (err) {
                        console.error('Error reverting the directory name:', err);
                    }
                });
            });
        })
    }
});