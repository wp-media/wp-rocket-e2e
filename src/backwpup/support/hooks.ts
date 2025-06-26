import { ICustomWorld } from "../common/custom-world";
import { Sections } from '../../common/sections';
import { selectors as pluginSelectors } from "./../../common/selectors";
import { PageUtils } from "../../../utils/page-utils";
import { Before } from "@cucumber/cucumber";
import {StorageUtils} from "../utils/storage";


/**
 * Before each test scenario with the @bwupsetup tag, performs setup tasks.
 */
Before({tags: '@bwupsetup'}, async function(this: ICustomWorld, {pickle}) {

    this.page = await this.context.newPage();
    this.sections = new Sections(this.page, pluginSelectors);
    this.utils = new PageUtils(this.page, this.sections);
    this.storage = new StorageUtils(this.page, this.sections);

    this.pickle = pickle;
});