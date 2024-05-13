/**
 * @fileoverview
 * This file defines a class representing sections in WP Rocket settings for Playwright tests.
 * It includes methods for interacting with different sections, toggling options, filling textboxes,
 * performing mass actions, and checking option states.
 *
 * @typedef {import('@playwright/test').Page} Page
 * @typedef {import('../../utils/types').Selectors} Selectors
 * @typedef {import('../../utils/types').Roles} Roles
 * @typedef {import('../../utils/types').Section} Section
 * @typedef {import('../../utils/types').SectionId} SectionId
 *
 * @class Sections
 * @property {Section} section - The current plugin section.
 * @property {SectionId} sectionId - The ID of the current plugin section.
 * @property {Selectors} selectors - Element selectors.
 * @property {Page} page - The Playwright page instance.
 * @property {object} elements - Section element selectors.
 * @property {boolean} optionState - Option state (enabled or disabled).
 */
import type { Page } from "@playwright/test";
import type { Selectors, Roles, Section, SectionId  } from "../../utils/types";

/**
 * Class representing sections in WP Rocket settings for Playwright tests.
 *
 * @class
 */
export class Sections {
    /**
     * Plugin section.
     *
     * @property {string}
     */
    public section: Section;

    /**
     * Section ID.
     *
     * @property {string}
     */
    private sectionId: SectionId;

    /**
     * Element selectors.
     *
     * @var {Selectors}
     */
    private selectors: Selectors;

    /**
     * Page instance.
     *
     * @var {Page}
     */
    protected page: Page;

    /**
     * Section element selectors.
     *
     * @var {object}
     */
    private elements: object;

    /**
     * Option state.
     *
     * @var {boolean}
     */
    public optionState: boolean = false;

    /**
     * Constructor for Sections class.
     *
     * @constructor
     * @param {Page} page - The Playwright page instance.
     * @param {Selectors} selectors - Element selectors.
     */
    constructor(page: Page, selectors: Selectors) {
        this.page = page;
        this.selectors = selectors;
    }

    /**
     * Sets the plugin section on which tests will run.
     *
     * @method
     * @param {Section} section - The Plugin Section ID.
     * @returns {this} - The current object for method chaining.
     * @throws {Error} - Throws an error if the provided section is invalid.
     */
    public set = (section: Section): this => {
        this.section = section;
        this.sectionId = this.selectors[section]["parent"];
        this.elements = this.selectors[section]["elements"];

        return this;
    };

    /**
     * Sets the state of an option.
     *
     * @method
     * @param {boolean} state - True if the option should be checked; otherwise false.
     * @returns {this} - The current object for method chaining.
     */
    public state = (state: boolean): this => {
        this.optionState = state;
        return this;
    }

    /**
     * Visits the plugin section on the current page.
     *
     * @method
     * @async
     * @return {Promise<void>} - A promise that resolves once the visit operation is complete.
     */
    public visit = async (): Promise<void> => {
        try {
            this.canPerformAction();

            await this.page.locator("#wpr-nav-" + this.sectionId).click();
        } catch (error) {
            if (error instanceof Error) {
                // Handle the error
                console.error("An error occurred:", error.message);
                return;
            }

            // Handle other types of errors
            console.error("An unknown error occurred");
        }
    };

    /**
     * Checks if the current section exists.
     *
     * @method
     * @async
     * @return {Promise<boolean>} - A promise that resolves with true if the section exists; otherwise, resolves with false.
     */
    public doesSectionExist = async (section: Section): Promise<boolean> => {
        return await this.page.locator("#wpr-nav-" + this.selectors[section]["parent"]).isVisible();
    }

