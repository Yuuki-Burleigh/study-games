import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const game = await import('../game.js').catch(() => ({}));
const readJSON = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));

test('game.js exports the engine', () => {
  for (const f of ['shuffle', 'checkAnswer', 'buildMatchRound', 'validateDeck']) {
    assert.equal(typeof game[f], 'function', f);
  }
  const src = [1, 2, 3, 4, 5, 6, 7, 8];
  const out = game.shuffle(src);
  assert.deepEqual(src, [1, 2, 3, 4, 5, 6, 7, 8], 'input not mutated');
  assert.deepEqual([...out].sort((a, b) => a - b), src, 'permutation');
  const q = { choices: ['a', 'b'], answer: 'b' };
  assert.equal(game.checkAnswer(q, 'b'), true);
  assert.equal(game.checkAnswer(q, 'a'), false);
  const cards = Array.from({ length: 10 }, (_, i) => ({ id: 'c' + i, term: 't' + i, definition: 'd' + i }));
  const round = game.buildMatchRound(cards, 6);
  assert.equal(round.terms.length, 6);
  assert.deepEqual(round.terms.map((c) => c.id).sort(), round.definitions.map((c) => c.id).sort());
});

test('validateDeck rejects a broken deck', () => {
  const bad = { id: 'x', title: 'X', cards: [{ id: 'a', term: 't', definition: 'd' }, { id: 'a', term: 't', definition: 'd' }],
    questions: [{ id: 'q', prompt: 'p', choices: ['1', '1'], answer: '2', explanation: 'e' }] };
  assert.ok(game.validateDeck(bad).length >= 3);
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

test('CS 209 deck coverage', () => {
  const deck = readJSON('../decks/cs209-java-basics.json');
  assert.ok(deck.cards.length >= 20, 'cards');
  assert.ok(deck.questions.length >= 25, 'questions');
  const text = JSON.stringify(deck).toLowerCase();
  for (const topic of ['concatenat', 'escape', 'integer division', 'double', 'boolean', 'compile', 'runtime', 'jvm', 'modulus']) {
    assert.ok(text.includes(topic), topic);
  }
});

test('CS 209 facts are correct Java', () => {
  const deck = readJSON('../decks/cs209-java-basics.json');
  const find = (needle) => {
    const q = deck.questions.find((x) => (x.prompt + (x.code || '')).includes(needle));
    assert.ok(q, 'question containing ' + needle);
    return q.answer;
  };
  assert.equal(find("'A' + 10"), '75');
  assert.equal(find('println(5 / 2)'), '2');
  assert.equal(find('"Cost: $" + 5 + 2'), 'Cost: $52');
});

test('index.html uses relative paths only', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.doesNotMatch(html, /(src|href)="\//);
});
