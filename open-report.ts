import { exec } from 'child_process';
import * as path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface PlatformCommands {
    [key: string]: string;
}

async function openCucumberReport(): Promise<void> {
    const reportPath: string = path.join(process.cwd(), 'test-results', 'cucumber-report.html');

    const platformCommands: PlatformCommands = {
        'win32': `start "" "${reportPath}"`,
        'darwin': `open "${reportPath}"`,
        'linux': `xdg-open "${reportPath}"`
    };

    const command: string = platformCommands[process.platform] || `xdg-open "${reportPath}"`;

    try {
        await execAsync(command);
        console.log('✅ Cucumber report opened in browser');
    } catch (error) {
        console.error('❌ Error opening report:', error);
    }
}

if (require.main === module) {
    openCucumberReport();
}

export { openCucumberReport };