    /**
     * Toggles the state of an option identified by the provided option ID.
     * If the option is a checkbox or a button, and it is visible and not disabled, the state will be toggled.
     *
     * @method
     * @async
     * @param {string} optionId - The ID of the option to be toggled.
     * @return {Promise<void>} - A promise that resolves once the toggle operation is complete.
     * if the target element is not visible or is disabled, or if there is an issue with performing the action.
     */
    public toggle = async (optionId: string): Promise<void> => {
        try {
            this.canPerformAction();

            if (!this.isType(optionId, "checkbox") && !this.isType(optionId, "button")) {
                return;
            }

            if (! await this.page.locator(this.getStringProperty(optionId, 'target')).isVisible()) {
                return;
            }

            if (await this.page.locator(this.getStringProperty(optionId, 'target')).isDisabled()) {
                return;
            }

            if(this.isType(optionId, "checkbox")) {
                if (this.optionState && await this.page.locator(this.getElement(optionId, 'checkbox')).isChecked()) {
                    return;
                }

                if (!this.optionState && !await this.page.locator(this.getElement(optionId, 'checkbox')).isChecked()) {
                    return;
                }
            }

            if (this.propertyExist(optionId, "before") && !await this.elements[optionId].before(this.page)) {
                return;
            }

            await this.page.locator(this.getStringProperty(optionId, 'target')).click();

            if (this.propertyExist(optionId, "after")) {
                await this.elements[optionId].after(this.page, this.optionState);
            }
        } catch (error) {
            if (error instanceof Error) {
                // Handle the error
                console.error("An error occurred:", error.message);
                return;
            }

            // Handle other types of errors
            console.error("An unknown error occurred");
        }
    }

    /**
     * Performs a mass toggle action on all checkboxes in the current section.
     * If the checkboxes are visible and not disabled, their state will be toggled.
     *
     * @method
     * @async
     * @return {Promise<void>} - A promise that resolves once the mass toggle operation is complete.
     */
    public massToggle = async (): Promise<void> => {
        try {
            this.canPerformAction();

            for (const key in this.elements) {
                if(this.isType(key, "checkbox")){
                    await this.toggle(key);
                }
            }
        } catch (error) {
            if (error instanceof Error) {
                // Handle the error
                console.error("An error occurred:", error.message);
                return;
            }

            // Handle other types of errors
            console.error("An unknown error occurred");
        }
    }

    /**
     * Fills a textarea or text input identified by the provided option ID with the specified text.
     * If the option is of type 'role', it uses Playwright's `getByRole` method to fill the role-targeted element.
     *
     * @method
     * @async
     * @param {string} optionId - The ID of the option to be filled.
     * @param {string} text - The text to input.
     * @return {Promise<void>} - A promise that resolves once the fill operation is complete.
     */
    public fill = async(optionId: string, text: string): Promise<void> => {
        if (this.isType(optionId, "role")) {
            await this.page.getByRole(this.getRole(optionId, 'role'), this.getRoleTarget(optionId, 'role')).fill(text);

            return;
        }

        await this.page.locator(this.getElement(optionId, 'textbox')).fill(text);
    }

    /**
     * Performs a mass fill operation on textboxes in the current section.
     * If the 'text' parameter is a string, it will be applied to all textboxes.
     * If it is an array of strings, each element of the array will be applied to the corresponding textbox.
     *
     * @method
     * @async
     * @param {string | Array<string>} text - The text or array of texts to be filled in textboxes.
     * @return {Promise<void>} - A promise that resolves once the mass fill operation is complete.
     */
    public massFill = async(text: string | Array<string>): Promise<void> => {
        try {
            this.canPerformAction();

            let i = 0;

            for (const key in this.elements) {
                if(this.isType(key, "textbox")){
                    await this.fill(key, Array.isArray(text) ? text[i] : text);
                }

                i++;
            }
        } catch (error) {
            if (error instanceof Error) {
                // Handle the error
                console.error("An error occurred:", error.message);
                return;
            }

            // Handle other types of errors
            console.error("An unknown error occurred");
        }
        
    }

    /**
     * Checks the state of checkboxes in the current section to determine if all options are disabled.
     * If any checkbox is visible, not disabled, and checked, the method returns false; otherwise, it returns true.
     *
     * @method
     * @async
     * @return {Promise<boolean>} - A promise that resolves with true if all options are disabled; otherwise, resolves with false.
     */
    public areOptionsDisabled = async (): Promise<boolean> => {
        try {
            this.canPerformAction();

            for (const key in this.elements) {
                if(this.isType(key, "checkbox")){
                    if (! await this.page.locator(this.getStringProperty(key, 'target')).isVisible()) {
                        continue;
                    }
            
                    if (await this.page.locator(this.getStringProperty(key, 'target')).isDisabled()) {
                        continue;
                    }
    
                    if (await this.page.locator(this.getElement(key, 'checkbox')).isChecked()) {
                        return false;
                    }
                }
            }
    
            return true;

        } catch (error) {
            if (error instanceof Error) {
                // Handle the error
                console.error("An error occurred:", error.message);
                return;
            }

            // Handle other types of errors
            console.error("An unknown error occurred");
        }
    }

