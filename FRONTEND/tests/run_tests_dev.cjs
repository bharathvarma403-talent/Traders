const puppeteer = require('puppeteer');

(async () => {
  console.log('Starting puppeteer...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning' || msg.type() === 'log') {
      console.log(`PAGE LOG [${msg.type()}]:`, msg.text());
    }
  });

  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.message);
  });

  page.on('response', response => {
    if (!response.ok()) {
      console.log(`PAGE HTTP ERROR: ${response.status()} ${response.url()}`);
    }
  });

  console.log('Navigating to http://localhost:5177 ...');
  try {
    await page.goto('http://localhost:5177', { waitUntil: 'networkidle0' });
    console.log('Navigation complete. Waiting for 3 seconds...');
    await new Promise(r => setTimeout(r, 3000));
  } catch (e) {
    console.error('Navigation failed:', e.message);
  } finally {
    await browser.close();
  }
})();
