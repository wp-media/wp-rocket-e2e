import {IWorldOptions, setWorldConstructor, World} from "@cucumber/cucumber";
import {BrowserContext, Page} from "@playwright/test";
import {Sections} from "../../common/sections";
import {PageUtils} from "../../../utils/page-utils";
import {Pickle} from "@cucumber/messages/dist/esm/src";
import {Section} from "../../../utils/types";
import {BackupRowData} from "../utils/types";
import {StorageUtils} from "../utils/storage";

export interface ICustomWorld extends World {
    context?: BrowserContext;
    page?: Page;
    sections?: Sections;
    utils?: PageUtils;
    pickle?: Pickle;
    wprSection?: Section;
    wprOption?: string;
    initialBackups?: BackupRowData[];
    storage?: StorageUtils;
}

export class CustomWorld extends World implements ICustomWorld {
    constructor(options: IWorldOptions) {
        super(options)
    }
}

setWorldConstructor(CustomWorld)