import type { Page } from "@playwright/test";
import type { Selectors } from "../../utils/types";
import type { Role } from "../../utils/types";
import { selectors as pluginSelectors } from "./selectors";

export class Sections {
  public section: string = "";
  private sectionId: string = "";
  private selectors: Selectors;
  protected page: Page;
  private elements: object;

  /**
   * Instatiate the class.
   *
   * @param page Page object.
   */
  constructor(page: Page) {
    this.page = page;
    this.selectors = pluginSelectors;
  }

  /**
   * Sets the plugin section tests will run on.
   *
   * @param section Plugin Section ID
   *
   * @return Instance of current class.
   */
  public set = (section: string): this => {
    this.section = section;
    this.sectionId = this.selectors[section]["parent"];
    this.elements = this.selectors[section]["elements"];

    return this;
  };

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
  public toggle = async (optionId: string, state: boolean = false ): Promise<void> => {
    this.canPerformAction();

    if (this.propertyExist(optionId, "checkbox") && state && await this.page.locator(this.getStringProperty(optionId, 'checkbox')).isChecked()) {
        return;
    }

    await this.page.locator(this.getStringProperty(optionId, 'target')).click();

    // console.log(this.elements);
    // console.log(this.elements[optionId]);
    // console.log("Option - " + optionId);
    if (this.propertyExist(optionId, "after")) {
        await this.elements[optionId].after(this.page, state);
    }
  }

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

    await this.page.locator(this.getStringProperty(optionId, 'target')).fill(text);
  }

  /**
   * Throws 
   *
   * @return  {void}    [return description]
   */
  private canPerformAction = (): void => {
    if (this.section === "") {
        throw new Error("Section is not defined yet");
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