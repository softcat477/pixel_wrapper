// jshint ignore:start

const {Builder, By, Key, until} = require('selenium-webdriver');
const firefox = require('selenium-webdriver/firefox');
// this is a Pixel.js job in Rodan
const url = process.env.PIXEL_URL;

jest.setTimeout('45000');

var browser = null;

beforeAll(async () => {
    // Set up the webdriver
    let options = new firefox.Options()
        .headless()
        .addArguments('--width=1920','--height=1200');
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
    });
    
    test('export as png works', async () => {
        // check for button
        let exportPNGButton = await browser.findElement(By.id('png-export-button'));
        expect(await exportPNGButton.isDisplayed()).toBeTruthy();

        // click on button
        const actions = browser.actions();
        await actions.click(exportPNGButton).perform();

        // links should now be visible
        let links = await browser.findElement(By.id('png-links-div'));
        expect(links).toBeDefined();
    });

    // next three tests are linked and use the submitButton variable
    var submitButton;
    test('submit to rodan without selection regions creates alert', async() => {
        // click on button
        submitButton = await browser.findElement(By.id('rodan-export-button'));
        const actions = browser.actions();
        await actions.click(submitButton).perform();

        // check for alert
        let alert = await browser.switchTo().alert();
        expect(await alert.getText()).toBe("You haven't created any select regions!");
        await alert.accept();
    });
    test('drawing select region then submit to rodan creates progress bar', async() => {
        let canvas = await browser.findElement(By.id('layer--1-canvas'));
        const actions = browser.actions();
        // select rectangle tool and draw one
        await actions.keyDown(82).keyUp(82).perform();
        await actions.dragAndDrop(canvas, {x: 200, y: 200}).perform();

        await actions.click(submitButton).perform();
        // progress bar should be visible
        let progressBar = await browser.findElement(By.id('pbar-inner-div'));
        expect(await progressBar.isDisplayed()).toBeTruthy();
    });
    test('cancel progress bar works', async() => {
        let cancelButton = await browser.findElement(By.id('cancel-export-div'));
        const actions = browser.actions();
        await actions.click(cancelButton).perform();

        expect(await browser.findElements(By.id('pixel-export-div'))).toEqual([]); // empty list since not found
    });
});








