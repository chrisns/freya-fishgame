// ==========================================================================
// Squishy Fish — by Freya Nesbitt-Smith (age 7¼)
// ==========================================================================

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;
const MAX_LIVES = 10;
const HIGHSCORE_KEY = 'squishy-fish-highscores';
const MAX_HIGHSCORES = 10;

// ==========================================================================
// SOUND — programmatic Web Audio, no files needed
// ==========================================================================
class Sound {
  constructor() { this.ctx = null; this.enabled = true; }
  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }
  splat() {
    if (!this.enabled || !this.ctx) return;
    const c = this.ctx, now = c.currentTime;
    const buf = c.createBuffer(1, c.sampleRate * 0.18, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (d.length * 0.25));
    }
    const src = c.createBufferSource();
    src.buffer = buf;
    const filt = c.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.setValueAtTime(1200, now);
    filt.frequency.exponentialRampToValueAtTime(200, now + 0.18);
    const gain = c.createGain();
    gain.gain.value = 0.35;
    src.connect(filt).connect(gain).connect(c.destination);
    src.start(now);
  }
  hit() {
    if (!this.enabled || !this.ctx) return;
    const c = this.ctx, now = c.currentTime;
    const osc = c.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.35);
    const gain = c.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
    osc.connect(gain).connect(c.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  }
  levelUp() {
    if (!this.enabled || !this.ctx) return;
    const c = this.ctx, now = c.currentTime;
    [0, 0.1, 0.2, 0.32].forEach((t, i) => {
      const osc = c.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = 440 * Math.pow(1.26, i);
      const gain = c.createGain();
      gain.gain.setValueAtTime(0.25, now + t);
      gain.gain.exponentialRampToValueAtTime(0.01, now + t + 0.2);
      osc.connect(gain).connect(c.destination);
      osc.start(now + t);
      osc.stop(now + t + 0.2);
    });
  }
  gameOver() {
    if (!this.enabled || !this.ctx) return;
    const c = this.ctx, now = c.currentTime;
    const osc = c.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 1.1);
    const gain = c.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 1.1);
    osc.connect(gain).connect(c.destination);
    osc.start(now);
    osc.stop(now + 1.1);
  }
  heal() {
    if (!this.enabled || !this.ctx) return;
    const c = this.ctx, now = c.currentTime;
    [0, 0.08, 0.16].forEach((t, i) => {
      const osc = c.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 523 + i * 175;
      const gain = c.createGain();
      gain.gain.setValueAtTime(0.22, now + t);
      gain.gain.exponentialRampToValueAtTime(0.01, now + t + 0.3);
      osc.connect(gain).connect(c.destination);
      osc.start(now + t);
      osc.stop(now + t + 0.3);
    });
  }
  treasure() {
    if (!this.enabled || !this.ctx) return;
    const c = this.ctx, now = c.currentTime;
    [440, 554, 659, 880, 1108].forEach((f, i) => {
      const osc = c.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = f;
      const gain = c.createGain();
      gain.gain.setValueAtTime(0.22, now + i * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.07 + 0.45);
      osc.connect(gain).connect(c.destination);
      osc.start(now + i * 0.07);
      osc.stop(now + i * 0.07 + 0.45);
    });
  }
  fire() {
    if (!this.enabled || !this.ctx) return;
    const c = this.ctx, now = c.currentTime;
    // Whoosh: filtered noise
    const buf = c.createBuffer(1, c.sampleRate * 0.28, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (d.length * 0.35));
    }
    const src = c.createBufferSource();
    src.buffer = buf;
    const filt = c.createBiquadFilter();
    filt.type = 'bandpass';
    filt.frequency.setValueAtTime(1800, now);
    filt.frequency.exponentialRampToValueAtTime(500, now + 0.25);
    const ng = c.createGain();
    ng.gain.value = 0.3;
    src.connect(filt).connect(ng).connect(c.destination);
    src.start(now);
    // Descending pitch
    const osc = c.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(700, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.2);
    const og = c.createGain();
    og.gain.setValueAtTime(0.15, now);
    og.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    osc.connect(og).connect(c.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }
  freeze() {
    if (!this.enabled || !this.ctx) return;
    const c = this.ctx, now = c.currentTime;
    [1200, 1600, 2000, 2400].forEach((f, i) => {
      const osc = c.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      const gain = c.createGain();
      gain.gain.setValueAtTime(0.13, now + i * 0.03);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.03 + 0.32);
      osc.connect(gain).connect(c.destination);
      osc.start(now + i * 0.03);
      osc.stop(now + i * 0.03 + 0.32);
    });
  }
}
const sound = new Sound();

// ==========================================================================
// INPUT
// ==========================================================================
const keys = {};
window.addEventListener('keydown', (e) => {
  // Name-entry takes full control of keyboard
  if (state && state.nameEntry && state.nameEntry.active) {
    e.preventDefault();
    if (e.key === 'Enter') {
      if (state.nameEntry.name.trim().length > 0) {
        addHighScore(state.nameEntry.name, state.score, state.level);
        state.nameEntry.active = false;
      }
    } else if (e.key === 'Backspace') {
      state.nameEntry.name = state.nameEntry.name.slice(0, -1);
    } else {
      state.nameEntry.name = nameEntryAppend(state.nameEntry.name, e.key);
    }
    return;
  }
  sound.init();
  // Fire a fireball with < or ,
  if (e.key === '<' || e.key === ',') {
    fireFireball();
    e.preventDefault();
    return;
  }
  // Fire a freezeball with > or .
  if (e.key === '>' || e.key === '.') {
    fireFreezeball();
    e.preventDefault();
    return;
  }
  keys[e.key] = true;
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) {
    e.preventDefault();
  }
});
window.addEventListener('keyup', (e) => { keys[e.key] = false; });

function fireFireball() {
  if (state.mode !== 'playing' || !state.player || state.player.fireballs <= 0) return;
  const dir = state.player.facing === 'right' ? 1 : -1;
  state.projectiles.push(new Projectile(
    state.player.x + dir * 22, state.player.y - 4, dir, 'fire'
  ));
  state.player.fireballs--;
  sound.fire();
}
function fireFreezeball() {
  if (state.mode !== 'playing' || !state.player || state.player.freezeballs <= 0) return;
  const dir = state.player.facing === 'right' ? 1 : -1;
  state.projectiles.push(new Projectile(
    state.player.x + dir * 22, state.player.y - 4, dir, 'freeze'
  ));
  state.player.freezeballs--;
  sound.freeze();
}

