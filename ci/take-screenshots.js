const { chromium } = require('playwright');
const { createServer } = require('./serve');
const path = require('path');

const SHOTS_DIR = path.join(__dirname, '..', 'screenshots');

(async () => {
  const server = createServer();
  await new Promise(r => server.listen(0, r));
  const port = server.address().port;
  const url = `http://localhost:${port}/index.html`;

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
  await page.goto(url);
  await page.waitForTimeout(600);

  // 1. Menu
  await page.screenshot({ path: path.join(SHOTS_DIR, 'menu.png') });
  console.log('Saved menu.png');

  // 2. Customise screen
  await page.evaluate(() => { state.mode = 'customise'; });
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(SHOTS_DIR, 'customise.png') });
  console.log('Saved customise.png');

  // 3. Gameplay — start game, skip banner, spawn interesting scene
  await page.evaluate(() => {
    startGame();
    state.bannerTimer = 0;
    // Place player mid-screen
    state.player.x = W * 0.35;
    state.player.y = H * 0.4;
    state.player.fireballs = 3;
    state.player.freezeballs = 3;
    // Add a selection of fish
    for (let i = 0; i < 6; i++) {
      const f = new Fish(0);
      f.x = 150 + i * 100;
      f.y = 120 + (i % 3) * 120;
      f.direction = i % 2 === 0 ? 1 : -1;
      state.fish.push(f);
    }
    // Add a shark
    const s = new Shark(0);
    s.x = W * 0.75;
    s.y = H * 0.35;
    s.direction = -1;
    state.sharks.push(s);
  });
  // Let a few frames render so entities settle
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(SHOTS_DIR, 'gameplay.png') });
  console.log('Saved gameplay.png');

  // 4. High scores — add some demo entries then show the page
  await page.evaluate(() => {
    clearHighScores();
    const names = ['FREYA', 'MUM', 'DAD', 'TEDDY', 'PANDA'];
    const scores = [1850, 1420, 1100, 780, 340];
    names.forEach((n, i) => addHighScore(n, scores[i], Math.max(0, 5 - i)));
    state.mode = 'highscores';
  });
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(SHOTS_DIR, 'highscores.png') });
  console.log('Saved highscores.png');

  await browser.close();
  server.close();
  console.log('Done — all screenshots saved to screenshots/');
})();
