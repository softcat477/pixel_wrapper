// jshint ignore:start

const {Builder, By, Key, until} = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const url = 'http://localhost:9001';

var browser = null;

jest.setTimeout("10000");

beforeAll(async () => {
    // Set up the webdriver
    let options = new chrome.Options()
        .headless();
    browser = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();

    await browser.get(url);
});

afterAll(() => {
    browser.quit();
});

describe("Pixel Basics", () => {
    test("Page Rendered", async () => {
        const title = await browser.getTitle();
        expect(title).toBe("Pixel.js");
    });
});