// ==========================================================================
// PLAYER — the scuba diver
// ==========================================================================
class Player {
  constructor() {
    this.x = W / 2;
    this.y = H / 2;
    this.w = 40;
    this.h = 60;
    this.speed = 4;
    this.lives = MAX_LIVES;
    this.invulnTimer = 0;
    this.suitColor = '#ffffff';
    this.maskColor = '#000000';
    this.flipperColor = '#000000';
    this.tankColor = '#c0c0c0';
    this.facing = 'right';
    this.fireballs = 0;
    this.freezeballs = 0;
  }
  update(dt) {
    let dx = 0, dy = 0;
    if (keys['ArrowLeft'])  { dx -= 1; this.facing = 'left'; }
    if (keys['ArrowRight']) { dx += 1; this.facing = 'right'; }
    if (keys['ArrowUp'])    dy -= 1;
    if (keys['ArrowDown'])  dy += 1;
    this.x += dx * this.speed;
    this.y += dy * this.speed;
    this.x = Math.max(this.w / 2, Math.min(W - this.w / 2, this.x));
    this.y = Math.max(this.h / 2 + 40, Math.min(H - this.h / 2 - 10, this.y));
    if (this.invulnTimer > 0) this.invulnTimer -= dt;
  }
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.facing === 'left') ctx.scale(-1, 1);
    if (this.invulnTimer > 0 && Math.floor(this.invulnTimer / 100) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }
    // Flippers
    ctx.fillStyle = this.flipperColor;
    ctx.beginPath();
    ctx.ellipse(-18, 25, 8, 12, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-6, 28, 8, 12, -0.3, 0, Math.PI * 2);
    ctx.fill();
    // Body / suit
    ctx.fillStyle = this.suitColor;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(-12, -10, 24, 35, 6) : ctx.rect(-12, -10, 24, 35);
    ctx.fill();
    // Tank on back
    ctx.fillStyle = this.tankColor;
    ctx.fillRect(-18, -5, 6, 22);
    ctx.fillStyle = '#333';
    ctx.fillRect(-18, -5, 6, 3);
    // Head
    ctx.fillStyle = '#fcd8b4';
    ctx.beginPath();
    ctx.arc(0, -20, 13, 0, Math.PI * 2);
    ctx.fill();
    // Mask strap
    ctx.fillStyle = this.maskColor;
    ctx.fillRect(-13, -24, 26, 4);
    // Mask glass
    ctx.fillStyle = this.maskColor;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(-10, -26, 20, 12, 3) : ctx.rect(-10, -26, 20, 12);
    ctx.fill();
    ctx.fillStyle = '#88ddff';
    ctx.fillRect(-8, -24, 16, 7);
    // Snorkel
    ctx.strokeStyle = '#ffaa00';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(10, -24);
    ctx.lineTo(16, -36);
    ctx.stroke();
    // Arm holding forward
    ctx.fillStyle = this.suitColor;
    ctx.fillRect(10, -5, 14, 6);
    ctx.fillStyle = '#fcd8b4';
    ctx.beginPath();
    ctx.arc(24, -2, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  hurt() {
    if (this.invulnTimer > 0) return false;
    this.lives--;
    this.invulnTimer = 1500;
    return true;
  }
  heal() {
    if (this.lives >= MAX_LIVES) return false;
    this.lives++;
    return true;
  }
  hitbox() {
    return { x: this.x - this.w / 2 + 4, y: this.y - this.h / 2 + 8, w: this.w - 8, h: this.h - 18 };
  }
}

// ==========================================================================
// FISH — squishable (closed mouth) or dangerous (open mouth)
// ==========================================================================
const FISH_TIERS = [
  { size: 18, hits: 1, points: 10,  color: '#ffdd44' },
  { size: 28, hits: 2, points: 25,  color: '#ff8844' },
  { size: 42, hits: 3, points: 50,  color: '#ff4488' },
  { size: 60, hits: 4, points: 120, color: '#aa44ff' },
];

class Fish {
  constructor(level) {
    const tier = FISH_TIERS[Math.floor(Math.random() * FISH_TIERS.length)];
    this.size = tier.size;
    this.maxHits = tier.hits;
    this.hits = 0;
    this.points = tier.points;
    this.color = tier.color;
    this.hungry = Math.random() < 0.32;
    this.direction = Math.random() < 0.5 ? 1 : -1;
    this.x = this.direction === 1 ? -this.size * 2 : W + this.size * 2;
    this.y = 70 + Math.random() * (H - 150);
    this.baseY = this.y;
    this.speed = (0.7 + Math.random() * 0.6) * (1 + level * 0.15);
    this.wobble = Math.random() * Math.PI * 2;
    this.alive = true;
    this.squishTimer = 0;
    this.frozenTimer = 0;
  }
  update(dt) {
    if (this.squishTimer > 0) this.squishTimer -= dt;
    if (this.frozenTimer > 0) {
      this.frozenTimer -= dt;
      return;
    }
    this.x += this.direction * this.speed;
    this.wobble += 0.08;
    this.y = this.baseY + Math.sin(this.wobble) * 8;
    if (this.x < -this.size * 3 || this.x > W + this.size * 3) this.alive = false;
  }
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.direction === -1) ctx.scale(-1, 1);
    const squishPulse = this.squishTimer > 0 ? 0.7 + 0.3 * (1 - this.squishTimer / 180) : 1;
    ctx.scale(1, squishPulse);
    const damage = 1 - (this.hits / this.maxHits) * 0.25;
    const s = this.size * damage;
    // Body
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, s, s * 0.62, 0, 0, Math.PI * 2);
    ctx.fill();
    // Tail
    ctx.beginPath();
    ctx.moveTo(-s, 0);
    ctx.lineTo(-s * 1.5, -s * 0.55);
    ctx.lineTo(-s * 1.5, s * 0.55);
    ctx.closePath();
    ctx.fill();
    // Stripes for big fish
    if (this.maxHits >= 3) {
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 2;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(i * s * 0.3, -s * 0.55);
        ctx.lineTo(i * s * 0.3, s * 0.55);
        ctx.stroke();
      }
    }
    // Dorsal fin
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(-s * 0.1, -s * 0.55);
    ctx.lineTo(s * 0.1, -s * 0.9);
    ctx.lineTo(s * 0.3, -s * 0.55);
    ctx.closePath();
    ctx.fill();
    // Eye
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(s * 0.45, -s * 0.18, s * 0.16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(s * 0.5, -s * 0.18, s * 0.08, 0, Math.PI * 2);
    ctx.fill();
    // Mouth
    if (this.hungry) {
      ctx.fillStyle = '#550011';
      ctx.beginPath();
      ctx.arc(s * 0.88, s * 0.08, s * 0.26, 0, Math.PI * 2);
      ctx.fill();
      // Teeth
      ctx.fillStyle = 'white';
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(s * 0.72 + i * s * 0.09, s * -0.08);
        ctx.lineTo(s * 0.75 + i * s * 0.09, s * 0.08);
        ctx.lineTo(s * 0.78 + i * s * 0.09, s * -0.08);
        ctx.fill();
      }
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(s * 0.72 + i * s * 0.09, s * 0.24);
        ctx.lineTo(s * 0.75 + i * s * 0.09, s * 0.08);
        ctx.lineTo(s * 0.78 + i * s * 0.09, s * 0.24);
        ctx.fill();
      }
      // Angry eyebrow
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(s * 0.3, -s * 0.45);
      ctx.lineTo(s * 0.6, -s * 0.3);
      ctx.stroke();
    } else {
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(s * 0.8, s * 0.02);
      ctx.lineTo(s * 0.95, s * 0.12);
      ctx.stroke();
      // Happy smile
      ctx.beginPath();
      ctx.arc(s * 0.85, s * 0.07, s * 0.08, 0, Math.PI);
      ctx.stroke();
    }
    // Frozen overlay
    if (this.frozenTimer > 0) {
      ctx.fillStyle = 'rgba(150, 210, 255, 0.45)';
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 1.3, s * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * s * 0.85, Math.sin(a) * s * 0.55);
        ctx.lineTo(Math.cos(a) * s * 1.15, Math.sin(a) * s * 0.75);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
  canBeSquished() {
    return this.squishTimer <= 0 && (this.frozenTimer > 0 || !this.hungry);
  }
  squish() {
    this.hits++;
    this.squishTimer = 180;
    if (this.hits >= this.maxHits) {
      this.alive = false;
      return this.points;
    }
    return 0;
  }
  hitbox() {
    return { x: this.x - this.size, y: this.y - this.size * 0.62, w: this.size * 2, h: this.size * 1.24 };
  }
}

