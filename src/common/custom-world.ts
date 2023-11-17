/**
 * @fileoverview
 * This file defines a custom world class for Cucumber.js tests, integrating with Playwright.
 * The custom world class extends the default Cucumber.js World class and includes additional properties
 * for browser context, page, sections, and utility functions.
 *
 * @typedef {import('@cucumber/cucumber').IWorldOptions} IWorldOptions
 * @typedef {import('@cucumber/cucumber').World} World
 * @typedef {import('@playwright/test').BrowserContext} BrowserContext
 * @typedef {import('@playwright/test').Page} Page
 * @typedef {import('./sections').Sections} Sections
 * @typedef {import('../../utils/page-utils').PageUtils} PageUtils
 *
 * @interface ICustomWorld
 * @extends {World}
 * @property {BrowserContext} [context] - The Playwright browser context.
 * @property {Page} [page] - The Playwright page.
 * @property {Sections} [sections] - An instance of the 'Sections' class.
 * @property {PageUtils} [utils] - An instance of the 'PageUtils' class for utility functions.
 *
 * @class CustomWorld
 * @extends {World}
 * @implements {ICustomWorld}
 * @param {IWorldOptions} options - The options for configuring the world.
 */
import { IWorldOptions, World, setWorldConstructor } from '@cucumber/cucumber';
import { BrowserContext, Page } from '@playwright/test';
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