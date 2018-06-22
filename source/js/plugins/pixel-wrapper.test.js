// jshint ignore:start

const {Builder, By, Key, until} = require('selenium-webdriver');
const firefox = require('selenium-webdriver/firefox');
// this is a Pixel.js job in Rodan
const url = 'http://132.206.14.127:8000/interactive/bb128fdf-b30a-4322-ac87-a475ec5347ff/cc44d5d2-d811-439c-9483-f2df08c63501/';

jest.setTimeout('45000');

var browser = null;

beforeAll(async () => {
    // Set up the webdriver
    let options = new firefox.Options()
        .headless()
        .windowSize({height: 1920, width: 1200}); // line currently doesn't work for some reason
    browser = await new Builder()
        .forBrowser('firefox')
        .setFirefoxOptions(options)
        .build();

    await browser.get(url);
});

afterAll(() => {
    browser.quit();
});

describe('Check Proper Plugin Creation', () => {
    var pluginIcon;

    test('page title matches', async () => {
        let title = await browser.getTitle();
        expect(title).toBe('Pixel.js');
    });

    test('plugin icon exists', async () => {
        pluginIcon = await browser.findElement(By.id('diva-1-pixel-icon-glyph'));
        expect(pluginIcon).toBeDefined();
    });

    test('icon clicked creates tutorial', async () => {
        // activate plugin
        const actions = browser.actions();
        await actions.click(pluginIcon).perform();

        let tutorialDiv = await browser.findElement(By.id('tutorial-div'));
        expect(tutorialDiv).toBeDefined();

        // close tutorial and scroll down
        let tutorialFooter = await browser.findElement(By.id('modal-footer'));
        await actions.click(tutorialFooter).perform();
        await actions.keyDown(40).perform();
    });
});

describe('Check Functionality', () => {
    test('brush tool creates size-slider', async () => {
        // expect to be hidden at first
        let brushSlider = await browser.findElement(By.id('brush-size'));
        let isVisible = await brushSlider.isDisplayed();
        expect(isVisible).toBeFalsy();

        // select on brush tool (b)
        const actions = browser.actions();
        await actions.keyDown(66).keyUp(66).perform();

        // expect to now be visible
        isVisible = await brushSlider.isDisplayed();
        expect(isVisible).toBeTruthy();
    })
    
    test('export as png works', async () => {
        // check for button
        let exportPNGButton = await browser.findElement(By.id('png-export-button'));
        expect(await exportPNGButton.isDisplayed()).toBeTruthy();

        // CURRENTLY BUTTON IS OUT OF VIEWPORT, SO IT CANNOT BE CLICKED ON (VIEWPORT SIZE SPECIFICATION DOESN'T WORK)
        // // click on button
        // const actions = browser.actions();
        // await actions.click(exportPNGButton).perform();

        // // links should now be visible
        // let links = await browser.findElement(By.id('png-links-div'));
        // expect(links).toBeDefined();
    })
})
