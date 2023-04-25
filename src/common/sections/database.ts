import type { Page } from '@playwright/test';

export class database  {
	readonly page: Page;
    readonly locators;
    readonly selectors;

    constructor( page: Page ){
        this.page = page;
        this.selectors = {
            'database_revisions': {
                'checkbox': '#database_revisions',
                'enable': 'label[for=database_revisions]'
            },
            'database_auto_drafts': {
                'checkbox': '#database_auto_drafts',
                'enable': 'label[for=database_auto_drafts]'
            },
            'database_trashed_posts': {
                'checkbox': '#database_trashed_posts',
                'enable': 'label[for=database_trashed_posts]'
            },
            'database_spam_comments': {
                'checkbox': '#database_spam_comments',
                'enable': 'label[for=database_spam_comments]'
            },
            'database_trashed_comments': {
                'checkbox': '#database_trashed_comments',
                'enable': 'label[for=database_trashed_comments]'
            },
            'database_all_transients': {
                'checkbox': '#database_all_transients',
                'enable': 'label[for=database_all_transients]'
            },
            'database_optimize_tables': {
                'checkbox': '#database_optimize_tables',
                'enable': 'label[for=database_optimize_tables]'
            },
            'schedule_automatic_cleanup': {
                'checkbox': '#schedule_automatic_cleanup',
                'enable': 'label[for=schedule_automatic_cleanup]'
            },
        };
        this.locators = {
            'section': this.page.locator('#wpr-nav-database'),
            'database_revisions': this.page.locator(this.selectors.database_revisions.enable),
            'database_auto_drafts': this.page.locator(this.selectors.database_auto_drafts.enable),
            'database_trashed_posts': this.page.locator(this.selectors.database_trashed_posts.enable),
            'database_spam_comments': this.page.locator(this.selectors.database_spam_comments.enable),
            'database_trashed_comments': this.page.locator(this.selectors.database_trashed_comments.enable),
            'database_all_transients': this.page.locator(this.selectors.database_all_transients.enable),
            'database_optimize_tables': this.page.locator(this.selectors.database_optimize_tables.enable),
            'schedule_automatic_cleanup': this.page.locator(this.selectors.schedule_automatic_cleanup.enable),
        }
    }

    visit = async () => {
        await this.locators.section.click();
    }

    /**
     * Toggle database revision cleanup option. 
     */
    toggleDatabaseRevisionsCleanUp = async (checked = false) => {
        if (!checked) {
            if (!await this.page.locator(this.selectors.database_revisions.checkbox).isChecked()) {
                return;
            }
        } else {
            if (await this.page.locator(this.selectors.database_revisions.checkbox).isChecked()) {
                return;
            }
        }
        await this.locators.database_revisions.click();
    }

    /**
     * Toggle database auto-drafts cleanup option. 
     */
    toggleDatabaseAutoDraftsCleanUp = async (checked = false) => {
        if (!checked) {
            if (!await this.page.locator(this.selectors.database_auto_drafts.checkbox).isChecked()) {
                return;
            }
        } else {
            if (await this.page.locator(this.selectors.database_auto_drafts.checkbox).isChecked()) {
                return;
            }
        }
        await this.locators.database_auto_drafts.click();
    }

    /**
     * Toggle database trashed posts cleanup option. 
     */
    toggleDatabaseTrashedPostsCleanUp = async (checked = false) => {
        if (!checked) {
            if (!await this.page.locator(this.selectors.database_trashed_posts.checkbox).isChecked()) {
                return;
            }
        } else {
            if (await this.page.locator(this.selectors.database_trashed_posts.checkbox).isChecked()) {
                return;
            }
        }
        await this.locators.database_trashed_posts.click();
    }

    /**
     * Toggle database spam comments cleanup option. 
     */
    toggleDatabaseSpamCommentsCleanUp = async (checked = false) => {
        if (!checked) {
            if (!await this.page.locator(this.selectors.database_spam_comments.checkbox).isChecked()) {
                return;
            }
        } else {
            if (await this.page.locator(this.selectors.database_spam_comments.checkbox).isChecked()) {
                return;
            }
        }
        await this.locators.database_spam_comments.click();
    }

    /**
     * Toggle database trashed comments cleanup option. 
     */
    toggleDatabaseTrashedCommentsCleanUp = async (checked = false) => {
        if (!checked) {
            if (!await this.page.locator(this.selectors.database_trashed_comments.checkbox).isChecked()) {
                return;
            }
        } else {
            if (await this.page.locator(this.selectors.database_trashed_comments.checkbox).isChecked()) {
                return;
            }
        }
        await this.locators.database_trashed_comments.click();
    }

    /**
     * Toggle all transients cleanup option. 
     */
    toggleAllTransientsCleanUp = async (checked = false) => {
        if (!checked) {
            if (!await this.page.locator(this.selectors.database_all_transients.checkbox).isChecked()) {
                return;
            }
        } else {
            if (await this.page.locator(this.selectors.database_all_transients.checkbox).isChecked()) {
                return;
            }
        }
        await this.locators.database_all_transients.click();
    }

    /**
     * Toggle optimize database tables option. 
     */
    toggleOptimizeTables = async (checked = false) => {
        if (!checked) {
            if (!await this.page.locator(this.selectors.database_optimize_tables.checkbox).isChecked()) {
                return;
            }
        } else {
            if (await this.page.locator(this.selectors.database_optimize_tables.checkbox).isChecked()) {
                return;
            }
        }
        await this.locators.database_optimize_tables.click();
    }

    /**
     * Toggle automatic clean-up option. 
     */
    toggleAutomaticCleanUp = async (checked = false) => {
        if (!checked) {
            if (!await this.page.locator(this.selectors.schedule_automatic_cleanup.checkbox).isChecked()) {
                return;
            }
        } else {
            if (await this.page.locator(this.selectors.schedule_automatic_cleanup.checkbox).isChecked()) {
                return;
            }
        }
        await this.locators.schedule_automatic_cleanup.click();
    }

    /**
     * Mass toggle all settings
     */
    toggleEnableAll = async (enable_all = false) => {
        if (enable_all) {
            await this.toggleDatabaseRevisionsCleanUp(true);
            await this.toggleDatabaseAutoDraftsCleanUp(true);
            await this.toggleDatabaseTrashedPostsCleanUp(true);
            await this.toggleDatabaseSpamCommentsCleanUp(true);
            await this.toggleDatabaseTrashedCommentsCleanUp(true);
            await this.toggleAllTransientsCleanUp(true);
            await this.toggleOptimizeTables(true);
            await this.toggleAutomaticCleanUp(true);
            return;
        }

        await this.toggleDatabaseRevisionsCleanUp();
        await this.toggleDatabaseAutoDraftsCleanUp();
        await this.toggleDatabaseTrashedPostsCleanUp();
        await this.toggleDatabaseSpamCommentsCleanUp();
        await this.toggleDatabaseTrashedCommentsCleanUp();
        await this.toggleAllTransientsCleanUp();
        await this.toggleOptimizeTables();
        await this.toggleAutomaticCleanUp();
    }
}