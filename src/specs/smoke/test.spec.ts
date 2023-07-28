import { test } from '../../common/fixtures';


const tests = (): void => {
    test('test refactor', async ( { sections, utils } ) => {

        // Visit WPR settings
        await utils.gotoWpr();    
        await sections.set("fileOptimization").visit()
        await sections.state(true).massToggle();

        await sections.set("media").visit()
        // await sections.toggle("lazyload");
        await sections.massToggle();

        await sections.set("cdn").visit()
        // await sections.toggle("cdn");
        await sections.massToggle();
        await sections.fill("cnames", "test.example.com");

        await sections.set("advancedRules").visit();
        await sections.massFill([
            "hello",
            "world",
            "all",
            "is",
            "well"
        ])

        await utils.saveSettings();
    });
}

export default tests;