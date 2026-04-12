// ==========================================================================
// Squishy Fish — Test Suite
// Runs in browser via test.html — game.js is loaded with SQUISHY_TEST_MODE=true
// so the main game loop doesn't start.
// ==========================================================================

const results = document.getElementById('results');
const summary = document.getElementById('summary');
let passed = 0, failed = 0;
let currentGroup = null;

function group(name) {
  currentGroup = name;
  const div = document.createElement('div');
  div.className = 'group';
  div.textContent = name;
  results.appendChild(div);
}

function test(name, fn) {
  const div = document.createElement('div');
  div.className = 'test';
  try {
    fn();
    div.classList.add('pass');
    div.textContent = `✓ ${name}`;
    passed++;
  } catch (e) {
    div.classList.add('fail');
    div.innerHTML = `✗ ${name}<div class="err">${escapeHtml(e.message)}</div>`;
    failed++;
    console.error(`[${currentGroup}] ${name}`, e);
  }
  results.appendChild(div);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])
  );
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}
function assertEq(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error(`${msg || 'equality'}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}
function assertGt(actual, expected, msg) {
  if (!(actual > expected)) {
    throw new Error(`${msg || ''}: expected ${actual} > ${expected}`);
  }
}

// Always start tests from a clean high-score slate
clearHighScores();

// ==========================================================================
group('Collision (aabb)');
// ==========================================================================
test('overlapping boxes collide', () => {
  assert(aabb({x:0,y:0,w:10,h:10}, {x:5,y:5,w:10,h:10}));
});
test('non-overlapping boxes do not collide', () => {
  assert(!aabb({x:0,y:0,w:10,h:10}, {x:20,y:20,w:10,h:10}));
});
test('touching edges do not collide', () => {
  assert(!aabb({x:0,y:0,w:10,h:10}, {x:10,y:0,w:10,h:10}));
});
test('box fully inside another collides', () => {
  assert(aabb({x:0,y:0,w:100,h:100}, {x:40,y:40,w:10,h:10}));
});

// ==========================================================================
group('Player');
// ==========================================================================
test('starts with MAX_LIVES (10)', () => {
  const p = new Player();
  assertEq(p.lives, MAX_LIVES);
  assertEq(MAX_LIVES, 10);
});
test('hurt reduces lives by one', () => {
  const p = new Player();
  assert(p.hurt() === true);
  assertEq(p.lives, 9);
});
test('invulnerability blocks a second hurt in quick succession', () => {
  const p = new Player();
  p.hurt();
  assert(p.hurt() === false);
  assertEq(p.lives, 9);
});
test('heal adds one life', () => {
  const p = new Player();
  p.lives = 5;
  assert(p.heal() === true);
  assertEq(p.lives, 6);
});
test('heal from 9 reaches MAX_LIVES', () => {
  const p = new Player();
  p.lives = 9;
  assert(p.heal());
  assertEq(p.lives, 10);
});
test('heal refuses past MAX_LIVES', () => {
  const p = new Player();
  p.lives = MAX_LIVES;
  assert(p.heal() === false);
  assertEq(p.lives, MAX_LIVES);
});

// ==========================================================================
group('Fish');
// ==========================================================================
test('small fish dies in one squish and awards points', () => {
  const f = new Fish(0);
  f.maxHits = 1; f.hits = 0; f.points = 10; f.squishTimer = 0; f.hungry = false;
  assertEq(f.squish(), 10);
  assert(!f.alive);
});
test('big fish needs maxHits squishes, points only on final', () => {
  const f = new Fish(0);
  f.maxHits = 3; f.hits = 0; f.points = 50; f.hungry = false;
  f.squishTimer = 0; assertEq(f.squish(), 0);
  f.squishTimer = 0; assertEq(f.squish(), 0);
  f.squishTimer = 0; assertEq(f.squish(), 50);
  assert(!f.alive);
});
test('hungry fish cannot be squished', () => {
  const f = new Fish(0);
  f.hungry = true;
  f.squishTimer = 0;
  assert(!f.canBeSquished());
});
test('friendly fish squishable only when cooldown is zero', () => {
  const f = new Fish(0);
  f.hungry = false; f.squishTimer = 0;
  assert(f.canBeSquished());
  f.squishTimer = 100;
  assert(!f.canBeSquished());
});

// ==========================================================================
group('Treasure Chest');
// ==========================================================================
test('starts closed', () => {
  const c = new TreasureChest(100, 100);
  assert(!c.opened);
});
test('open() returns the points value', () => {
  const c = new TreasureChest(100, 100);
  c.points = 250;
  assertEq(c.open(), 250);
  assert(c.opened);
});
test('open() twice returns 0 the second time', () => {
  const c = new TreasureChest(100, 100);
  c.points = 200;
  assertEq(c.open(), 200);
  assertEq(c.open(), 0);
});
test('hitbox covers the chest body', () => {
  const c = new TreasureChest(100, 100);
  const box = c.hitbox();
  assert(box.w > 0 && box.h > 0);
  assert(box.x < 100 && box.x + box.w > 100);
});
test('open(player) heals player to MAX_LIVES', () => {
  const p = new Player();
  p.lives = 3;
  const c = new TreasureChest(100, 100);
  c.open(p);
  assertEq(p.lives, MAX_LIVES);
});
test('open(player) grants 3 fireballs and 3 freezeballs', () => {
  const p = new Player();
  assertEq(p.fireballs, 0);
  assertEq(p.freezeballs, 0);
  const c = new TreasureChest(100, 100);
  c.open(p);
  assertEq(p.fireballs, 3);
  assertEq(p.freezeballs, 3);
});
test('open(player) a second time gives no additional reward', () => {
  const p = new Player();
  const c = new TreasureChest(100, 100);
  c.open(p);
  c.open(p);
  assertEq(p.fireballs, 3);
  assertEq(p.freezeballs, 3);
});

// ==========================================================================
group('Seaweed');
// ==========================================================================
test('poison seaweed hurts player via consume()', () => {
  const p = new Player();
  const sw = new Seaweed(true);
  assertEq(sw.consume(p), 'hurt');
  assertEq(p.lives, MAX_LIVES - 1);
  assert(!sw.used, 'poison seaweed should NOT be consumed');
});
test('poison seaweed does nothing during invulnerability', () => {
  const p = new Player();
  const sw = new Seaweed(true);
  p.invulnTimer = 1000;
  assertEq(sw.consume(p), false);
  assertEq(p.lives, MAX_LIVES);
});
test('green seaweed gives +1 life and is marked used', () => {
  const p = new Player();
  p.lives = 5;
  const sw = new Seaweed(false);
  assertEq(sw.consume(p), 'heal');
  assertEq(p.lives, 6);
  assert(sw.used);
});
test('green seaweed does nothing at max lives (not consumed)', () => {
  const p = new Player();
  p.lives = MAX_LIVES;
  const sw = new Seaweed(false);
  assertEq(sw.consume(p), false);
  assertEq(p.lives, MAX_LIVES);
  assert(!sw.used);
});
test('used seaweed cannot be consumed again', () => {
  const p = new Player();
  p.lives = 5;
  const sw = new Seaweed(false);
  sw.consume(p);
  assertEq(sw.consume(p), false);
  assertEq(p.lives, 6);
});

// ==========================================================================
group('Shark (15-hit combat)');
// ==========================================================================
test('starts with 15 maxHits and 0 hits', () => {
  const s = new Shark(0);
  assertEq(s.maxHits, 15);
  assertEq(s.hits, 0);
  assert(s.alive);
});
test('squish deals 1 damage', () => {
  const s = new Shark(0);
  s.squishTimer = 0;
  s.squish();
  assertEq(s.hits, 1);
  assert(s.alive);
});
test('squish respects its cooldown (a second immediate squish does nothing)', () => {
  const s = new Shark(0);
  s.squishTimer = 0;
  s.squish();
  const before = s.hits;
  s.squish();
  assertEq(s.hits, before);
});
test('15 space-taps kill the shark and award points', () => {
  const s = new Shark(0);
  s.points = 500;
  let killPts = 0;
  for (let i = 0; i < 15; i++) {
    s.squishTimer = 0;
    const pts = s.squish();
    if (pts > 0) killPts = pts;
  }
  assert(!s.alive);
  assertEq(killPts, 500);
});
test('takeDamage(5) bypasses cooldown', () => {
  const s = new Shark(0);
  s.takeDamage(5);
  assertEq(s.hits, 5);
  assert(s.alive);
});
test('three fireballs (5 damage each = 15) kill the shark', () => {
  const s = new Shark(0);
  s.takeDamage(5);
  s.takeDamage(5);
  const pts = s.takeDamage(5);
  assert(!s.alive);
  assertGt(pts, 0);
});

// ==========================================================================
group('Projectiles');
// ==========================================================================
test('fire projectile moves right with direction 1', () => {
  const p = new Projectile(100, 100, 1, 'fire');
  p.update(16);
  assertGt(p.x, 100);
});
test('freeze projectile moves left with direction -1', () => {
  const p = new Projectile(100, 100, -1, 'freeze');
  p.update(16);
  assert(p.x < 100);
});
test('projectile despawns when it flies off-screen right', () => {
  const p = new Projectile(W + 50, 100, 1, 'fire');
  p.update(16);
  assert(!p.alive);
});
test('projectile despawns when it flies off-screen left', () => {
  const p = new Projectile(-50, 100, -1, 'fire');
  p.update(16);
  assert(!p.alive);
});
test('projectile type is preserved', () => {
  const f = new Projectile(100, 100, 1, 'fire');
  const z = new Projectile(100, 100, 1, 'freeze');
  assertEq(f.type, 'fire');
  assertEq(z.type, 'freeze');
});
test('projectile has a hitbox that surrounds its position', () => {
  const p = new Projectile(100, 100, 1, 'fire');
  const b = p.hitbox();
  assert(b.x < 100 && b.x + b.w > 100);
  assert(b.y < 100 && b.y + b.h > 100);
});

// ==========================================================================
group('Frozen state');
// ==========================================================================
test('frozen hungry fish becomes squishable', () => {
  const f = new Fish(0);
  f.hungry = true;
  f.frozenTimer = 1000;
  f.squishTimer = 0;
  assert(f.canBeSquished());
});
test('unfrozen hungry fish is NOT squishable', () => {
  const f = new Fish(0);
  f.hungry = true;
  f.frozenTimer = 0;
  f.squishTimer = 0;
  assert(!f.canBeSquished());
});
test('frozen fish does not move in update()', () => {
  const f = new Fish(0);
  f.frozenTimer = 1000;
  const startX = f.x;
  f.update(16);
  assertEq(f.x, startX);
});
test('frozen shark does not move in update()', () => {
  const s = new Shark(0);
  s.frozenTimer = 1000;
  const startX = s.x;
  const dummyPlayer = { x: 0, y: 0 };
  s.update(16, dummyPlayer);
  assertEq(s.x, startX);
});

// ==========================================================================
group('Player inventory');
// ==========================================================================
test('Player starts with 0 fireballs and 0 freezeballs', () => {
  const p = new Player();
  assertEq(p.fireballs, 0);
  assertEq(p.freezeballs, 0);
});

// ==========================================================================
group('High Scores');
// ==========================================================================
test('loadHighScores returns empty array when nothing stored', () => {
  clearHighScores();
  const s = loadHighScores();
  assert(Array.isArray(s));
  assertEq(s.length, 0);
});
test('isHighScore is true when list is empty (for positive scores)', () => {
  clearHighScores();
  assert(isHighScore(10));
});
test('isHighScore is false for zero or negative scores', () => {
  clearHighScores();
  assert(!isHighScore(0));
  assert(!isHighScore(-5));
});
test('addHighScore inserts a new score', () => {
  clearHighScores();
  addHighScore('FREYA', 500, 2);
  const s = loadHighScores();
  assertEq(s.length, 1);
  assertEq(s[0].name, 'FREYA');
  assertEq(s[0].score, 500);
  assertEq(s[0].level, 2);
});
test('addHighScore sorts descending by score', () => {
  clearHighScores();
  addHighScore('A', 100, 0);
  addHighScore('B', 500, 1);
  addHighScore('C', 250, 0);
  const s = loadHighScores();
  assertEq(s[0].name, 'B');
  assertEq(s[1].name, 'C');
  assertEq(s[2].name, 'A');
});
test('addHighScore caps the list at MAX_HIGHSCORES (10)', () => {
  clearHighScores();
  for (let i = 0; i < 15; i++) {
    addHighScore(`P${i}`, i * 100, 0);
  }
  const s = loadHighScores();
  assertEq(s.length, MAX_HIGHSCORES);
  assertEq(MAX_HIGHSCORES, 10);
  assertEq(s[0].score, 1400); // highest
  assertEq(s[9].score, 500);  // 10th highest
});
test('isHighScore returns false when score is lower than 10th place', () => {
  clearHighScores();
  for (let i = 0; i < 10; i++) addHighScore('P', 1000 + i, 0);
  assert(!isHighScore(500));
  assert(isHighScore(1500));
});
test('addHighScore uppercases and trims the name, max 10 chars', () => {
  clearHighScores();
  addHighScore('  hello world extra  ', 100, 0);
  const s = loadHighScores();
  assertEq(s[0].name, 'HELLO WORL');
});
test('addHighScore falls back to DIVER on empty name', () => {
  clearHighScores();
  addHighScore('', 100, 0);
  const s = loadHighScores();
  assertEq(s[0].name, 'DIVER');
});
test('High scores persist via localStorage across reloads (same session)', () => {
  clearHighScores();
  addHighScore('FREYA', 999, 3);
  // Simulate reload by re-reading from storage
  const s = loadHighScores();
  assertEq(s.length, 1);
  assertEq(s[0].name, 'FREYA');
  assertEq(s[0].score, 999);
});

// ==========================================================================
group('Name Entry (high score input)');
// ==========================================================================
test('rejects leading space (player was holding SPACE when they died)', () => {
  assertEq(nameEntryAppend('', ' '), '');
});
test('rejects leading comma (player was firing < when they died)', () => {
  assertEq(nameEntryAppend('', ','), '');
});
test('rejects leading period (player was firing > when they died)', () => {
  assertEq(nameEntryAppend('', '.'), '');
});
test('rejects leading < and >', () => {
  assertEq(nameEntryAppend('', '<'), '');
  assertEq(nameEntryAppend('', '>'), '');
});
test('accepts alphanumeric first character', () => {
  assertEq(nameEntryAppend('', 'F'), 'F');
  assertEq(nameEntryAppend('', 'a'), 'a');
  assertEq(nameEntryAppend('', '7'), '7');
});
test('allows space after at least one real character', () => {
  assertEq(nameEntryAppend('F', ' '), 'F ');
});
test('still rejects comma and period even after first char', () => {
  assertEq(nameEntryAppend('FREYA', ','), 'FREYA');
  assertEq(nameEntryAppend('FREYA', '.'), 'FREYA');
});
test('caps at 10 characters', () => {
  assertEq(nameEntryAppend('ABCDEFGHIJ', 'K'), 'ABCDEFGHIJ');
});
test('ignores non-character keys (Enter, ArrowLeft, etc)', () => {
  assertEq(nameEntryAppend('', 'Enter'), '');
  assertEq(nameEntryAppend('AB', 'ArrowLeft'), 'AB');
});
test('typical sequence: hold SPACE then type "FREYA"', () => {
  // Simulates a player holding space at the moment of death
  let n = '';
  n = nameEntryAppend(n, ' '); // space repeat (rejected, still empty)
  n = nameEntryAppend(n, ' '); // space repeat
  n = nameEntryAppend(n, 'F');
  n = nameEntryAppend(n, 'R');
  n = nameEntryAppend(n, 'E');
  n = nameEntryAppend(n, 'Y');
  n = nameEntryAppend(n, 'A');
  assertEq(n, 'FREYA');
});

// ==========================================================================
group('Levels & setupLevel');
// ==========================================================================
test('there are 6 levels', () => {
  assertEq(LEVELS.length, 6);
});
test('level targets strictly increase', () => {
  for (let i = 1; i < LEVELS.length; i++) {
    assertGt(LEVELS[i].target, LEVELS[i-1].target, `level ${i}`);
  }
});
test('setupLevel resets levelScore to 0', () => {
  state.player = new Player();
  state.level = 0;
  state.levelScore = 500;
  setupLevel();
  assertEq(state.levelScore, 0);
});
test('setupLevel places a TreasureChest', () => {
  state.player = new Player();
  state.level = 0;
  setupLevel();
  assert(state.chest instanceof TreasureChest);
});
test('setupLevel places both poison and healing seaweed', () => {
  state.player = new Player();
  state.level = 0;
  setupLevel();
  assert(state.seaweeds.length > 0);
  assert(state.seaweeds.some(s => s.poison === true), 'expected poison seaweed');
  assert(state.seaweeds.some(s => s.poison === false), 'expected healing seaweed');
});
test('setupLevel places obstacles (urchins, rocks, crabs)', () => {
  state.player = new Player();
  state.level = 0;
  setupLevel();
  assert(state.obstacles.some(o => o instanceof Urchin));
  assert(state.obstacles.some(o => o instanceof Rock));
  assert(state.obstacles.some(o => o instanceof Crab));
});

// ==========================================================================
// Clean up: leave localStorage as we found it
// ==========================================================================
clearHighScores();

// ==========================================================================
// Summary
// ==========================================================================
summary.textContent = `${passed} passed · ${failed} failed`;
summary.classList.add(failed === 0 ? 'ok' : 'fail');
