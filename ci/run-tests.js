const { chromium } = require('playwright');
const { createServer } = require('./serve');

(async () => {
  const server = createServer();
  await new Promise(r => server.listen(0, r));
  const port = server.address().port;
  const url = `http://localhost:${port}/test.html`;

  console.log(`Serving on port ${port}, opening ${url}`);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 900, height: 800 } });
  await page.goto(url);
  await page.waitForSelector('#summary.ok, #summary.fail', { timeout: 30000 });

  const summary = await page.textContent('#summary');
  const failed = await page.evaluate(
    () => document.querySelector('#summary').classList.contains('fail')
  );

  console.log(`\n${summary}\n`);

  if (failed) {
    const failures = await page.evaluate(() =>
      [...document.querySelectorAll('.test.fail')].map(el => el.textContent)
    );
    failures.forEach(f => console.error(`  FAIL: ${f}`));
  }

  await page.screenshot({ path: 'screenshots/tests.png', fullPage: true });
  console.log('Saved screenshots/tests.png');

  await browser.close();
  server.close();
  process.exit(failed ? 1 : 0);
})();
