import { ICustomWorld } from "../common/custom-world";
import { Sections } from '../../common/sections';
import { selectors as pluginSelectors } from "./../../common/selectors";
import { PageUtils } from "../../../utils/page-utils";
import {After, Before} from "@cucumber/cucumber";
import {StorageUtils} from "../utils/storage";
import {configurations} from "../../../utils/configurations";
import {rm, testSshConnection} from "../../../utils/commands";
import {WP_SSH_ROOT_DIR} from "../../../config/wp.config";
import {Page} from "@playwright/test";


/**
 * Before each test scenario with the @bwpupsetup tag, performs setup tasks.
 */
Before({tags: '@bwpupsetup'}, async function(this: ICustomWorld, {pickle}) {

    this.page = await this.context.newPage();
    this.sections = new Sections(this.page, pluginSelectors);
    this.utils = new PageUtils(this.page, this.sections);
    this.storage = new StorageUtils(this.page, this.sections);

    this.pickle = pickle;
});

/**
 * After each scenario delete data
 */
After({ tags: '@bwpupsetup' }, async function (this: ICustomWorld) {
    // This runs after each scenario
    await deleteAllData(this.page);
    try {
        await testSshConnection();

        const backwpupFolder = `${WP_SSH_ROOT_DIR}wp-content/uploads/backwpup`;
        await rm(backwpupFolder);
        const backwpupRestoreFolder = `${WP_SSH_ROOT_DIR}wp-content/uploads/backwpup-restore`;
        await rm(backwpupRestoreFolder);
    } catch (error) {
        console.error('Setup failed: ', error.message);
        throw new Error('Setup failed: ' + error.message);
    }
});

async function deleteAllData(page: Page): Promise<void> {
    await page.goto(`${configurations.baseUrl}/wp-admin/admin.php?page=backwpup`);
    await page.waitForLoadState('networkidle');
    const hasItems = await page.locator('table#backwpup-backup-history tbody tr').count() > 0;
    if (!hasItems) {
        console.log('No items to delete');
        return;
    }

    const checkboxLabels = page.locator('label:has(input[name="select_backup"])');
    const count = await checkboxLabels.count();
    for (let i = 0; i < count; i++) {
        await checkboxLabels.nth(i).click();
    }

    await page.selectOption('select[name="bulk_actions"]', 'delete');
    await page.click('button#bulk-actions-apply');
    await page.waitForLoadState('networkidle');
}