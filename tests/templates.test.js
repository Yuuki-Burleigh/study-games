import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { rng, jdouble, idiv, imod, jstr, choices, instantiate } from '../gen-kit.js';
import { validateDeck, checkAnswer, TYPES } from '../game.js';

const readJSON = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));

test('gen-kit Java helpers', () => {
  assert.equal(jdouble(2), '2.0');
  assert.equal(jdouble(85), '85.0');
  assert.equal(jdouble(2.5), '2.5');
  assert.equal(jdouble(19.99 * 2), '39.98');
  assert.throws(() => jdouble(1e7), /safe range/);
  assert.equal(idiv(7, 2), 3);
  assert.equal(idiv(-7, 2), -3, 'truncates toward zero like Java');
  assert.equal(imod(-7, 2), -1, 'sign follows the dividend like Java');
  assert.equal(jstr('a"b\\c'), '"a\\"b\\\\c"');
  const r = rng(1);
  const c = choices(r, 'x', ['y', 'x', 'y', 'z'], ['w', 'v']);
  assert.equal(c.length, 4);
  assert.equal(new Set(c).size, 4);
  assert.ok(c.includes('x'));
});

test('rng is deterministic per seed', () => {
  const a = rng(42), b = rng(42), c = rng(43);
  const seqA = Array.from({ length: 5 }, () => a.int(0, 1e6));
  assert.deepEqual(seqA, Array.from({ length: 5 }, () => b.int(0, 1e6)));
  assert.notDeepEqual(seqA, Array.from({ length: 5 }, () => c.int(0, 1e6)));
});

for (const entry of readJSON('../decks/index.json').decks) {
  const deck = readJSON('../' + entry.file);
  if (!deck.generators) continue;
  const templates = (await import('../' + deck.generators)).default;

  test(`${deck.id}: templates are well-formed`, () => {
    assert.ok(templates.length >= 20, 'at least 20 templates');
    const ids = templates.map((t) => t.id);
    assert.equal(new Set(ids).size, ids.length, 'unique template ids');
    for (const t of templates) {
      assert.match(t.id, /^g-/, t.id);
      assert.equal(typeof t.make, 'function', t.id);
      assert.ok(TYPES.includes(t.type), t.id);
    }
    // A deck lists its answer formats (Java decks default to all four code formats).
    for (const type of deck.formats || ['mc', 'output', 'trace', 'bug']) assert.ok(templates.some((t) => t.type === type), 'has ' + type);
  });

  test(`${deck.id}: 300 random instances of every template are valid`, () => {
    for (const t of templates) {
      const seen = new Set();
      for (let seed = 1; seed <= 300; seed++) {
        const q = instantiate(t, seed);
        const errors = validateDeck({ id: 'x', title: 'x', cards: [], questions: [q] });
        assert.deepEqual(errors, [], `${q.id}: ${errors.join('; ')}`);
        const text = JSON.stringify(q);
        assert.doesNotMatch(text, /undefined|NaN|\[object/, `${q.id} has a broken value`);
        if (q.type === 'output') assert.ok(!q.answer.includes('\t'), `${q.id}: no tabs in typed output`);
        if (q.type === 'mc') assert.ok(q.choices.length >= 3, `${q.id}: at least 3 choices`);
        if (q.type === 'num') assert.ok(checkAnswer(q, String(q.answer)), `${q.id}: its own answer must be accepted`);
        assert.equal(JSON.stringify(instantiate(t, seed)), text, `${q.id} is not deterministic`);
        seen.add(q.code || q.prompt + (q.choices || []).join());
      }
      assert.ok(seen.size >= 100, `${t.id}: only ${seen.size} distinct problems in 300 seeds`);
    }
  });
}
