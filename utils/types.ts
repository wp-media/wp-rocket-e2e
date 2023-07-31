import type { Locator } from "@playwright/test";
import type { Page } from "@playwright/test";

/**
 * Start types for selectors.
 */
type Checkbox = {
    element: string,
    target: string,
}

type Textbox = {
    element?: string,
}

type Role = {
    name: string,
    roleTarget: {
        [key: string]: string
    }
}

type Button = {
    target: string
}
/**
 * End types for selectors.
 */

export interface ExportedSettings {
    [key: string]: number;
}

export interface Selectors{
    [key: string]: {
        parent: string,
        elements: {
            [key: string]: {
                checkbox?: Checkbox,
                textbox?: Textbox,
                role?: Role,
                button?: Button,
                before?: (page: Page) => Promise<boolean>,
                after?: (page: Page, state?: boolean) => Promise<void>
            }
        }
    }
}

export interface Selector{
    [key: string]: string;
}

export interface Locators{
    [key: string]: Locator;
}

export type Roles = "alert"|"alertdialog"|"application"|"article"|"banner"|"blockquote"|"button"|"caption"|"cell"|"checkbox"|"code"|"columnheader"|"combobox"|"complementary"|"contentinfo"|"definition"|"deletion"|"dialog"|"directory"|"document"|"emphasis"|"feed"|"figure"|"form"|"generic"|"grid"|"gridcell"|"group"|"heading"|"img"|"insertion"|"link"|"list"|"listbox"|"listitem"|"log"|"main"|"marquee"|"math"|"meter"|"menu"|"menubar"|"menuitem"|"menuitemcheckbox"|"menuitemradio"|"navigation"|"none"|"note"|"option"|"paragraph"|"presentation"|"progressbar"|"radio"|"radiogroup"|"region"|"row"|"rowgroup"|"rowheader"|"scrollbar"|"search"|"searchbox"|"separator"|"slider"|"spinbutton"|"status"|"strong"|"subscript"|"superscript"|"switch"|"tab"|"table"|"tablist"|"tabpanel"|"term"|"textbox"|"time"|"timer"|"toolbar"|"tooltip"|"tree"|"treegrid"|"treeitem";