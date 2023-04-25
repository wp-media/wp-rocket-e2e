import type { Page } from '@playwright/test';

export class fileOptimization {
	readonly page: Page;
    readonly selectors;
    readonly locators;

    constructor( page: Page ){
        this.page = page;

        this.selectors = {
            'minify_css': {
                'checkbox': '#minify_css',
                'enable': 'label[for=minify_css]',
                'activate': 'text=Activate minify CSS'
            },
            'combine_css': {
                'checkbox': '#minify_concatenate_css',
                'enable': 'label[for=minify_concatenate_css]',
                'activate': 'text=Activate combine CSS'
            },
            'optimize_css_delivery':{
                'checkbox': '#optimize_css_delivery',
                'enable': 'label[for=optimize_css_delivery]',
            },
            'rucss': {
                'enable': '#wpr-radio-remove_unused_css',
                'activate': 'text=Activate Remove Unused CSS'
            },
            'minify_js': {
                'checkbox': '#minify_js',
                'enable': 'label[for=minify_js]',
                'activate': 'text=Activate minify JavaScript'
            },
            'combine_js': {
                'checkbox': '#minify_concatenate_js',
                'enable': 'label[for=minify_concatenate_js]',
                'activate': 'text=Activate combine JavaScript'
            },
            'defer_js': {
                'checkbox': '#defer_all_js',
                'enable': 'label[for=defer_all_js]',
            },
            'delay_js': {
                'checkbox': '#delay_js',
                'enable': 'label[for=delay_js]',
            }
        };
        
        this.locators = {
            'section': this.page.locator('#wpr-nav-file_optimization'),
            'minify_css': {
                'enable': this.page.locator(this.selectors.minify_css.enable),
                'activate': this.page.locator(this.selectors.minify_css.activate)
            },
            'combine_css': {
                'enable': this.page.locator(this.selectors.combine_css.enable),
                'activate': this.page.locator(this.selectors.combine_css.activate)
            },
            'optimize_css_delivery': {
                'enable': this.page.locator(this.selectors.optimize_css_delivery.enable)
            },
            'rucss': {
                'enable': this.page.locator(this.selectors.rucss.enable),
                'activate': this.page.locator(this.selectors.rucss.activate)
            },
            'minify_js': {
                'enable': this.page.locator(this.selectors.minify_js.enable),
                'activate': this.page.locator(this.selectors.minify_js.activate)
            },
            'combine_js': {
                'enable': this.page.locator(this.selectors.combine_js.enable),
                'activate': this.page.locator(this.selectors.combine_js.activate)
            },
            'defer_js': {
                'enable': this.page.locator(this.selectors.defer_js.enable),
            },
            'delay_js': {
                'enable': this.page.locator(this.selectors.delay_js.enable),
            }
        }
    }

    /**
     * Visit section.
     */
    visit = async () => {
        await this.locators.section.click();
    }

    /**
     * Enable Minify css option.
     */
    enableMinifiyCss = async () => {
        await this.locators.minify_css.enable.click();
        await this.locators.minify_css.activate.click();
    }

    /**
     * Toggle minify css option.
     */
    toggleMinifyCss = async (checked = false) => {
        // Bail if passed state is currently active.
        if (!checked) {
            if (!await this.page.locator(this.selectors.minify_css.checkbox).isChecked()) {
                return;
            }
        } else {
            if (await this.page.locator(this.selectors.minify_css.checkbox).isChecked()) {
                return;
            }
        }

        await this.locators.minify_css.enable.click();

        if (checked) {
            await this.page.waitForSelector(this.selectors.minify_css.activate);
            await this.locators.minify_css.activate.click();
        }
    }

    /**
     * Toggle combine css option.
     */
    toggleCombineCss = async (checked = false) => {
        // Bail if combine css is disabled.
        if (!await this.page.isEnabled(this.selectors.combine_css.checkbox)) {
            return;
        }

         // Bail if passed state is currently active.
         if (!checked) {
            if (!await this.page.locator(this.selectors.combine_css.checkbox).isChecked()) {
                return;
            }
        } else {
            if (await this.page.locator(this.selectors.combine_css.checkbox).isChecked()) {
                return;
            }
        }

        await this.locators.combine_css.enable.click();

        if (checked) {
            await this.page.waitForSelector(this.selectors.combine_css.activate);
            await this.locators.combine_css.activate.click();
        }
    }

    /**
     * Toggle optimize css delivery option.
     */
    toggleOptimizeCssDelivery = async (checked = false) => {
        // Bail if passed state is currently active.
        if (!checked) {
            if (!await this.page.locator(this.selectors.optimize_css_delivery.checkbox).isChecked()) {
                return;
            }
        } else {
            if (await this.page.locator(this.selectors.optimize_css_delivery.checkbox).isChecked()) {
                return;
            }
        }

        await this.locators.optimize_css_delivery.enable.click();
    }