    /**
     * Checks the filled state of textboxes in the current section to determine if all textboxes are not filled.
     * If any textbox has a non-empty input value, the method returns false; otherwise, it returns true.
     *
     * @method
     * @async
     * @return {Promise<boolean>} - A promise that resolves with true if all textboxes are empty; otherwise, resolves with false.
     */
    public areTextBoxesEmpty = async (): Promise<boolean> => {
        try {
            this.canPerformAction();

            for (const key in this.elements) {
                if(this.isType(key, "textbox")){
                    if (await this.page.locator(this.getElement(key, 'textbox')).inputValue() !== '') {
                        return false;
                    }
                }
            }

            return true;
            
        } catch (error) {
            if (error instanceof Error) {
                // Handle the error
                console.error("An error occurred:", error.message);
                return;
            }

            // Handle other types of errors
            console.error("An unknown error occurred");
        }
        
    }

    /**
     * Validates if actions can be performed by checking if the current section is valid.
     *
     * @private
     * @method
     * @return {void}
     */
    private canPerformAction = (): void => {
        if (this.selectors[this.section] === undefined){
            throw new Error("Section is invalid.");
        }
    }

     /**
     * Checks if a specific type exists for the current option in the object literal.
     *
     * @private
     * @method
     * @param {string} optionId - The ID of the option to check.
     * @param {string} type - The type property to compare.
     * @return {boolean} - Returns true if the specified type property exists for the given option; otherwise, returns false.
     */
     private isType = (optionId: string, type: string): boolean => {
        if (this.elements[optionId]["type"] === type) {
            return true;
        }

        return false;
    }

    /**
     * Checks if a specific property exists for the current option in the object literal.
     *
     * @private
     * @method
     * @param {string} optionId - The ID of the option to check.
     * @param {string} property - The property name to check for existence.
     * @return {boolean} - Returns true if the specified property exists for the given option; otherwise, returns false.
     */
   private propertyExist = (optionId: string, property: string): boolean => {
        if (this.elements[optionId][property] !== undefined) {
            return true;
        }

        return false;
    }

    /**
     * Gets the string value of a specific property for the current option in the object literal.
     *
     * @method
     * @param {string} optionId - The ID of the option to retrieve the property from.
     * @param {string} property - The property name to retrieve.
     * @return {string} - Returns the string value of the specified property for the given option.
     */
    public getStringProperty = (optionId: string, property: string): string => {
        if (!this.propertyExist(optionId, property)) {
            throw new Error("Property " + property + " does not exist for this option " + optionId + ".");
        }

        return this.elements[optionId][property];
    }

    /**
     * Gets the element value for the specified type of the current option in the object literal.
     *
     * @private
     * @method
     * @param {string} optionId - The ID of the option to retrieve the element from.
     * @param {string} type - The type property to validate.
     * @return {string} - Returns the string value of the element property for the given option.
     */
    private getElement = (optionId: string, type: string): string => {
        if (!this.isType(optionId, type)) {
            throw new Error("Type " + type + " does not exist for this option.");
        }

        if (this.elements[optionId]["element"] === undefined) {
            throw new Error('Element does not exist.');
        }

        return this.elements[optionId]["element"];
    }

    /**
     * Gets the Role property value for the specified type of the current option in the object literal.
     *
     * @private
     * @method
     * @param {string} optionId - The ID of the option to retrieve the Role from.
     * @param {string} type - The type property to validate.
     * @return {Roles} - Returns the Role property value for the given option.
     */
    private getRole = (optionId: string, type: string): Roles => {
        if (!this.isType(optionId, type)) {
            throw new Error("Type " + type + " does not exist for this option.");
        }

        if (this.elements[optionId]["name"] === undefined) {
            throw new Error('Role does not exist.');
        }

        return this.elements[optionId]["name"];
    }

    /**
     * Gets the role target value for the specified type of the current option in the object literal.
     *
     * @private
     * @method
     * @param {string} optionId - The ID of the option to retrieve the role target from.
     * @param {string} type - The type property to validate.
     * @return {object} - Returns the role target value in an object for the given option.
     */
    private getRoleTarget = (optionId: string, type: string): object => {
        if (!this.isType(optionId, type)) {
            throw new Error("Type " + type + " does not exist for this option.");
        }

        return this.elements[optionId]["roleTarget"];
    }
}