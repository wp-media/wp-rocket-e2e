import type { Page } from '@playwright/test';

export class media {
	readonly page: Page;
    readonly selectors;
    readonly locators;

    constructor( page: Page ){
        this.page = page;

        this.selectors = {
            'section': '#wpr-nav-media',
            'lazyload': {
                'checkbox': '#lazyload',
                'enable': 'label[for=lazyload]',
            },
            'lazyload_iframes': {
                'checkbox': '#lazyload_iframes',
                'enable': 'label[for=lazyload_iframes]'
            },
            'lazyload_youtube': {
                'checkbox': '#lazyload_youtube',
                'enable': 'label[for=lazyload_youtube]',
            },
            'image_dimensions': {
                'checkbox': '#image_dimensions',
                'enable': 'label[for=image_dimensions]'
            }
        };

        this.locators = {
            'section': this.page.locator(this.selectors.section),
            'lazyload': this.page.locator(this.selectors.lazyload.enable),
            'lazyload_iframes': this.page.locator(this.selectors.lazyload_iframes.enable),
            'lazyload_youtube': this.page.locator(this.selectors.lazyload_youtube.enable),
            'image_dimensions': this.page.locator(this.selectors.image_dimensions.enable)
        };
    }

    visit = async () => {
        await this.locators.section.click();
    }

    /**
     * Toggle lazyload option.
     */
    toggleLazyLoad = async (checked = false) => {
        // Bail if passed state is currently active.
        if (!checked) {
            if (!await this.page.locator(this.selectors.lazyload.checkbox).isChecked()) {
                return;
            }
        } else {
            if (await this.page.locator(this.selectors.lazyload.checkbox).isChecked()) {
                return;
            }
        }

        await this.locators.lazyload.click();
    }

    /**
     * Toggle lazyload iframes option.
     */
    toggleLazyLoadIframes = async (checked = false) => {
        // Bail if passed state is currently active.
        if (!checked) {
            if (!await this.page.locator(this.selectors.lazyload_iframes.checkbox).isChecked()) {
                return;
            }
        } else {
            if (await this.page.locator(this.selectors.lazyload_iframes.checkbox).isChecked()) {
                return;
            }
        }

        await this.locators.lazyload_iframes.click();
    }

    /**
     * Toggle replace youtube preview option.
     */
    toggleLazyLoadyoutube = async (checked = false) => {
        if (! await this.page.locator(this.selectors.lazyload_iframes.checkbox).isChecked()) {
            return;
        }

        // Bail if passed state is currently active.
        if (!checked) {
            if (!await this.page.locator(this.selectors.lazyload_youtube.checkbox).isChecked()) {
                return;
            }
        } else {
            if (await this.page.locator(this.selectors.lazyload_youtube.checkbox).isChecked()) {
                return;
            }
        }
        
        await this.locators.lazyload_youtube.click();
    }

    /**
     * Toggle image dimension option.
     */
    toggleImageDimension = async (checked = false) => {
        // Bail if passed state is currently active.
        if (!checked) {
            if (!await this.page.locator(this.selectors.image_dimensions.checkbox).isChecked()) {
                return;
            }
        } else {
            if (await this.page.locator(this.selectors.image_dimensions.checkbox).isChecked()) {
                return;
            }
        }
        await this.locators.image_dimensions.click();
    }

    /**
     * Return default: false when no option in section is enabled
     */
     checkAnyEnabledOption = async () => {
        if (await this.page.isChecked(this.selectors.lazyload.checkbox)) {
            return true;
        }

        if (await this.page.isChecked(this.selectors.lazyload_iframes.checkbox)) {
            return true;
        }

        if (await this.page.isChecked(this.selectors.lazyload_youtube.checkbox)) {
            return true;
        }

        return false;
    }

    /**
     * Mass toggle all settings
     */
    toggleEnableAll = async (enable_all = false) => {
        if (enable_all) {
            await this.toggleLazyLoad(true);
            await this.toggleLazyLoadIframes(true);
            await this.toggleLazyLoadyoutube(true);
            await this.toggleImageDimension(true);
            return;
        }

        await this.toggleLazyLoad();
        await this.toggleLazyLoadIframes();
        await this.toggleLazyLoadyoutube();
        await this.toggleImageDimension();
    }
}