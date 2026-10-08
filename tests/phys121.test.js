// Physics 121: answers aren't Java, so the helpers every template uses are pinned to worked values here, and the
// hand-written problems are re-derived by tools/check_physics.py.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { sigFigs, toSci, sciExp, compassToPolar, polarToCompass, addVectors, components, sig4 } from '../generators/phys121/kit.js';

const deck = JSON.parse(readFileSync(new URL('../decks/phys121.json', import.meta.url), 'utf8'));

test('sig figs and scientific notation follow the class rules', () => {
  const cases = { '0.05': [1, '5 × 10⁻²'], '0.0500': [3, '5.00 × 10⁻²'], '0.140': [3, '1.40 × 10⁻¹'], '190': [2, '1.9 × 10²'],
    '140.': [3, '1.40 × 10²'], '141': [3, '1.41 × 10²'], '1005': [4, '1.005 × 10³'], '50000': [1, '5 × 10⁴'], '7020.': [4, '7.020 × 10³'],
    '12.300': [5, '1.2300 × 10¹'], '3.8': [2, '3.8 × 10⁰'], '0.000607': [3, '6.07 × 10⁻⁴'], '2500.0': [5, '2.5000 × 10³'] };
  for (const [n, [sf, sci]] of Object.entries(cases)) {
    assert.equal(sigFigs(n), sf, `sig figs of ${n}`);
    assert.equal(toSci(n), sci, `sci of ${n}`);
  }
  assert.equal(sciExp('0.0046'), -3);
});

test('compass directions and vector sums', () => {
  assert.equal(compassToPolar(25, 'N', 'W'), 155);
  assert.equal(compassToPolar(25, 'S', 'W'), 205);
  assert.equal(compassToPolar(30, 'E', 'N'), 60);
  assert.equal(compassToPolar(30, 'W', 'S'), 240);
  assert.equal(compassToPolar(10, 'S', 'E'), 350);
  assert.equal(polarToCompass(155), '25° North of West');
  assert.equal(polarToCompass(300), '60° South of East');
  const [x, y] = components(10, 30);
  assert.ok(Math.abs(x - 8.660) < 1e-3 && Math.abs(y - 5) < 1e-9);
  const R = addVectors([{ mag: 12, polar: 90 }, { mag: 5, polar: 180 }]);
  assert.ok(Math.abs(R.mag - 13) < 1e-9);
  assert.equal(sig4(R.polar), 112.6);
  assert.ok(Math.abs(addVectors([{ mag: 3, polar: 0 }, { mag: 3, polar: 180 }]).mag) < 1e-9);
});

test('Physics 121 deck: units, mix and scope', async () => {
  assert.deepEqual(deck.units, ['Measurement & Units', '1D Motion', 'Vectors']);
  const count = (t) => deck.questions.filter((q) => q.type === t).length;
  assert.ok(deck.questions.length >= 40 && count('mc') >= 15 && count('num') >= 15, 'type mix');
  assert.ok(deck.cards.length >= 20);
  for (const x of [...deck.cards, ...deck.questions]) assert.ok(deck.units.includes(x.unit), `${x.id}: unit "${x.unit}"`);
  const templates = (await import('../' + deck.generators)).default;
  assert.ok(templates.length >= 25);
  for (const u of deck.units) assert.ok(templates.some((t) => t.unit === u), `templates for ${u}`);
  for (const t of templates) assert.match(t.id, /^g-p-/, 'physics template ids are prefixed so they never clash');
  // Quiz 1 is scope, not a question bank: its own numbers stay out.
  const quiz = ['-50 m/s', '-70 m/s', '$2000', '$5000', '0.0500', '140.'];
  for (const q of deck.questions) for (const s of quiz) assert.ok(!q.prompt.includes(s), `${q.id} reuses the quiz's "${s}"`);
  // Nothing from "Not taught yet".
  for (const q of deck.questions) assert.doesNotMatch(q.prompt, /9\.8|projectile|gravity|newton|force|î|ĵ/i, q.id);
});
