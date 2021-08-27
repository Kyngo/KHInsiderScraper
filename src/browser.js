const fs = require('fs');

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

module.exports = {
    createBrowser: async () => {
        if (!fs.existsSync('./tmp')) fs.mkdirSync('./tmp');

        puppeteer.use(StealthPlugin());
        const browser = await puppeteer.launch({
            defaultViewport: null,
            headless: true,
            args: [
                '--disable-setuid-sandbox', 
                '--disable-gpu', 
                '--window-size=1280,720',
                '--no-sandbox',
                '--disable-infobars',
                '--window-position=20,20',
                '--ignore-certifcate-errors',
                '--ignore-certifcate-errors-spki-list',
                '--disable-web-security',
                '-–allow-file-access-from-files',
                '--disable-site-isolation-trials'
            ],
            ignoreHTTPSErrors: true,
            userDataDir: `./browser_data`
        });
        return browser;
    },
    makeNewTab: async (browser) => {
        const page = await browser.newPage();
        const userAgent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.39 Safari/537.36';
        await page.setUserAgent(userAgent);
        await page.evaluateOnNewDocument(() => {
            window.navigator.chrome = {
                runtime: {}
            };
        });
        await page.evaluateOnNewDocument(() => {
            const originalQuery = window.navigator.permissions.query;
            return window.navigator.permissions.query = (parameters) => (
              parameters.name === 'notifications' ?
                Promise.resolve({ state: Notification.permission }) :
                originalQuery(parameters)
            );
        });
        await page._client.send('Emulation.clearDeviceMetricsOverride');
        const preloadFile = fs.readFileSync(`${__dirname}/preload.js`, 'utf8');
        await page.evaluateOnNewDocument(preloadFile);
        
        return page;
    }
}