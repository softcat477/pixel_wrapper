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
        .headless();
    browser = await new Builder()
        .forBrowser('firefox')
        .setChromeOptions(options)
        .build();

    await browser.get(url);
});

afterAll(() => {
    browser.quit();
});

describe('Check Proper Plugin Creation', () => {
    var pluginIcon;

    test('page title matches', async () => {
        const title = await browser.getTitle();
        expect(title).toBe('Pixel.js');
    });

    test('plugin icon exists', async () => {
        pluginIcon = await browser.findElement(By.id('diva-1-pixel-icon-glyph'));
        expect(pluginIcon).toBeDefined();
    });

    test('icon clicked creates tutorial', async () => {
        const actions = browser.actions();
        await actions.click(pluginIcon).perform();

        let tutorialProgress = await browser.findElement(By.id('tutorial-progress')).getText();
        expect(tutorialProgress).toBe('1/16');
    });
});