// ==========================================================================
// OBSTACLES — urchin, rock, crab, shark
// ==========================================================================
class Urchin {
  constructor() {
    this.x = 40 + Math.random() * (W - 80);
    this.y = H - 35 - Math.random() * 90;
    this.r = 16;
  }
  update() {}
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.strokeStyle = '#2a0033';
    ctx.lineWidth = 3;
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * this.r * 0.5, Math.sin(a) * this.r * 0.5);
      ctx.lineTo(Math.cos(a) * (this.r + 12), Math.sin(a) * (this.r + 12));
      ctx.stroke();
    }
    ctx.fillStyle = '#4a1166';
    ctx.beginPath();
    ctx.arc(0, 0, this.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#661188';
    ctx.beginPath();
    ctx.arc(-3, -4, this.r * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  hitbox() {
    return { x: this.x - this.r - 4, y: this.y - this.r - 4, w: (this.r + 4) * 2, h: (this.r + 4) * 2 };
  }
}

class Rock {
  constructor() {
    this.x = 40 + Math.random() * (W - 80);
    this.y = H - 25 - Math.random() * 60;
    this.w = 46 + Math.random() * 28;
    this.h = 32 + Math.random() * 18;
  }
  update() {}
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.fillStyle = '#555566';
    ctx.beginPath();
    ctx.moveTo(-this.w / 2, this.h / 2);
    ctx.lineTo(-this.w / 2, -this.h * 0.1);
    ctx.lineTo(-this.w * 0.25, -this.h * 0.55);
    ctx.lineTo(this.w * 0.05, -this.h * 0.3);
    ctx.lineTo(this.w * 0.3, -this.h * 0.6);
    ctx.lineTo(this.w / 2, this.h * 0.1);
    ctx.lineTo(this.w * 0.4, this.h / 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#777788';
    ctx.beginPath();
    ctx.moveTo(-this.w * 0.25, -this.h * 0.55);
    ctx.lineTo(-this.w * 0.1, -this.h * 0.3);
    ctx.lineTo(-this.w * 0.35, -this.h * 0.25);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(this.w * 0.3, -this.h * 0.6);
    ctx.lineTo(this.w * 0.45, -this.h * 0.3);
    ctx.lineTo(this.w * 0.15, -this.h * 0.25);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  hitbox() {
    return { x: this.x - this.w * 0.45, y: this.y - this.h * 0.45, w: this.w * 0.9, h: this.h * 0.9 };
  }
}

class Crab {
  constructor() {
    this.x = 30 + Math.random() * (W - 60);
    this.y = H - 25;
    this.direction = Math.random() < 0.5 ? 1 : -1;
    this.speed = 0.9;
    this.legPhase = 0;
  }
  update() {
    this.x += this.direction * this.speed;
    this.legPhase += 0.22;
    if (this.x < 25 || this.x > W - 25) this.direction *= -1;
  }
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    // Legs
    ctx.strokeStyle = '#cc2211';
    ctx.lineWidth = 3;
    for (let i = -1; i <= 1; i++) {
      const bob = Math.sin(this.legPhase + i) * 2;
      ctx.beginPath();
      ctx.moveTo(i * 5 - 6, 6);
      ctx.lineTo(i * 5 - 14, 14 + bob);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(i * 5 + 6, 6);
      ctx.lineTo(i * 5 + 14, 14 + bob);
      ctx.stroke();
    }
    // Claws
    ctx.fillStyle = '#dd3322';
    ctx.beginPath();
    ctx.ellipse(-22, -2, 7, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(22, -2, 7, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    // Body
    ctx.fillStyle = '#dd3322';
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    // Eyes on stalks
    ctx.strokeStyle = '#dd3322';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-5, -6);
    ctx.lineTo(-5, -12);
    ctx.moveTo(5, -6);
    ctx.lineTo(5, -12);
    ctx.stroke();
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(-5, -13, 3, 0, Math.PI * 2);
    ctx.arc(5, -13, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(-5, -13, 1.5, 0, Math.PI * 2);
    ctx.arc(5, -13, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  hitbox() {
    return { x: this.x - 22, y: this.y - 15, w: 44, h: 26 };
  }
}

class Shark {
  constructor(level) {
    this.direction = Math.random() < 0.5 ? 1 : -1;
    this.x = this.direction === 1 ? -120 : W + 120;
    this.y = 90 + Math.random() * (H - 200);
    this.size = 45;
    this.speed = 1.4 + level * 0.18;
    this.alive = true;
    this.chaseRange = 220;
    this.maxHits = 15;
    this.hits = 0;
    this.squishTimer = 0;
    this.frozenTimer = 0;
    this.points = 500;
    this.flashTimer = 0;
  }
  update(dt, player) {
    if (this.squishTimer > 0) this.squishTimer -= dt;
    if (this.flashTimer > 0) this.flashTimer -= dt;
    if (this.frozenTimer > 0) {
      this.frozenTimer -= dt;
      return;
    }
    const dx = player.x - this.x;
    if (Math.abs(dx) < this.chaseRange) {
      if (Math.abs(dx) > 25) this.direction = dx > 0 ? 1 : -1;
      const dy = player.y - this.y;
      this.y += Math.sign(dy) * this.speed * 0.4;
    }
    this.y = Math.max(80, Math.min(H - 60, this.y));
    this.x += this.direction * this.speed;
    if (this.x < -250 || this.x > W + 250) this.alive = false;
  }
  canBeSquished() { return this.squishTimer <= 0; }
  squish() {
    if (this.squishTimer > 0) return 0;
    this.squishTimer = 150;
    return this.takeDamage(1);
  }
  takeDamage(amount) {
    this.hits += amount;
    this.flashTimer = 150;
    if (this.hits >= this.maxHits) {
      this.alive = false;
      return this.points;
    }
    return 0;
  }
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.direction === -1) ctx.scale(-1, 1);
    const s = this.size;
    const dmg = this.hits / this.maxHits;
    const r = Math.round(85 - dmg * 30);
    const g = Math.round(102 - dmg * 38);
    const b = Math.round(119 - dmg * 45);
    const bodyColor = this.flashTimer > 0 ? '#ff8866' : `rgb(${r}, ${g}, ${b})`;
    // Body
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, s, s * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();
    // Belly
    ctx.fillStyle = this.flashTimer > 0 ? '#ffccbb' : '#ccccdd';
    ctx.beginPath();
    ctx.ellipse(0, s * 0.15, s * 0.85, s * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
    // Top fin
    ctx.fillStyle = this.flashTimer > 0 ? '#dd6644' : '#455566';
    ctx.beginPath();
    ctx.moveTo(-5, -s * 0.38);
    ctx.lineTo(5, -s * 0.82);
    ctx.lineTo(18, -s * 0.38);
    ctx.closePath();
    ctx.fill();
    // Tail
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.moveTo(-s, 0);
    ctx.lineTo(-s * 1.45, -s * 0.55);
    ctx.lineTo(-s * 1.2, 0);
    ctx.lineTo(-s * 1.45, s * 0.55);
    ctx.closePath();
    ctx.fill();
    // Gills
    ctx.strokeStyle = '#334455';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(s * 0.15 + i * 6, -s * 0.2);
      ctx.lineTo(s * 0.13 + i * 6, s * 0.05);
      ctx.stroke();
    }
    // Eye
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(s * 0.6, -s * 0.12, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(s * 0.62, -s * 0.12, 2, 0, Math.PI * 2);
    ctx.fill();
    // Teeth
    ctx.fillStyle = 'white';
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(s * 0.72 + i * 5, s * 0.05);
      ctx.lineTo(s * 0.74 + i * 5, s * 0.18);
      ctx.lineTo(s * 0.76 + i * 5, s * 0.05);
      ctx.fill();
    }
    // Frozen overlay
    if (this.frozenTimer > 0) {
      ctx.fillStyle = 'rgba(150, 210, 255, 0.5)';
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 1.1, s * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * s * 0.7, Math.sin(a) * s * 0.3);
        ctx.lineTo(Math.cos(a) * s * 1.0, Math.sin(a) * s * 0.45);
        ctx.stroke();
      }
    }
    // Hit bar above shark (scale back because of possible -1 flip)
    if (this.hits > 0) {
      ctx.save();
      if (this.direction === -1) ctx.scale(-1, 1);
      const bw = 50, bh = 4;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(-bw / 2, -s * 0.55 - 12, bw, bh);
      ctx.fillStyle = '#ff4466';
      ctx.fillRect(-bw / 2, -s * 0.55 - 12, bw * (1 - dmg), bh);
      ctx.restore();
    }
    ctx.restore();
  }
  hitbox() {
    return { x: this.x - this.size * 0.9, y: this.y - this.size * 0.36, w: this.size * 1.8, h: this.size * 0.72 };
  }
}

// ==========================================================================
// TREASURE CHEST — guarded by rocks and urchins, opens on touch
// ==========================================================================
class TreasureChest {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = 54;
    this.h = 38;
    this.opened = false;
    this.openTimer = 0;
    this.points = 250;
    this.sparklePhase = 0;
  }
  update(dt) {
    if (this.opened) {
      this.sparklePhase += 0.12;
      if (this.openTimer > 0) this.openTimer -= dt;
    }
  }
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    // Body
    ctx.fillStyle = '#6a3a0f';
    ctx.fillRect(-this.w / 2, -this.h / 2 + 10, this.w, this.h - 10);
    // Planks
    ctx.strokeStyle = '#3a1a04';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(-this.w / 2 + (i * this.w / 4), -this.h / 2 + 10);
      ctx.lineTo(-this.w / 2 + (i * this.w / 4), this.h / 2);
      ctx.stroke();
    }
    // Metal bands
    ctx.fillStyle = '#c4a246';
    ctx.fillRect(-this.w / 2, -this.h / 2 + 10, this.w, 3);
    ctx.fillRect(-this.w / 2, this.h / 2 - 5, this.w, 3);
    if (!this.opened) {
      // Closed lid
      ctx.fillStyle = '#8b4513';
      ctx.beginPath();
      ctx.moveTo(-this.w / 2, -this.h / 2 + 12);
      ctx.quadraticCurveTo(0, -this.h / 2 - 12, this.w / 2, -this.h / 2 + 12);
      ctx.lineTo(this.w / 2, -this.h / 2 + 14);
      ctx.quadraticCurveTo(0, -this.h / 2 - 8, -this.w / 2, -this.h / 2 + 14);
      ctx.closePath();
      ctx.fill();
      // Lock
      ctx.fillStyle = '#ffdd44';
      ctx.fillRect(-5, -this.h / 2 + 4, 10, 9);
      ctx.fillStyle = '#222';
      ctx.fillRect(-1.5, -this.h / 2 + 7, 3, 4);
    } else {
      // Open lid, tilted back
      ctx.fillStyle = '#8b4513';
      ctx.beginPath();
      ctx.moveTo(-this.w / 2, -this.h / 2 + 12);
      ctx.lineTo(-this.w / 2 + 8, -this.h / 2 - 20);
      ctx.quadraticCurveTo(0, -this.h / 2 - 32, this.w / 2 - 8, -this.h / 2 - 20);
      ctx.lineTo(this.w / 2, -this.h / 2 + 12);
      ctx.closePath();
      ctx.fill();
      // Gold fill
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(-this.w / 2 + 4, -this.h / 2 + 12, this.w - 8, this.h - 20);
      // Coin bumps
      ctx.fillStyle = '#ffee88';
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(-this.w / 2 + 10 + i * 12, -this.h / 2 + 16, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      // Sparkles
      for (let i = 0; i < 5; i++) {
        const sp = (this.sparklePhase + i * 1.3) % (Math.PI * 2);
        const alpha = (Math.sin(sp) + 1) / 2;
        ctx.fillStyle = `rgba(255, 255, 220, ${alpha})`;
        const sx = -18 + i * 9;
        const sy = -this.h / 2 - 6 - Math.sin(sp) * 4;
        ctx.beginPath();
        ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }
  hitbox() {
    return { x: this.x - this.w / 2, y: this.y - this.h / 2, w: this.w, h: this.h };
  }
  open(player) {
    if (this.opened) return 0;
    this.opened = true;
    this.openTimer = 2000;
    if (player) {
      player.lives = MAX_LIVES;
      player.fireballs += 3;
      player.freezeballs += 3;
    }
    return this.points;
  }
}

// ==========================================================================
// SEAWEED — blue = poison (hurts), green = healing (+1 life)
// ==========================================================================
class Seaweed {
  constructor(poison, x) {
    this.poison = poison;
    this.x = x !== undefined ? x : 30 + Math.random() * (W - 60);
    this.baseY = H - 12;
    this.height = 58 + Math.random() * 34;
    this.sway = Math.random() * Math.PI * 2;
    this.used = false;
  }
  update(dt) {
    this.sway += 0.04;
  }
  draw(ctx) {
    if (this.used) return;
    ctx.save();
    ctx.translate(this.x, this.baseY);
    const stemColor = this.poison ? '#3377ee' : '#33bb44';
    const leafColor = this.poison ? '#1155bb' : '#228833';
    ctx.strokeStyle = stemColor;
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const segments = 8;
    const pts = [];
    ctx.beginPath();
    ctx.moveTo(0, 0);
    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const y = -this.height * t;
      const x = Math.sin(this.sway + t * 3) * 9 * t;
      pts.push({ x, y });
      ctx.lineTo(x, y);
    }
    ctx.stroke();
    // Leaves
    ctx.fillStyle = leafColor;
    for (let i = 0; i < pts.length; i += 2) {
      const p = pts[i];
      ctx.beginPath();
      ctx.ellipse(p.x + 7, p.y, 7, 3.5, 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(p.x - 7, p.y, 7, 3.5, -0.6, 0, Math.PI * 2);
      ctx.fill();
    }
    // Indicator: poison bubble or heal plus
    const tipX = pts[5] ? pts[5].x : 0;
    const tipY = -this.height * 0.72;
    if (this.poison) {
      ctx.fillStyle = 'rgba(120, 170, 255, 0.75)';
      ctx.beginPath();
      ctx.arc(tipX + 4, tipY + Math.sin(this.sway * 2) * 4, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(tipX - 3, tipY - 6 + Math.sin(this.sway * 2 + 1) * 3, 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Green plus / sparkle
      ctx.fillStyle = 'rgba(200, 255, 200, 0.95)';
      ctx.beginPath();
      ctx.arc(tipX, tipY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#116611';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(tipX - 3, tipY);
      ctx.lineTo(tipX + 3, tipY);
      ctx.moveTo(tipX, tipY - 3);
      ctx.lineTo(tipX, tipY + 3);
      ctx.stroke();
    }
    ctx.restore();
  }
  hitbox() {
    return { x: this.x - 10, y: this.baseY - this.height, w: 20, h: this.height };
  }
  consume(player) {
    if (this.used) return false;
    if (this.poison) {
      return player.hurt() ? 'hurt' : false;
    } else {
      if (player.heal()) {
        this.used = true;
        return 'heal';
      }
      return false;
    }
  }
}

// ==========================================================================
// PROJECTILES — magical fireballs and freezeballs from the treasure chest
// ==========================================================================
class Projectile {
  constructor(x, y, direction, type) {
    this.x = x;
    this.y = y;
    this.vx = direction * 9;
    this.type = type; // 'fire' | 'freeze'
    this.radius = 10;
    this.alive = true;
    this.trail = [];
    this.phase = 0;
  }
  update(dt) {
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 7) this.trail.shift();
    this.x += this.vx;
    this.phase += 0.3;
    if (this.x < -30 || this.x > W + 30) this.alive = false;
  }
  draw(ctx) {
    // Trail
    for (let i = 0; i < this.trail.length; i++) {
      const p = this.trail[i];
      const t = (i + 1) / this.trail.length;
      const a = t * 0.55;
      ctx.fillStyle = this.type === 'fire'
        ? `rgba(255, 160, 50, ${a})`
        : `rgba(150, 210, 255, ${a})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, this.radius * t * 0.9, 0, Math.PI * 2);
      ctx.fill();
    }
    // Core
    const pulse = 1 + Math.sin(this.phase) * 0.1;
    const rad = this.radius * pulse;
    const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, rad * 1.5);
    if (this.type === 'fire') {
      g.addColorStop(0,    '#ffffee');
      g.addColorStop(0.3,  '#ffdd44');
      g.addColorStop(0.65, '#ff6611');
      g.addColorStop(1,    'rgba(255, 60, 0, 0)');
    } else {
      g.addColorStop(0,    '#ffffff');
      g.addColorStop(0.3,  '#bbeeff');
      g.addColorStop(0.7,  '#3377ee');
      g.addColorStop(1,    'rgba(60, 120, 255, 0)');
    }
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(this.x, this.y, rad * 1.5, 0, Math.PI * 2);
    ctx.fill();
    // Cross sparkle
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(this.x - rad * 0.8, this.y);
    ctx.lineTo(this.x + rad * 0.8, this.y);
    ctx.moveTo(this.x, this.y - rad * 0.8);
    ctx.lineTo(this.x, this.y + rad * 0.8);
    ctx.stroke();
  }
  hitbox() {
    return { x: this.x - this.radius, y: this.y - this.radius, w: this.radius * 2, h: this.radius * 2 };
  }
}

// ==========================================================================
// LEVELS — each one a different colour
// ==========================================================================
const LEVELS = [
  { name: 'Shallow Bay',     bgTop: '#7fdbff', bgBottom: '#2978b5', target: 120,  fishMax: 5, sharks: 0 },
  { name: 'Coral Garden',    bgTop: '#ffb088', bgBottom: '#b5396e', target: 280,  fishMax: 6, sharks: 0 },
  { name: 'Kelp Forest',     bgTop: '#9ed670', bgBottom: '#2a5530', target: 460,  fishMax: 7, sharks: 1 },
  { name: 'Deep Purple',     bgTop: '#7c4fb8', bgBottom: '#1a0d33', target: 700,  fishMax: 8, sharks: 1 },
  { name: 'Sunset Waters',   bgTop: '#ffb347', bgBottom: '#9c2a5c', target: 1000, fishMax: 9, sharks: 2 },
  { name: 'Midnight Abyss',  bgTop: '#0c1e3d', bgBottom: '#000008', target: 1400, fishMax: 10, sharks: 3 },
];

// ==========================================================================
// GAME STATE
// ==========================================================================
const state = {
  mode: 'menu', // menu | customise | playing | gameOver | win
  player: null,
  fish: [],
  obstacles: [],
  sharks: [],
  seaweeds: [],
  chest: null,
  projectiles: [],
  level: 0,
  score: 0,
  levelScore: 0,
  fishSpawnTimer: 0,
  sharkSpawnTimer: 0,
  bubbles: [],
  banner: null,
  bannerTimer: 0,
  nameEntry: { active: false, name: '' },
  mouseX: 0, mouseY: 0,
  hoverStart: false, hoverCustom: false, hoverScores: false,
  hoverBack: false, hoverBackScores: false,
  hoverRestart: false, hoverViewScores: false,
};

function loadCustomisation() {
  try {
    const s = JSON.parse(localStorage.getItem('squishy-fish-customisation'));
    if (s) return s;
  } catch (e) {}
  return { suitColor: '#ffffff', maskColor: '#000000', flipperColor: '#000000', tankColor: '#c0c0c0' };
}
function saveCustomisation(c) {
  localStorage.setItem('squishy-fish-customisation', JSON.stringify(c));
}
let customisation = loadCustomisation();

// ==========================================================================
// HIGH SCORES — top 10 persisted in localStorage
// ==========================================================================
function loadHighScores() {
  try {
    const s = JSON.parse(localStorage.getItem(HIGHSCORE_KEY));
    if (Array.isArray(s)) return s;
  } catch (e) {}
  return [];
}
function saveHighScores(scores) {
  localStorage.setItem(HIGHSCORE_KEY, JSON.stringify(scores));
}
function addHighScore(name, score, level) {
  const scores = loadHighScores();
  const clean = (name || 'DIVER').toString().trim().slice(0, 10).toUpperCase() || 'DIVER';
  scores.push({ name: clean, score, level });
  scores.sort((a, b) => b.score - a.score);
  const capped = scores.slice(0, MAX_HIGHSCORES);
  saveHighScores(capped);
  return capped;
}
function isHighScore(score) {
  if (score <= 0) return false;
  const scores = loadHighScores();
  if (scores.length < MAX_HIGHSCORES) return true;
  return score > scores[scores.length - 1].score;
}
function clearHighScores() {
  localStorage.removeItem(HIGHSCORE_KEY);
}

// Append a single key to an in-progress high-score name.
// First character must be alphanumeric — prevents leading spaces, commas,
// or periods if the player was mid-action (squishing or firing) when they died.
function nameEntryAppend(name, key) {
  if (typeof key !== 'string' || key.length !== 1) return name;
  if (name.length >= 10) return name;
  const allowed = name.length === 0 ? /^[a-zA-Z0-9]$/ : /^[a-zA-Z0-9 ]$/;
  if (!allowed.test(key)) return name;
  return name + key;
}

function startGame() {
  state.mode = 'playing';
  state.player = new Player();
  Object.assign(state.player, customisation);
  state.level = 0;
  state.score = 0;
  setupLevel();
}

function setupLevel() {
  const lvl = LEVELS[state.level];
  state.obstacles = [];
  state.fish = [];
  state.sharks = [];
  state.seaweeds = [];
  state.chest = null;
  state.projectiles = [];
  state.levelScore = 0;
  state.fishSpawnTimer = 0;
  state.sharkSpawnTimer = 2000;

  // Base obstacles
  const numUrchins = 3 + state.level;
  const numRocks = 2 + Math.floor(state.level / 2);
  const numCrabs = 1 + Math.floor(state.level / 2);
  for (let i = 0; i < numUrchins; i++) state.obstacles.push(new Urchin());
  for (let i = 0; i < numRocks; i++) state.obstacles.push(new Rock());
  for (let i = 0; i < numCrabs; i++) state.obstacles.push(new Crab());

  // Seaweed (blue poison + green healing)
  const numPoison = 2 + state.level;
  const numHeal = 1 + Math.floor(state.level / 2);
  for (let i = 0; i < numPoison; i++) state.seaweeds.push(new Seaweed(true));
  for (let i = 0; i < numHeal; i++) state.seaweeds.push(new Seaweed(false));

  // Treasure chest guarded by extra urchins and rocks
  placeTreasureChest();

  state.banner = `Level ${state.level + 1}: ${lvl.name}`;
  state.bannerTimer = 2500;
  // Put player back in centre, safe from bottom obstacles
  if (state.player) {
    state.player.x = W / 2;
    state.player.y = H / 2;
    state.player.invulnTimer = 1000;
  }
}

function placeTreasureChest() {
  const cx = 140 + Math.random() * (W - 280);
  const cy = H - 55 - Math.random() * 90;
  state.chest = new TreasureChest(cx, cy);
  // Guards: ring of urchins/rocks around the chest
  const numGuards = 4 + state.level;
  for (let i = 0; i < numGuards; i++) {
    const angle = (i / numGuards) * Math.PI * 2;
    const radius = 52 + Math.random() * 16;
    const gx = cx + Math.cos(angle) * radius;
    const gy = cy + Math.sin(angle) * radius * 0.55;
    if (gx < 30 || gx > W - 30 || gy > H - 16 || gy < 60) continue;
    if (Math.random() < 0.55) {
      const u = new Urchin();
      u.x = gx; u.y = gy;
      state.obstacles.push(u);
    } else {
      const r = new Rock();
      r.x = gx; r.y = gy;
      state.obstacles.push(r);
    }
  }
}

// ==========================================================================
// COLLISIONS
// ==========================================================================
function aabb(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// ==========================================================================
// MAIN LOOP
// ==========================================================================
let lastTime = performance.now();
function loop(now) {
  const dt = Math.min(50, now - lastTime);
  lastTime = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

function update(dt) {
  if (state.bannerTimer > 0) state.bannerTimer -= dt;
  // Ambient bubbles always
  if (Math.random() < 0.12) {
    state.bubbles.push({
      x: Math.random() * W,
      y: H + 10,
      r: 2 + Math.random() * 5,
      speed: 0.5 + Math.random() * 1.0,
      wob: Math.random() * Math.PI * 2,
    });
  }
  state.bubbles.forEach(b => {
    b.y -= b.speed;
    b.wob += 0.05;
    b.x += Math.sin(b.wob) * 0.3;
  });
  state.bubbles = state.bubbles.filter(b => b.y > -10);

  if (state.mode !== 'playing') return;

  const lvl = LEVELS[state.level];
  state.player.update(dt);

  // Spawn fish
  state.fishSpawnTimer -= dt;
  if (state.fishSpawnTimer <= 0 && state.fish.length < lvl.fishMax) {
    state.fish.push(new Fish(state.level));
    state.fishSpawnTimer = 500 + Math.random() * 700;
  }
  state.fish.forEach(f => f.update(dt));
  state.fish = state.fish.filter(f => f.alive);

  // Spawn sharks
  if (lvl.sharks > 0) {
    state.sharkSpawnTimer -= dt;
    if (state.sharkSpawnTimer <= 0 && state.sharks.length < lvl.sharks) {
      state.sharks.push(new Shark(state.level));
      state.sharkSpawnTimer = 5000 + Math.random() * 4000;
    }
  }
  state.sharks.forEach(s => s.update(dt, state.player));
  state.sharks = state.sharks.filter(s => s.alive);

  // Obstacles (crab walk)
  state.obstacles.forEach(o => o.update(dt));

  // Seaweed sway
  state.seaweeds.forEach(sw => sw.update(dt));

  // Chest sparkle
  if (state.chest) state.chest.update(dt);

  // Projectiles
  state.projectiles.forEach(p => p.update(dt));

  // Projectile vs enemies
  for (const proj of state.projectiles) {
    if (!proj.alive) continue;
    const pb = proj.hitbox();
    // vs fish
    for (const fish of state.fish) {
      if (!fish.alive) continue;
      if (!aabb(pb, fish.hitbox())) continue;
      if (proj.type === 'fire') {
        state.score += fish.points;
        state.levelScore += fish.points;
        fish.alive = false;
        sound.splat();
      } else {
        fish.frozenTimer = 5000;
      }
      proj.alive = false;
      break;
    }
    if (!proj.alive) continue;
    // vs sharks
    for (const shark of state.sharks) {
      if (!shark.alive) continue;
      if (!aabb(pb, shark.hitbox())) continue;
      if (proj.type === 'fire') {
        const pts = shark.takeDamage(5);
        if (pts > 0) {
          state.score += pts;
          state.levelScore += pts;
        }
        sound.splat();
      } else {
        shark.frozenTimer = 5000;
      }
      proj.alive = false;
      break;
    }
  }
  state.projectiles = state.projectiles.filter(p => p.alive);

  // Collisions
  const pbox = state.player.hitbox();

  // Fish
  for (const fish of state.fish) {
    if (!fish.alive) continue;
    if (!aabb(pbox, fish.hitbox())) continue;
    if (fish.hungry && fish.frozenTimer <= 0) {
      if (state.player.hurt()) sound.hit();
    } else if (keys[' '] && fish.canBeSquished()) {
      const pts = fish.squish();
      if (pts > 0) {
        state.score += pts;
        state.levelScore += pts;
      }
      sound.splat();
    }
  }

  // Obstacles (urchin / rock / crab)
  for (const ob of state.obstacles) {
    if (aabb(pbox, ob.hitbox())) {
      if (state.player.hurt()) sound.hit();
    }
  }

  // Sharks — hurt when not frozen, squishable with SPACE (15 hits)
  for (const s of state.sharks) {
    if (!s.alive) continue;
    if (!aabb(pbox, s.hitbox())) continue;
    if (s.frozenTimer <= 0) {
      if (state.player.hurt()) sound.hit();
    }
    if (keys[' '] && s.canBeSquished()) {
      const pts = s.squish();
      if (pts > 0) {
        state.score += pts;
        state.levelScore += pts;
      }
      sound.splat();
    }
  }

  // Seaweed (poison blue or healing green)
  for (const sw of state.seaweeds) {
    if (sw.used) continue;
    if (!aabb(pbox, sw.hitbox())) continue;
    const r = sw.consume(state.player);
    if (r === 'hurt') sound.hit();
    else if (r === 'heal') sound.heal();
  }

  // Treasure chest — gold + full heal + 3 fireballs + 3 freezeballs
  if (state.chest && !state.chest.opened && aabb(pbox, state.chest.hitbox())) {
    const pts = state.chest.open(state.player);
    if (pts > 0) {
      state.score += pts;
      state.levelScore += pts;
      sound.treasure();
    }
  }

  // Death
  if (state.player.lives <= 0) {
    state.mode = 'gameOver';
    sound.gameOver();
    if (isHighScore(state.score)) {
      state.nameEntry.active = true;
      state.nameEntry.name = '';
    }
    return;
  }

  // Level complete
  if (state.levelScore >= lvl.target) {
    if (state.level >= LEVELS.length - 1) {
      state.mode = 'win';
      sound.levelUp();
      if (isHighScore(state.score)) {
        state.nameEntry.active = true;
        state.nameEntry.name = '';
      }
    } else {
      state.level++;
      sound.levelUp();
      setupLevel();
    }
  }
}

// ==========================================================================
// DRAWING
// ==========================================================================
function draw() {
  const showLevelBg = state.mode === 'playing' || state.mode === 'gameOver' || state.mode === 'win';
  const lvl = showLevelBg ? LEVELS[state.level] : LEVELS[0];

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, lvl.bgTop);
  grad.addColorStop(1, lvl.bgBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Seabed sand
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.fillRect(0, H - 12, W, 12);
  ctx.fillStyle = 'rgba(255, 220, 150, 0.15)';
  ctx.fillRect(0, H - 10, W, 10);

  // Bubbles
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  state.bubbles.forEach(b => {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
  });

  if (state.mode === 'menu') { drawMenu(); return; }
  if (state.mode === 'customise') { drawCustomise(); return; }
  if (state.mode === 'highscores') { drawHighScores(); return; }

  // Game entities (back to front: seaweed, chest, obstacles, fish, sharks, projectiles, player)
  state.seaweeds.forEach(sw => sw.draw(ctx));
  if (state.chest) state.chest.draw(ctx);
  state.obstacles.forEach(o => o.draw(ctx));
  state.fish.forEach(f => f.draw(ctx));
  state.sharks.forEach(s => s.draw(ctx));
  state.projectiles.forEach(p => p.draw(ctx));
  if (state.player) state.player.draw(ctx);

  drawHUD();

  // Banner
  if (state.bannerTimer > 0 && state.banner) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, state.bannerTimer / 500);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, H / 2 - 45, W, 90);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 42px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(state.banner, W / 2, H / 2 + 15);
    ctx.restore();
  }

  if (state.mode === 'gameOver') drawGameOver();
  if (state.mode === 'win') drawWin();
}

function drawHUD() {
  const lvl = LEVELS[state.level];
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, W, 62);
  ctx.fillStyle = 'white';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Score: ${state.score}`, 12, 22);
  ctx.font = '14px sans-serif';
  ctx.fillText(`Level ${state.level + 1}: ${lvl.name}`, 12, 40);

  // Progress bar
  const progFrac = Math.min(1, state.levelScore / lvl.target);
  const barX = 220, barY = 30, barW = 220, barH = 12;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.fillRect(barX, barY, barW, barH);
  ctx.fillStyle = '#44ff88';
  ctx.fillRect(barX, barY, barW * progFrac, barH);
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barW, barH);
  ctx.font = '12px sans-serif';
  ctx.fillStyle = 'white';
  ctx.fillText(`${state.levelScore} / ${lvl.target}`, barX, barY - 2);

  // Lives as hearts
  ctx.textAlign = 'right';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillStyle = '#ff5566';
  const hearts = '♥'.repeat(Math.max(0, state.player.lives));
  ctx.fillText(hearts, W - 12, 24);
  ctx.fillStyle = 'white';
  ctx.font = '11px sans-serif';
  ctx.fillText(`Lives: ${state.player.lives}`, W - 12, 38);

  // Inventory row: fireballs and freezeballs
  ctx.textAlign = 'left';
  ctx.font = 'bold 12px sans-serif';
  // "<" key hint + fireball icon
  ctx.fillStyle = '#bbbbbb';
  ctx.fillText('<', 12, 58);
  const fx = 26;
  const fg = ctx.createRadialGradient(fx, 54, 0, fx, 54, 9);
  fg.addColorStop(0,    '#ffffee');
  fg.addColorStop(0.4,  '#ffcc33');
  fg.addColorStop(1,    '#ff4400');
  ctx.fillStyle = fg;
  ctx.beginPath();
  ctx.arc(fx, 54, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = state.player.fireballs > 0 ? 'white' : '#666';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText(`x${state.player.fireballs}`, fx + 11, 58);

  // ">" key hint + freezeball icon
  ctx.fillStyle = '#bbbbbb';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('>', 72, 58);
  const zx = 88;
  const zg = ctx.createRadialGradient(zx, 54, 0, zx, 54, 9);
  zg.addColorStop(0,    '#ffffff');
  zg.addColorStop(0.4,  '#aaddff');
  zg.addColorStop(1,    '#2266dd');
  ctx.fillStyle = zg;
  ctx.beginPath();
  ctx.moveTo(zx, 46);
  ctx.lineTo(zx + 8, 54);
  ctx.lineTo(zx, 62);
  ctx.lineTo(zx - 8, 54);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = state.player.freezeballs > 0 ? 'white' : '#666';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText(`x${state.player.freezeballs}`, zx + 11, 58);

  ctx.restore();
}

function drawMenu() {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
  ctx.fillRect(W / 2 - 330, 50, 660, 520);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 2;
  ctx.strokeRect(W / 2 - 330, 50, 660, 520);

  // Title
  ctx.fillStyle = '#ffee44';
  ctx.font = 'bold 60px sans-serif';
  ctx.fillText('Squishy Fish', W / 2, 128);
  ctx.fillStyle = 'white';
  ctx.font = 'italic 18px sans-serif';
  ctx.fillText('by Freya Nesbitt-Smith (age 7¼)', W / 2, 154);

  // How to play
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('How to play', W / 2, 188);
  ctx.font = '14px sans-serif';
  ctx.fillText('Use ← → ↑ ↓ to swim, hold SPACE to squish fish & sharks', W / 2, 204);
  ctx.fillText('AVOID fish with open mouths — they bite!', W / 2, 222);
  ctx.fillText('Sharks take 15 squishes to kill — watch for bite-backs', W / 2, 240);
  ctx.fillText('Dodge urchins, pointy rocks and crabs', W / 2, 258);
  ctx.fillStyle = '#99ccff';
  ctx.fillText('BLUE seaweed is poison — don\'t touch!', W / 2, 276);
  ctx.fillStyle = '#99ff99';
  ctx.fillText('GREEN seaweed gives an extra life (max 10)', W / 2, 294);
  ctx.fillStyle = '#ffdd44';
  ctx.fillText('TREASURE CHEST: full lives + 3 fire + 3 ice balls!', W / 2, 312);
  ctx.fillStyle = '#ffaa66';
  ctx.fillText('Press  <  to throw FIRE,   >  to throw ICE', W / 2, 330);
  ctx.fillStyle = 'white';

  drawButton(W / 2, 368, 260, 44, 'Start Game', state.hoverStart);
  drawButton(W / 2, 422, 260, 42, 'Customise Diver', state.hoverCustom);
  drawButton(W / 2, 474, 260, 42, 'High Scores', state.hoverScores);
  ctx.restore();
}

function drawButton(cx, cy, w, h, text, hover) {
  ctx.fillStyle = hover ? '#ffaa44' : '#ee6611';
  ctx.fillRect(cx - w / 2, cy - h / 2, w, h);
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 3;
  ctx.strokeRect(cx - w / 2, cy - h / 2, w, h);
  ctx.fillStyle = 'white';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, cy);
  ctx.textBaseline = 'alphabetic';
}

// Customiser layout constants so click + draw agree
const CUSTOM_PARTS = [
  { key: 'suitColor',    label: 'Suit'    },
  { key: 'maskColor',    label: 'Mask'    },
  { key: 'flipperColor', label: 'Flippers'},
  { key: 'tankColor',    label: 'Tank'    },
];
const CUSTOM_COLORS = [
  '#ffffff','#000000','#ff4444','#ff8800','#ffee00','#44dd44',
  '#44aaff','#aa44ff','#ff88cc','#884400','#c0c0c0'
];
const CUSTOM_SWATCH = 30;
const CUSTOM_GAP = 8;
const CUSTOM_ROW_H = 48;
const CUSTOM_START_Y = 300;
function customColorRect(rowIdx, colIdx) {
  const totalW = CUSTOM_COLORS.length * CUSTOM_SWATCH + (CUSTOM_COLORS.length - 1) * CUSTOM_GAP;
  const startX = W / 2 - totalW / 2 + 40;
  const x = startX + colIdx * (CUSTOM_SWATCH + CUSTOM_GAP);
  const y = CUSTOM_START_Y + rowIdx * CUSTOM_ROW_H;
  return { x, y, w: CUSTOM_SWATCH, h: CUSTOM_SWATCH };
}

function drawCustomise() {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.fillRect(W / 2 - 340, 60, 680, 510);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 2;
  ctx.strokeRect(W / 2 - 340, 60, 680, 510);

  ctx.fillStyle = '#ffee44';
  ctx.font = 'bold 38px sans-serif';
  ctx.fillText('Customise Your Diver', W / 2, 110);

  // Preview diver (swim idle)
  const preview = new Player();
  Object.assign(preview, customisation);
  preview.x = W / 2;
  preview.y = 200;
  preview.draw(ctx);

  // Colour rows
  CUSTOM_PARTS.forEach((part, row) => {
    const r0 = customColorRect(row, 0);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(part.label, r0.x - 12, r0.y + 22);
    CUSTOM_COLORS.forEach((c, col) => {
      const r = customColorRect(row, col);
      ctx.fillStyle = c;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      if (customisation[part.key] === c) {
        ctx.strokeStyle = '#ffee44';
        ctx.lineWidth = 4;
        ctx.strokeRect(r.x - 2, r.y - 2, r.w + 4, r.h + 4);
      } else {
        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.lineWidth = 1;
        ctx.strokeRect(r.x, r.y, r.w, r.h);
      }
    });
  });

  drawButton(W / 2, 540, 240, 44, 'Back to Menu', state.hoverBack);
  ctx.restore();
}

function drawGameOver() {
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.74)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#ff6688';
  ctx.textAlign = 'center';
  ctx.font = 'bold 64px sans-serif';
  ctx.fillText('Game Over', W / 2, H / 2 - 130);
  ctx.fillStyle = 'white';
  ctx.font = '26px sans-serif';
  ctx.fillText(`Final Score: ${state.score}`, W / 2, H / 2 - 85);
  ctx.font = '17px sans-serif';
  ctx.fillText(`Reached Level ${state.level + 1}: ${LEVELS[state.level].name}`, W / 2, H / 2 - 60);
  if (state.nameEntry.active) {
    drawNameEntry(H / 2 - 20);
  } else {
    drawButton(W / 2 - 135, H / 2 + 70, 240, 46, 'Play Again', state.hoverRestart);
    drawButton(W / 2 + 135, H / 2 + 70, 240, 46, 'High Scores', state.hoverViewScores);
  }
  ctx.restore();
}

function drawWin() {
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 50, 0.78)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#ffee44';
  ctx.textAlign = 'center';
  ctx.font = 'bold 68px sans-serif';
  ctx.fillText('YOU WIN!', W / 2, H / 2 - 140);
  ctx.fillStyle = 'white';
  ctx.font = '22px sans-serif';
  ctx.fillText('You squished your way through every level!', W / 2, H / 2 - 100);
  ctx.font = 'bold 30px sans-serif';
  ctx.fillStyle = '#44ffaa';
  ctx.fillText(`Final Score: ${state.score}`, W / 2, H / 2 - 65);
  if (state.nameEntry.active) {
    drawNameEntry(H / 2 - 20);
  } else {
    drawButton(W / 2 - 135, H / 2 + 70, 240, 46, 'Play Again', state.hoverRestart);
    drawButton(W / 2 + 135, H / 2 + 70, 240, 46, 'High Scores', state.hoverViewScores);
  }
  ctx.restore();
}

function drawNameEntry(y) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffee44';
  ctx.font = 'bold 30px sans-serif';
  ctx.fillText('★ NEW HIGH SCORE! ★', W / 2, y);
  ctx.fillStyle = 'white';
  ctx.font = '17px sans-serif';
  ctx.fillText('Type your name then press ENTER', W / 2, y + 28);
  const boxW = 340, boxH = 50;
  const bx = W / 2 - boxW / 2, by = y + 44;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.fillRect(bx, by, boxW, boxH);
  ctx.strokeStyle = '#ffee44';
  ctx.lineWidth = 3;
  ctx.strokeRect(bx, by, boxW, boxH);
  ctx.fillStyle = 'white';
  ctx.font = 'bold 28px "SF Mono", Menlo, monospace';
  const display = state.nameEntry.name.toUpperCase();
  const blink = Math.floor(performance.now() / 450) % 2 === 0 ? '_' : ' ';
  ctx.fillText(display + blink, W / 2, by + 36);
  ctx.restore();
}

