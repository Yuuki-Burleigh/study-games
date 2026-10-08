import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const game = await import('../game.js').catch(() => ({}));
const readJSON = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));

test('game.js exports the engine', () => {
  for (const f of ['shuffle', 'checkAnswer', 'buildMatchRound', 'validateDeck', 'normalizeOutput', 'xpFor', 'nextStreak', 'recordResult', 'missRate', 'templateWeights', 'weightedIndex', 'weakTopics']) {
    assert.equal(typeof game[f], 'function', f);
  }
  const src = [1, 2, 3, 4, 5, 6, 7, 8];
  const out = game.shuffle(src);
  assert.deepEqual(src, [1, 2, 3, 4, 5, 6, 7, 8], 'input not mutated');
  assert.deepEqual([...out].sort((a, b) => a - b), src, 'permutation');
  const cards = Array.from({ length: 10 }, (_, i) => ({ id: 'c' + i, term: 't' + i, definition: 'd' + i }));
  const round = game.buildMatchRound(cards, 6);
  assert.equal(round.terms.length, 6);
  assert.deepEqual(round.terms.map((c) => c.id).sort(), round.definitions.map((c) => c.id).sort());
});

test('checkAnswer handles every question type', () => {
  assert.equal(game.checkAnswer({ choices: ['a', 'b'], answer: 'b' }, 'b'), true);
  assert.equal(game.checkAnswer({ type: 'mc', choices: ['a', 'b'], answer: 'b' }, 'a'), false);
  const out = { type: 'output', answer: 'onetwo\nthree' };
  assert.equal(game.checkAnswer(out, 'onetwo\nthree\n'), true, 'trailing newline ignored');
  assert.equal(game.checkAnswer(out, 'onetwo  \r\nthree'), true, 'trailing spaces and CRLF ignored');
  assert.equal(game.checkAnswer(out, 'one two\nthree'), false, 'inner spacing matters');
  assert.equal(game.checkAnswer(out, 'onetwothree'), false, 'line breaks matter');
  const tr = { type: 'trace', answer: '85.0' };
  assert.equal(game.checkAnswer(tr, ' 85.0 '), true);
  assert.equal(game.checkAnswer(tr, '85'), false, 'the int-division trap is wrong');
  assert.equal(game.checkAnswer({ type: 'bug', answer: 3 }, '3'), true);
  assert.equal(game.checkAnswer({ type: 'bug', answer: 3 }, 2), false);
  assert.equal(game.xpFor({ type: 'mc' }), 10);
  assert.equal(game.xpFor({ type: 'bug' }), 15);
});

test('pickMixed spreads questions across types', () => {
  const qs = ['mc', 'output', 'trace', 'bug'].flatMap((t) => Array.from({ length: 10 }, (_, i) => ({ id: t + i, type: t })));
  const picked = game.pickMixed(qs, 10);
  assert.equal(picked.length, 10);
  assert.equal(new Set(picked.map((q) => q.id)).size, 10, 'no repeats');
  for (const t of ['mc', 'output', 'trace', 'bug']) {
    const n = picked.filter((q) => q.type === t).length;
    assert.ok(n >= 2 && n <= 3, `${t}: ${n}`);
  }
  assert.equal(game.pickMixed(qs.slice(0, 3), 10).length, 3, 'small pool');
});

test('weak-spot weighting', () => {
  const ts = [
    { id: 'a', type: 'mc', topic: 'X' }, { id: 'b', type: 'mc', topic: 'Y' },
    { id: 'c', type: 'bug', topic: 'X' },
  ];
  const even = game.templateWeights(ts, {});
  // No history: each FORMAT gets an equal share (mc's two templates split it; bug's one template gets it all).
  assert.ok(Math.abs(even[0] + even[1] - even[2]) < 1e-9);
  let stats = {};
  for (let k = 0; k < 6; k++) stats = game.recordResult(stats, 'a', false);
  for (let k = 0; k < 6; k++) stats = game.recordResult(stats, 'b', true);
  const w = game.templateWeights(ts, stats);
  assert.ok(w[0] > 3 * w[1], 'a template you keep missing outweighs a mastered one');
  assert.ok(w[1] > 0, 'mastered templates never disappear');
  assert.ok(game.missRate(stats.a) > 0.8 && game.missRate(stats.b) < 0.2);
  // Recency: a run of right answers after misses brings the rate back down.
  let s2 = stats;
  for (let k = 0; k < 10; k++) s2 = game.recordResult(s2, 'a', true);
  assert.ok(game.missRate(s2.a) < 0.4, 'recent results dominate');
  assert.equal(game.weightedIndex([1, 0, 0], () => 0.99), 0);
  assert.equal(game.weightedIndex([1, 1], () => 0.75), 1);
  assert.deepEqual(game.weakTopics(ts, stats).map((x) => x.topic), ['X']);
});

test('daily streak', () => {
  assert.deepEqual(game.nextStreak(null, '2026-10-05'), { last: '2026-10-05', days: 1 });
  assert.deepEqual(game.nextStreak({ last: '2026-10-05', days: 3 }, '2026-10-05'), { last: '2026-10-05', days: 3 });
  assert.deepEqual(game.nextStreak({ last: '2026-10-04', days: 3 }, '2026-10-05'), { last: '2026-10-05', days: 4 });
  assert.deepEqual(game.nextStreak({ last: '2026-10-01', days: 3 }, '2026-10-05'), { last: '2026-10-05', days: 1 });
});

