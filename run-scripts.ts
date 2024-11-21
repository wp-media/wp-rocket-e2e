import { execSync } from 'child_process';
import data from './package.json';

/**
 * Script commands to be executed.
 * 
 * @var {string}
 */
let scripts = '';

/**
 * Excluded tests for the script execution.
 *
 * @var {string[]}
 */
const excludedTests: string[] = [
  'test:e2e',
  'test:local',
  'test:online',
  'test:vr',
  'test:test',
  'test:performancehints',
];

// Loop through package scripts and filter out non-test scripts and excluded tests.
for (const key in data.scripts) {
    if (key.startsWith('test:') && ! excludedTests.includes(key)) {
        scripts += `npm run ${key} && `
    }
}

const char = '&&';

const escapedChar = char.replace(/[.*+?^${}()|[\]\\ ]/g, '\\$&');
const regex = new RegExp(`${escapedChar}\\s*$`);
scripts = scripts.replace(regex, '');


// Run scripts sequentially.
try {
  console.log(`Running: ${scripts}`);
  execSync(scripts, { stdio: 'inherit' });
} catch (error) {
  console.error(error.message);
}