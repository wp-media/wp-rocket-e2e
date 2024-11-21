import fs from 'fs';
import path from "path";
import {exec} from "child_process";


const testResults = path.join(__dirname, 'test-results');

const args = process.argv.slice(2);
if(args.length < 1) {
    console.error('Please provide the new naming for test folder')
}
const newTestDir = args[0];

const gitCommands =  `git add . && git commit -m "Add test report" && git push origin test`;

// Rename test folder and push
fs.rename(testResults, newTestDir, (err) => {
    if (err) {
        console.error('Error renaming/moving file:', err);
    } else {
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
    }
});