test('num answers: typed numbers, tolerance, exact counts', () => {
  for (const [text, want] of [['-12.5', -12.5], ['1,200', 1200], ['3.0e8', 3e8], ['3.0 x 10^8', 3e8], ['3×10^-2', 0.03], ['$450', 450], ['18.3 s', 18.3], ['−875 m', -875], ['.5', 0.5]]) {
    assert.equal(game.parseNumber(text), want, text);
  }
  for (const bad of ['', 'abc', '2.5.3', '10^3', '5 5']) assert.equal(game.parseNumber(bad), null, bad);
  const q = { type: 'num', answer: -875 };
  assert.ok(game.checkAnswer(q, '-870'), 'within 2%');
  assert.ok(!game.checkAnswer(q, '875'), 'the sign is part of the answer');
  assert.ok(!game.checkAnswer(q, '-800'));
  assert.ok(game.checkAnswer({ type: 'num', answer: 3, tol: 0 }, '3'));
  assert.ok(!game.checkAnswer({ type: 'num', answer: 3, tol: 0 }, '3.01'), 'tol 0 is exact');
  assert.ok(game.checkAnswer({ type: 'num', answer: 112.6, abs: 1 }, '113'), 'abs widens it');
  assert.ok(!game.checkAnswer({ type: 'num', answer: 1 }, 'nope'));
  assert.deepEqual(game.validateDeck({ id: 'x', title: 'X', cards: [], questions: [{ id: 'n', type: 'num', prompt: 'p', answer: '5', explanation: 'e' }] }),
    ['question n: num answer must be a finite number']);
});

test('validateDeck rejects broken decks', () => {
  const bad = { id: 'x', title: 'X', cards: [{ id: 'a', term: 't', definition: 'd' }, { id: 'a', term: 't', definition: 'd' }],
    questions: [
      { id: 'q', prompt: 'p', choices: ['1', '1'], answer: '2', explanation: 'e' },
      { id: 'b', type: 'bug', prompt: 'p', code: 'one\ntwo', answer: 5, explanation: 'e' },
      { id: 'o', type: 'output', prompt: 'p', answer: 'x', explanation: 'e' },
      { id: 'z', type: 'essay', prompt: 'p', explanation: 'e' },
    ] };
  const errors = game.validateDeck(bad);
  for (const needle of ['duplicate id', 'duplicate choices', 'not one of the choices', 'line number', 'needs code', 'unknown type']) {
    assert.ok(errors.some((e) => e.includes(needle)), needle);
  }
});

test('every listed deck is valid', () => {
  const index = readJSON('../decks/index.json');
  assert.ok(index.decks.length >= 1);
  for (const d of index.decks) {
    const deck = readJSON('../' + d.file);
    assert.deepEqual(game.validateDeck(deck), [], d.file);
    assert.equal(deck.id, d.id);
  }
});

test('CS 209 deck: original problems in every format', () => {
  const deck = readJSON('../decks/cs209.json');
  assert.ok(deck.cards.length >= 20, 'cards');
  const count = (t) => deck.questions.filter((q) => (q.type || 'mc') === t).length;
  assert.ok(count('mc') >= 12 && count('output') >= 8 && count('trace') >= 6 && count('bug') >= 6, 'type mix');
  // The notes are scope, not a question bank: none of the class's own worked examples may be reused.
  const fromNotes = ['"hi" + 1 + 2', '"Cost: $" + 5 + 2', '"Count is: " + count + 1', "'A' + 10", '"10" + "20"', '15 % 2'];
  for (const ex of fromNotes) assert.ok(!deck.questions.some((q) => (q.code || '').includes(ex)), 'copied from notes: ' + ex);
});

test('one deck per class: every item and template belongs to a declared unit', async () => {
  const index = readJSON('../decks/index.json');
  assert.equal(new Set(index.decks.map((d) => d.id.replace(/-.*/, ''))).size, index.decks.length, 'one deck per course');
  const deck = readJSON('../decks/cs209.json');
  assert.deepEqual(deck.units, ['Java Basics', 'For Loops', 'Nested Loops']);
  for (const x of [...deck.cards, ...deck.questions]) assert.ok(deck.units.includes(x.unit), `${x.id}: unit "${x.unit}"`);
  const templates = (await import('../' + deck.generators)).default;
  for (const t of templates) assert.ok(deck.units.includes(t.unit), `${t.id}: unit "${t.unit}"`);
  for (const u of deck.units) assert.ok(templates.some((t) => t.unit === u), `templates for ${u}`);
});

test('CS 209 facts are correct Java', () => {
  const deck = readJSON('../decks/cs209.json');
  const byId = Object.fromEntries(deck.questions.map((q) => [q.id, q]));
  assert.equal(byId['m-3345'].answer, '3345');
  assert.equal(byId['t-avg'].answer, '85.0');
  assert.equal(byId['b-zero'].answer, 4);
  assert.equal(byId['o-onetwo'].answer, 'onetwo\nthree');
});

test('index.html uses relative paths only', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.doesNotMatch(html, /(src|href)="\//);
});
