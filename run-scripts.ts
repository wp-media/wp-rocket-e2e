import { execSync } from 'child_process';
import data from './package.json';

/**
 * Array of script names.
 *
 * @var {string[]}
 */
const scripts: string[] = [];

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
        scripts.push(key);
    }
}

// Loop through and run scripts sequentially.
scripts.forEach(script => {
  try {
    console.log(`Running: ${script}`);
    execSync(`npm run ${script}`, { stdio: 'inherit' });
  } catch (error) {
    console.error(`Error running ${script}:`, error.message);
  }
});