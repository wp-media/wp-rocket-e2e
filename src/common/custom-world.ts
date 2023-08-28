import { IWorldOptions, World, setWorldConstructor } from '@cucumber/cucumber'
import { BrowserContext, Page } from '@playwright/test'
import { Sections } from './sections';
import { PageUtils } from '../../utils/page-utils';

export interface ICustomWorld extends World {
	context?: BrowserContext;
	page?: Page;
    sections?: Sections;
    utils?: PageUtils
}

export class CustomWorld extends World implements ICustomWorld {
	constructor(options: IWorldOptions) {
		super(options)
	}
}

setWorldConstructor(CustomWorld)