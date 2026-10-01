const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:8086/', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'test-customers.png' });
  const html = await page.content();
  console.log(html.substring(0, 500));
  await browser.close();
})();
