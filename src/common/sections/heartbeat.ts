import type { Page } from '@playwright/test';

export class heartbeat {
	readonly page: Page;
    readonly locators;

    constructor( page: Page ){
        this.page = page;
        this.locators = {
            'section': this.page.locator('#wpr-nav-heartbeat'),
            'control_heartbeat': this.page.locator('label[for=control_heartbeat]'),
        }
    }

    visit = async () => {
        await this.locators.section.click();
    }

    /**
     * Toggle heartbeat control option. 
     */
    toggleHeartbeatControl = async (checked = false) => {
        // Bail if passed state is currently active.
        if (!checked) {
            if (!await this.page.locator('#control_heartbeat').isChecked()) {
                return;
            }
        } else {
            if (await this.page.locator('#control_heartbeat').isChecked()) {
                return;
            }
        }
        await this.locators.control_heartbeat.click();
    }

    /**
     * Mass toggle all settings
     */
    toggleEnableAll = async (enable_all = false) => {
        if (enable_all) {
            await this.toggleHeartbeatControl(true);
            return;
        }

        await this.toggleHeartbeatControl();
    }
}