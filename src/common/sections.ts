import type { Page } from "@playwright/test";
import type { Selectors } from "../../utils/types";
import type { Role } from "../../utils/types";

export class Sections {
  public section: string = "";
  private sectionId: string = "";
  private selectors: Selectors;
  protected page: Page;
  private elements: object;
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
   * @param state True if option should be checked; false otherwise.
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
   * @return  {<Promise><void>}
   */
  public visit = async (): Promise<void> => {
    this.canPerformAction();

    await this.page.locator("#wpr-nav-" + this.sectionId).click();
  };

 /**
  * Toggle option
  *
  * @param optionId Option ID
  *
  * @return  {Promise<void>}
  */
  public toggle = async (optionId: string): Promise<void> => {
    this.canPerformAction();

    if(this.propertyExist(optionId, "checkbox")) {
        if (this.optionState && await this.page.locator(this.getStringProperty(optionId, 'checkbox')).isChecked()) {
            return;
        }

        if (!this.optionState && !await this.page.locator(this.getStringProperty(optionId, 'checkbox')).isChecked()) {
            return;
        }
    }

    if (this.propertyExist(optionId, "checkbox") && this.optionState && await this.page.locator(this.getStringProperty(optionId, 'checkbox')).isChecked()) {
        return;
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
        if(this.propertyExist(key, "checkbox")){
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
    if (this.propertyExist(optionId, "role")) {
        await this.page.getByRole(this.getRoleProperty(optionId, 'role'), this.getObjectProperty(optionId, 'roleTarget')).fill(text);

        return;
    }

    await this.page.locator(this.getStringProperty(optionId, 'textbox')).fill(text);
  }

  /**
   * Performs a mass fill on textboxes.
   *
   * @param text String or Array of texts.(Array must have a count equal to the numbers of textboxes to be filled)
   *
   * @return  {<Promise><void>}
   */
  public massFill = async(text: string | Array<string>): Promise<void> => {
    this.canPerformAction();

    let i = 0;

    for (const key in this.elements) {
        if(this.propertyExist(key, "textbox")){
            await this.fill(key, Array.isArray(text) ? text[i] : text);
        }

        i++;
    }
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
  }

  /**
   * Checks if a property exist for the current option object literal.
   *
   * @param optionId Option ID
   * @param property Property name.
   *
   * @return True if property exist; false otherwise.
   */
  private propertyExist = (optionId: string, property: string): boolean => {
    if (this.elements[optionId][property] !== undefined) {
        return true;
    }

    return false;
  }

  /**
   * Gets the string property value.
   *
   * @param optionId Option ID
   * @param property Property name.
   *
   * @return Property value in string.
   */
  private getStringProperty = (optionId: string, property: string): string => {
    if (!this.propertyExist(optionId, property)) {
        throw new Error(property + ' does not exist for this option.');
    }

    return this.elements[optionId][property];
  }

  /**
   * Gets the Role property value.
   *
   * @param optionId Option ID
   * @param property Property name.
   *
   * @return Property value in Role.
   */
  private getRoleProperty = (optionId: string, property: string): Role => {
    if (!this.propertyExist(optionId, property)) {
        throw new Error(property + ' does not exist for this option.');
    }

    return this.elements[optionId][property];
  }

  /**
   * Gets the object property value.
   *
   * @param optionId Option ID
   * @param property Property name.
   *
   * @return Property value in object.
   */
  private getObjectProperty = (optionId: string, property: string): object => {
    if (!this.propertyExist(optionId, property)) {
        throw new Error(property + ' does not exist for this option.');
    }

    return this.elements[optionId][property];
  }
}