function drawHighScores() {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.fillRect(W / 2 - 340, 50, 680, 520);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 2;
  ctx.strokeRect(W / 2 - 340, 50, 680, 520);

  ctx.fillStyle = '#ffee44';
  ctx.font = 'bold 48px sans-serif';
  ctx.fillText('High Scores', W / 2, 110);

  const scores = loadHighScores();
  if (scores.length === 0) {
    ctx.fillStyle = '#ccd6ee';
    ctx.font = 'italic 22px sans-serif';
    ctx.fillText('No scores yet — be the first!', W / 2, 290);
  } else {
    ctx.fillStyle = '#ffcc88';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('#',     W / 2 - 260, 158);
    ctx.fillText('Name',  W / 2 - 220, 158);
    ctx.textAlign = 'right';
    ctx.fillText('Score', W / 2 + 130, 158);
    ctx.fillText('Level', W / 2 + 260, 158);
    ctx.strokeStyle = 'rgba(255,204,136,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 280, 166);
    ctx.lineTo(W / 2 + 280, 166);
    ctx.stroke();

    ctx.font = '20px "SF Mono", Menlo, monospace';
    scores.forEach((s, i) => {
      const y = 196 + i * 34;
      const color = i === 0 ? '#ffee44' : i < 3 ? '#ffcc88' : 'white';
      ctx.fillStyle = color;
      ctx.textAlign = 'left';
      ctx.fillText(`${i + 1}.`, W / 2 - 260, y);
      ctx.fillText(s.name, W / 2 - 220, y);
      ctx.textAlign = 'right';
      ctx.fillText(String(s.score), W / 2 + 130, y);
      ctx.fillText(`Lvl ${s.level + 1}`, W / 2 + 260, y);
    });
  }

  drawButton(W / 2, 544, 260, 44, 'Back to Menu', state.hoverBackScores);
  ctx.restore();
}

