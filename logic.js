// Pure game rules for "별똥별 받기" (Star Catcher).
// No DOM access here, so the rules can be tested with `node --test`.

export const GAME_SECONDS = 60;
export const START_LIVES = 3;

export const ITEM_TYPES = {
  star: { points: 1, radius: 14 },
  gold: { points: 5, radius: 16 },
  rock: { points: 0, radius: 18 },
};

// Small deterministic random generator so tests can repeat a game exactly.
export function makeRandom(seed) {
  let a = seed >>> 0;
  return function random() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createState(width, height) {
  return {
    width,
    height,
    basket: { x: width / 2, width: 90, height: 18 },
    items: [],
    score: 0,
    lives: START_LIVES,
    elapsed: 0,
    sinceSpawn: 0,
    over: false,
  };
}

// Items fall faster and appear more often as time passes.
export function fallSpeed(elapsed) {
  return 160 + elapsed * 6;
}

export function spawnInterval(elapsed) {
  return Math.max(0.25, 0.9 - elapsed * 0.012);
}

export function pickType(roll) {
  if (roll < 0.08) return 'gold';
  if (roll < 0.3) return 'rock';
  return 'star';
}

export function moveBasket(basket, targetX, width) {
  const half = basket.width / 2;
  const x = Math.min(width - half, Math.max(half, targetX));
  return { ...basket, x };
}

export function isCaught(item, basket, height) {
  const top = height - 40;
  const r = ITEM_TYPES[item.type].radius;
  const withinX = Math.abs(item.x - basket.x) <= basket.width / 2 + r * 0.5;
  const withinY = item.y + r >= top && item.y - r <= top + basket.height;
  return withinX && withinY;
}

// Advance the game by dt seconds. Returns a new state and the events that happened.
export function step(state, dt, targetX, random) {
  if (state.over) return { state, events: [] };

  const events = [];
  const elapsed = Math.min(GAME_SECONDS, state.elapsed + dt);
  const basket = moveBasket(state.basket, targetX, state.width);
  const speed = fallSpeed(elapsed);

  let sinceSpawn = state.sinceSpawn + dt;
  let spawned = [];
  if (sinceSpawn >= spawnInterval(elapsed)) {
    sinceSpawn = 0;
    const type = pickType(random());
    const r = ITEM_TYPES[type].radius;
    spawned = [{ type, x: r + random() * (state.width - r * 2), y: -r }];
  }

  let score = state.score;
  let lives = state.lives;
  const items = [];
  for (const item of [...state.items, ...spawned]) {
    const moved = { ...item, y: item.y + speed * dt };
    if (isCaught(moved, basket, state.height)) {
      if (moved.type === 'rock') {
        lives -= 1;
        events.push({ kind: 'hit', x: moved.x });
      } else {
        score += ITEM_TYPES[moved.type].points;
        events.push({ kind: 'catch', type: moved.type, x: moved.x });
      }
    } else if (moved.y - ITEM_TYPES[moved.type].radius < state.height) {
      items.push(moved);
    }
  }

  const over = lives <= 0 || elapsed >= GAME_SECONDS;
  if (over) events.push({ kind: 'over' });

  return {
    state: { ...state, basket, items, score, lives, elapsed, sinceSpawn, over },
    events,
  };
}

export function rankFor(score) {
  if (score >= 120) return '별똥별 마스터';
  if (score >= 70) return '밤하늘 사냥꾼';
  if (score >= 30) return '별 줍는 사람';
  return '첫 소원';
}

export function shareText(score, url) {
  return `별똥별 받기에서 ${score}점! (${rankFor(score)}) 내 기록 깰 수 있어? ${url}`;
}
