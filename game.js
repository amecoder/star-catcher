// Screen, input and sound for the game. The rules live in logic.js.
import {
  createState, step, makeRandom, rankFor, shareText, GAME_SECONDS, ITEM_TYPES,
} from './logic.js';

const canvas = document.getElementById('sky');
const ctx = canvas.getContext('2d');
const $ = (id) => document.getElementById(id);
const BEST_KEY = 'star-catcher-best';
const SHARE_URL = 'https://amecoder.github.io/star-catcher/';

const backgroundStars = Array.from({ length: 70 }, (_, i) => ({
  x: (i * 97) % canvas.width,
  y: (i * 53) % canvas.height,
  r: (i % 3) * 0.5 + 0.5,
}));

let state = createState(canvas.width, canvas.height);
let targetX = canvas.width / 2;
let sparks = [];
let lastTime = 0;
let random = makeRandom(Date.now());

function readBest() {
  try { return Number(localStorage.getItem(BEST_KEY)) || 0; } catch { return 0; }
}

function saveBest(score) {
  try { localStorage.setItem(BEST_KEY, String(score)); } catch { /* private mode: keep playing */ }
}

function toCanvasX(clientX) {
  const rect = canvas.getBoundingClientRect();
  return ((clientX - rect.left) / rect.width) * canvas.width;
}

canvas.addEventListener('pointermove', (e) => { targetX = toCanvasX(e.clientX); });
canvas.addEventListener('pointerdown', (e) => { targetX = toCanvasX(e.clientX); });

const keys = new Set();
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { keys.add(e.key); e.preventDefault(); }
});
window.addEventListener('keyup', (e) => keys.delete(e.key));

function drawItem(item) {
  const { radius } = ITEM_TYPES[item.type];
  ctx.save();
  ctx.translate(item.x, item.y);
  if (item.type === 'rock') {
    ctx.fillStyle = '#7a7393';
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
  } else {
    const color = item.type === 'gold' ? '#ffb347' : '#ffd866';
    ctx.shadowColor = color;
    ctx.shadowBlur = 18;
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? radius : radius * 0.45;
      const a = (Math.PI / 5) * i - Math.PI / 2;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  for (const s of backgroundStars) {
    ctx.fillRect(s.x, s.y, s.r, s.r);
  }
  state.items.forEach(drawItem);

  for (const p of sparks) {
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.color;
    ctx.fillText(p.text, p.x, p.y);
  }
  ctx.globalAlpha = 1;

  const b = state.basket;
  const top = canvas.height - 40;
  ctx.fillStyle = '#ff7ab6';
  ctx.beginPath();
  ctx.roundRect(b.x - b.width / 2, top, b.width, b.height, 9);
  ctx.fill();
}

function addSparks(events) {
  for (const e of events) {
    if (e.kind === 'catch') {
      sparks.push({ x: e.x, y: canvas.height - 50, life: 1, color: '#ffd866', text: e.type === 'gold' ? '+5' : '+1' });
    } else if (e.kind === 'hit') {
      sparks.push({ x: e.x, y: canvas.height - 50, life: 1, color: '#ff6b6b', text: '앗!' });
      if (navigator.vibrate) navigator.vibrate(80);
    }
  }
}

function updateHud() {
  $('score').textContent = state.score;
  $('time').textContent = Math.ceil(GAME_SECONDS - state.elapsed);
  $('lives').textContent = '❤️'.repeat(Math.max(0, state.lives)) || '💔';
}

function frame(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  if (keys.has('ArrowLeft')) targetX = state.basket.x - 420 * dt;
  if (keys.has('ArrowRight')) targetX = state.basket.x + 420 * dt;

  const result = step(state, dt, targetX, random);
  state = result.state;
  addSparks(result.events);
  sparks = sparks
    .map((p) => ({ ...p, y: p.y - 40 * dt, life: p.life - dt * 1.5 }))
    .filter((p) => p.life > 0);

  updateHud();
  draw();
  if (state.over) return finish();
  requestAnimationFrame(frame);
}

function start() {
  state = createState(canvas.width, canvas.height);
  random = makeRandom(Date.now());
  sparks = [];
  $('start').hidden = true;
  $('end').hidden = true;
  $('shareMsg').textContent = '';
  lastTime = performance.now();
  requestAnimationFrame(frame);
}

function finish() {
  const best = readBest();
  const isBest = state.score > best;
  if (isBest) saveBest(state.score);
  $('final').textContent = state.score;
  $('rank').textContent = `칭호: ${rankFor(state.score)}`;
  $('newBest').hidden = !isBest;
  $('best').textContent = Math.max(best, state.score);
  $('end').hidden = false;
  $('again').focus();
}

async function share() {
  const text = shareText(state.score, SHARE_URL);
  try {
    if (navigator.share) {
      await navigator.share({ title: '별똥별 받기', text, url: SHARE_URL });
      return;
    }
    await navigator.clipboard.writeText(text);
    $('shareMsg').textContent = '자랑 문구를 복사했어요. 메신저에 붙여 넣으세요.';
  } catch (err) {
    if (err && err.name === 'AbortError') return;
    $('shareMsg').textContent = `복사하지 못했어요. 이 문구를 직접 보내세요: ${text}`;
  }
}

$('play').addEventListener('click', start);
$('again').addEventListener('click', start);
$('share').addEventListener('click', share);
$('best').textContent = readBest();
ctx.font = 'bold 18px system-ui, sans-serif';
ctx.textAlign = 'center';
draw();