// ==========================================================================
// MOUSE
// ==========================================================================
function getMousePos(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * (W / rect.width),
    y: (e.clientY - rect.top) * (H / rect.height),
  };
}

function inRect(mx, my, cx, cy, w, h) {
  return mx >= cx - w / 2 && mx <= cx + w / 2 && my >= cy - h / 2 && my <= cy + h / 2;
}

canvas.addEventListener('mousemove', (e) => {
  const p = getMousePos(e);
  state.mouseX = p.x; state.mouseY = p.y;
  state.hoverStart = state.mode === 'menu' && inRect(p.x, p.y, W / 2, 368, 260, 44);
  state.hoverCustom = state.mode === 'menu' && inRect(p.x, p.y, W / 2, 422, 260, 42);
  state.hoverScores = state.mode === 'menu' && inRect(p.x, p.y, W / 2, 474, 260, 42);
  state.hoverBack = state.mode === 'customise' && inRect(p.x, p.y, W / 2, 540, 240, 44);
  state.hoverBackScores = state.mode === 'highscores' && inRect(p.x, p.y, W / 2, 544, 260, 44);
  const gameEndActive = (state.mode === 'gameOver' || state.mode === 'win') && !state.nameEntry.active;
  state.hoverRestart = gameEndActive && inRect(p.x, p.y, W / 2 - 135, H / 2 + 70, 240, 46);
  state.hoverViewScores = gameEndActive && inRect(p.x, p.y, W / 2 + 135, H / 2 + 70, 240, 46);
});

