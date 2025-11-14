import { Then } from '@cucumber/cucumber';
import { ICustomWorld } from '../../common/custom-world';
import { listBackWPupJobsWPCLI } from '../utils/helpers';
import { expect } from '@playwright/test';
import { testSshConnection } from '../../../utils/commands';

Then(
    'I can see 1 job via WP-CLI command',
    async function (this: ICustomWorld) {
        await testSshConnection();
        const result = await listBackWPupJobsWPCLI(true);
        expect(result).toHaveLength(1);
    }
);

Then('I can see {int} jobs via WP-CLI command', async function (this: ICustomWorld, jobCount: number) {
    await testSshConnection();
    const result = await listBackWPupJobsWPCLI(true);
    expect(result).toHaveLength(jobCount);
});