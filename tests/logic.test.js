import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createState, step, makeRandom, moveBasket, isCaught, rankFor, shareText,
  spawnInterval, pickType, GAME_SECONDS, START_LIVES,
} from '../logic.js';

test('basket stays inside the screen', () => {
  const s = createState(400, 600);
  assert.equal(moveBasket(s.basket, -100, 400).x, 45);
  assert.equal(moveBasket(s.basket, 9999, 400).x, 355);
});

test('catching a star adds one point', () => {
  const s = createState(400, 600);
  const star = { type: 'star', x: 200, y: 555 };
  const { state, events } = step({ ...s, items: [star] }, 0.01, 200, makeRandom(1));
  assert.equal(state.score, 1);
  assert.equal(events[0].kind, 'catch');
});

test('catching a rock costs a life', () => {
  const s = createState(400, 600);
  const rock = { type: 'rock', x: 200, y: 555 };
  const { state } = step({ ...s, items: [rock] }, 0.01, 200, makeRandom(1));
  assert.equal(state.lives, START_LIVES - 1);
  assert.equal(state.score, 0);
});

test('missed items fall off the bottom and disappear', () => {
  const s = createState(400, 600);
  const star = { type: 'star', x: 20, y: 650 };
  const { state } = step({ ...s, items: [star] }, 0.01, 380, makeRandom(1));
  assert.equal(state.items.length, 0);
  assert.equal(state.score, 0);
});

test('item far from the basket is not caught', () => {
  const s = createState(400, 600);
  assert.equal(isCaught({ type: 'star', x: 20, y: 560 }, s.basket, 600), false);
});

test('game ends after the time limit', () => {
  let s = createState(400, 600);
  const random = makeRandom(7);
  for (let i = 0; i < GAME_SECONDS * 10 + 5 && !s.over; i++) {
    s = step(s, 0.1, 200, random).state;
  }
  assert.equal(s.over, true);
  assert.ok(s.elapsed <= GAME_SECONDS);
});

test('game ends when lives run out', () => {
  const s = { ...createState(400, 600), lives: 1 };
  const rock = { type: 'rock', x: 200, y: 555 };
  const { state, events } = step({ ...s, items: [rock] }, 0.01, 200, makeRandom(1));
  assert.equal(state.over, true);
  assert.ok(events.some((e) => e.kind === 'over'));
});

test('the same seed replays the same game', () => {
  const run = () => {
    let s = createState(400, 600);
    const random = makeRandom(42);
    for (let i = 0; i < 300; i++) s = step(s, 1 / 30, 200, random).state;
    return s.score;
  };
  assert.equal(run(), run());
});

test('spawning speeds up but never below the floor', () => {
  assert.ok(spawnInterval(30) < spawnInterval(0));
  assert.equal(spawnInterval(1000), 0.25);
});

test('item type mix', () => {
  assert.equal(pickType(0.01), 'gold');
  assert.equal(pickType(0.2), 'rock');
  assert.equal(pickType(0.9), 'star');
});

test('rank names and share text', () => {
  assert.equal(rankFor(0), '첫 소원');
  assert.equal(rankFor(130), '별똥별 마스터');
  assert.match(shareText(42, 'https://x.example'), /42점.*https:\/\/x\.example/);
});
