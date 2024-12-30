import path from "path";
import {execFile} from "child_process";

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

// Execute the bash script
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