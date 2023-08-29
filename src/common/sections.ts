import type { Page } from "@playwright/test";
import type { Selectors } from "../../utils/types";
import type { Roles } from "../../utils/types";

export class Sections {
    /**
     * Plugin section.
     *
     * @property {string}
     */
    public section: string = "";

    /**
     * Section ID.
     *
     * @property {string}
     */
    private sectionId: string = "";

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
     * Instatiate the class.
     *
     * @param page Page object.
     */
    constructor(page: Page, selectors: Selectors) {
        this.page = page;
        this.selectors = selectors;
    }

    /**
     * Sets the plugin section tests will run on.
     *
     * @param section Plugin Section ID
     *
     * @return Current object.
     */
    public set = (section: string): this => {
        this.section = section;
        this.sectionId = this.selectors[section]["parent"];
        this.elements = this.selectors[section]["elements"];

        return this;
    };

    /**
     * Sets the state of option.
     *
     * @param state True if option should be checked; otherwise false.
     *
     * @return Current object.
     */
    public state = (state: boolean): this => {
        this.optionState = state;
        return this;
    }

    /**
     * Visits plugin section.
     *
     * @return  {Promise<void>}
     */
    public visit = async (): Promise<void> => {
        this.canPerformAction();

        await this.page.locator("#wpr-nav-" + this.sectionId).click();
    };

    /**
     * Toggle option
     *
     * @param {string} optionId Option ID
     *
     * @return  {Promise<void>}
     */
    public toggle = async (optionId: string): Promise<void> => {
        this.canPerformAction();

        if (!this.isType(optionId, "checkbox") && !this.isType(optionId, "button")) {
            return;
        }

        if (! await this.page.locator(this.getStringProperty(optionId, 'target')).isVisible()) {
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
    }

    /**
     * Performs a mass toggle action.
     *
     * @return  {Promise<void>}
     */
    public massToggle = async (): Promise<void> => {
        this.canPerformAction();

        for (const key in this.elements) {
            if(this.isType(key, "checkbox")){
                await this.toggle(key);
            }
        }
    }

    /**
     * Fill a textarea or text input.
     *
     * @param optionId Option ID.
     * @param text Text to input.
     *
     * @return  {Promise<void>}
     */
    public fill = async(optionId: string, text: string): Promise<void> => {
        if (this.isType(optionId, "role")) {
            await this.page.getByRole(this.getRole(optionId, 'role'), this.getRoleTarget(optionId, 'role')).fill(text);

            return;
        }

        await this.page.locator(this.getElement(optionId, 'textbox')).fill(text);
    }

    /**
     * Performs a mass fill on textboxes.
     *
     * @param text String or Array of texts.(Array must have a count equal to the numbers of textboxes to be filled)
     *
     * @return  {Promise<void>}
     */
    public massFill = async(text: string | Array<string>): Promise<void> => {
        this.canPerformAction();

        let i = 0;

        for (const key in this.elements) {
            if(this.isType(key, "textbox")){
                await this.fill(key, Array.isArray(text) ? text[i] : text);
            }

            i++;
        }
    }

    /**
     * Check options state for a section.
     *
     * @return True if all options are disabled for current section; otherwise false.
     */
    public areOptionsDisabled = async (): Promise<boolean> => {
        this.canPerformAction();

        for (const key in this.elements) {
            if(this.isType(key, "checkbox")){
                if (await this.page.locator(this.getElement(key, 'checkbox')).isChecked()) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Check filled state for textboxes in sections.
     *
     * @return True if all textboxes are not filled; otherwise false.
     */
    public areTextBoxesEmpty = async (): Promise<boolean> => {
        this.canPerformAction();

        for (const key in this.elements) {
            if(this.isType(key, "textbox")){
                if (await this.page.locator(this.getElement(key, 'textbox')).inputValue() !== '') {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Validates if actions can be performed.
     *
     * @return  {void}
     */
    private canPerformAction = (): void => {
        if (this.section === "") {
            throw new Error("Section is not defined yet.");
        }

        if (this.selectors[this.section] === undefined){
            throw new Error("Section is invalid.");
        }
    }

     /**
     * Checks if a type exist for the current option object literal.
     *
     * @param optionId Option ID
     * @param type Type property.
     *
     * @return True if property exist; otherwise false.
     */
     private isType = (optionId: string, type: string): boolean => {
        if (this.elements[optionId]["type"] === type) {
            return true;
        }

        return false;
    }

   /**
     * Checks if a property exist for the current option object literal.
     *
     * @param optionId Option ID
     * @param property Property name.
     *
     * @return True if property exist; otherwise false.
     */
   private propertyExist = (optionId: string, property: string): boolean => {
        if (this.elements[optionId][property] !== undefined) {
            return true;
        }

        return false;
    }

    /**
     * Gets the property value.
     *
     * @param optionId Option ID
     * @param type Property name.
     *
     * @return Property value in string.
     */
    public getStringProperty = (optionId: string, property: string): string => {
        if (!this.propertyExist(optionId, property)) {
            throw new Error("Property " + property + " does not exist for this option " + optionId + ".");
        }

        return this.elements[optionId][property];
    }

    /**
     * Gets the element value.
     *
     * @param optionId Option ID
     * @param type Type property.
     *
     * @return Element value in string.
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
     * Gets the Role property value.
     *
     * @param optionId Option ID
     * @param type Type property.
     *
     * @return Property value in Role.
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
     * Gets the role target value.
     *
     * @param optionId Option ID
     * @param type Type property.
     *
     * @return Role target value in object.
     */
    private getRoleTarget = (optionId: string, type: string): object => {
        if (!this.isType(optionId, type)) {
            throw new Error("Type " + type + " does not exist for this option.");
        }

        return this.elements[optionId]["roleTarget"];
    }
}