    /**
     * Enable RUCSS.
     */
    enableRucss = async () => {
        await this.page.waitForSelector(this.selectors.rucss.activate);
        await this.locators.rucss.activate.click();
    }

    /**
     * Toggle minify js option.
     */
    toggleMinifyJs = async (checked = false) => {
        // Bail if passed state is currently active.
        if (!checked) {
            if (!await this.page.locator(this.selectors.minify_js.checkbox).isChecked()) {
                return;
            }
        } else {
            if (await this.page.locator(this.selectors.minify_js.checkbox).isChecked()) {
                return;
            }
        }

        await this.locators.minify_js.enable.click();

        if (checked) {
            await this.page.waitForSelector(this.selectors.minify_js.activate);
            await this.locators.minify_js.activate.click();
        }
    }

    /**
     * Toggle combine js option.
     */
    toggleCombineJs = async (checked = false) => {
        // Bail if combine js is disabled.
        if (!await this.page.isEnabled(this.selectors.combine_js.checkbox)) {
            return;
        }

        // Bail if passed state is currently active.
        if (!checked) {
           if (!await this.page.locator(this.selectors.combine_js.checkbox).isChecked()) {
               return;
           }
       } else {
           if (await this.page.locator(this.selectors.combine_js.checkbox).isChecked()) {
               return;
           }
       }

       await this.locators.combine_js.enable.click();

       if (checked) {
           await this.page.waitForSelector(this.selectors.combine_js.activate);
           await this.locators.combine_js.activate.click();
       }
   }

    /**
     * Toggle defer js option.
     */
    toggleDeferJs = async (checked = false) => {
         // Bail if passed state is currently active.
        if (!checked) {
            if (!await this.page.locator(this.selectors.defer_js.checkbox).isChecked()) {
                return;
            }
        } else {
            if (await this.page.locator(this.selectors.defer_js.checkbox).isChecked()) {
                return;
            }
        }
        await this.locators.defer_js.enable.click();
    }

    /**
     * Toggle delay js option.
     */
     toggleDelayJs = async (checked = false) => {
         // Bail if passed state is currently active.
        if (!checked) {
            if (!await this.page.locator(this.selectors.delay_js.checkbox).isChecked()) {
                return;
            }
        } else {
            if (await this.page.locator(this.selectors.delay_js.checkbox).isChecked()) {
                return;
            }
        }
        await this.locators.delay_js.enable.click();
    }

    /**
     * Enable combine css option.
     */
    enableCombineCss = async () => {
        if (!await this.page.isEnabled(this.selectors.combine_css.checkbox)) {
            return;
        }

        await this.locators.combine_css.enable.click();
        await this.locators.combine_css.activate.click();
    }


    /**
     * Enable minify js option.
     */
    enableMinifyJs = async () => {
        await this.locators.minify_js.enable.click();
        await this.locators.minify_js.activate.click();
    }

    /**
     * Enable combine js option.
     */
    enableCombineJs = async () => {
        if (!await this.page.isEnabled(this.selectors.combine_js.checkbox)) {
            return;
        }
        
        await this.locators.combine_js.enable.click();
        await this.locators.combine_js.activate.click();
    }

    /**
     * Return default: false when no option in section is enabled
     * 
     * @returns bool
     */
    checkAnyEnabledOption = async () => {
        if (await this.page.isChecked(this.selectors.minify_css.checkbox)) {
            return true;
        }

        if (await this.page.isChecked(this.selectors.combine_css.checkbox)) {
            return true;
        }

        if (await this.page.isChecked(this.selectors.minify_js.checkbox)) {
            return true;
        }

        if (await this.page.isChecked(this.selectors.defer_js.checkbox)) {
            return true;
        }

        if (await this.page.isChecked(this.selectors.delay_js.checkbox)) {
            return true;
        }

        return false;
    }

     /**
     * Mass toggle all settings
     */
     toggleEnableAll = async (enable_all = false) => {
        if (enable_all) {
            await this.toggleMinifyCss(true);
            await this.toggleCombineCss(true);
            await this.toggleOptimizeCssDelivery(true);
            await this.enableRucss();
            await this.toggleMinifyJs(true);
            await this.toggleCombineJs(true);
            await this.toggleDeferJs(true);
            await this.toggleDelayJs(true);
            return;
        }

        await this.toggleMinifyCss();
        await this.toggleMinifyCss();
        await this.toggleOptimizeCssDelivery();
        await this.enableRucss();
        await this.toggleMinifyJs();
        await this.toggleCombineJs();
        await this.toggleDeferJs();
        await this.toggleDelayJs();
    }
}