canvas.addEventListener('click', (e) => {
  sound.init();
  const p = getMousePos(e);
  if (state.mode === 'menu') {
    if (inRect(p.x, p.y, W / 2, 368, 260, 44)) startGame();
    else if (inRect(p.x, p.y, W / 2, 422, 260, 42)) state.mode = 'customise';
    else if (inRect(p.x, p.y, W / 2, 474, 260, 42)) state.mode = 'highscores';
    return;
  }
  if (state.mode === 'customise') {
    CUSTOM_PARTS.forEach((part, row) => {
      CUSTOM_COLORS.forEach((c, col) => {
        const r = customColorRect(row, col);
        if (p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h) {
          customisation[part.key] = c;
          saveCustomisation(customisation);
        }
      });
    });
    if (inRect(p.x, p.y, W / 2, 540, 240, 44)) state.mode = 'menu';
    return;
  }
  if (state.mode === 'highscores') {
    if (inRect(p.x, p.y, W / 2, 544, 260, 44)) state.mode = 'menu';
    return;
  }
  if ((state.mode === 'gameOver' || state.mode === 'win') && !state.nameEntry.active) {
    if (inRect(p.x, p.y, W / 2 - 135, H / 2 + 70, 240, 46)) {
      state.mode = 'menu';
    } else if (inRect(p.x, p.y, W / 2 + 135, H / 2 + 70, 240, 46)) {
      state.mode = 'highscores';
    }
  }
});

// ==========================================================================
// GO
// ==========================================================================
if (!window.SQUISHY_TEST_MODE) {
  requestAnimationFrame(loop);
}
