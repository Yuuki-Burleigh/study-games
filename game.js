// Pure game logic, shared by the browser (app.js) and the tests.

export const TYPES = ['mc', 'output', 'trace', 'bug', 'num'];

// A typed number: "-12.5", "1,200", "3.0e8", "3.0 x 10^8", "3×10^-2", "$450", or with units after it ("18.3 s").
// Returns null when it isn't a number.
export function parseNumber(text) {
  let s = String(text ?? '').trim().replace(/[\u2212\u2013]/g, '-').replace(/^\$/, '').replace(/(\d)[, ](?=\d{3}\b)/g, '$1');
  if (/\d\s+\d/.test(s)) return null;
  s = s.replace(/\s+/g, '');
  const m = s.match(/^([+-]?(?:\d+\.?\d*|\.\d+))(?:[eE]([+-]?\d+)|[x×*·]10\^?([+-]?\d+))?(.*)$/);
  if (!m || (m[4] && !/^[a-zA-Z°%$/]/.test(m[4]))) return null;
  const exp = m[2] ?? m[3];
  return Number(m[1]) * (exp ? 10 ** Number(exp) : 1);
}

// num questions: right if within tol (relative, default 2%) OR abs (absolute) of the answer. tol: 0 means exact.
export function closeEnough(question, value) {
  if (value == null || !Number.isFinite(value)) return false;
  const want = question.answer;
  const tol = question.tol ?? 0.02;
  const slack = Math.max(Math.abs(want) * tol, question.abs ?? 0);
  return Math.abs(value - want) <= slack + 1e-9 * Math.max(1, Math.abs(want));
}

export function shuffle(items) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Typed output: exact, except trailing spaces at line ends and trailing newlines (both invisible on screen).
export function normalizeOutput(text) {
  return String(text).replace(/\r\n?/g, '\n').split('\n').map((l) => l.replace(/[ ]+$/, '')).join('\n').replace(/\n+$/, '');
}

export function checkAnswer(question, response) {
  switch (question.type || 'mc') {
    case 'output': return normalizeOutput(response) === normalizeOutput(question.answer);
    case 'trace': return [question.answer, ...(question.accept || [])].includes(String(response).trim());
    case 'bug': return Number(response) === question.answer;
    case 'num': return closeEnough(question, parseNumber(response));
    default: return response === question.answer;
  }
}

// XP per correct answer: typing or finding beats picking.
export function xpFor(question) {
  return (question.type || 'mc') === 'mc' ? 10 : 15;
}

// n questions spread across types: round-robin over shuffled per-type piles, then shuffled.
export function pickMixed(questions, n) {
  const piles = new Map();
  for (const q of shuffle(questions)) {
    const t = q.type || 'mc';
    if (!piles.has(t)) piles.set(t, []);
    piles.get(t).push(q);
  }
  const out = [];
  const lists = shuffle([...piles.values()]);
  while (out.length < n && lists.some((l) => l.length)) {
    for (const l of lists) if (l.length && out.length < n) out.push(l.shift());
  }
  return shuffle(out);
}

// ---- weak-spot weighting ----
// Per-template stats decay by 10% each answer, so recent results count more than old ones.
export function recordResult(stats, templateId, ok) {
  const s = stats[templateId] || { seen: 0, miss: 0 };
  return { ...stats, [templateId]: { seen: s.seen * 0.9 + 1, miss: s.miss * 0.9 + (ok ? 0 : 1) } };
}

// Smoothed miss rate: 0.5 with no data, toward 1 for templates you keep missing, toward 0 for ones you've mastered.
export function missRate(stat) {
  return ((stat?.miss || 0) + 1) / ((stat?.seen || 0) + 2);
}

// Each format gets an equal share up front (1 / templates of that type); within that, weaker templates weigh more.
// The 0.2 floor keeps mastered templates coming back occasionally.
export function templateWeights(templates, stats = {}) {
  const perType = {};
  for (const t of templates) perType[t.type] = (perType[t.type] || 0) + 1;
  return templates.map((t) => (0.2 + missRate(stats[t.id])) / perType[t.type]);
}

export function weightedIndex(weights, rand = Math.random) {
  let x = rand() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < weights.length; i++) if ((x -= weights[i]) < 0) return i;
  return weights.length - 1;
}

// Topics you're weakest on (need a few answers before judging), worst first.
export function weakTopics(templates, stats = {}, minSeen = 2) {
  const by = {};
  for (const t of templates) {
    const s = stats[t.id];
    if (!s || s.seen < minSeen) continue;
    (by[t.topic] ||= []).push(missRate(s));
  }
  return Object.entries(by)
    .map(([topic, rates]) => ({ topic, rate: rates.reduce((a, b) => a + b, 0) / rates.length }))
    .filter((x) => x.rate > 0.4)
    .sort((a, b) => b.rate - a.rate);
}

// n random cards; terms and definitions shuffled independently.
export function buildMatchRound(cards, n = 6) {
  const picked = shuffle(cards).slice(0, n);
  return { terms: shuffle(picked), definitions: shuffle(picked) };
}

// Daily streak: same day keeps it, the next day extends it, a gap resets it to 1.
export function nextStreak(streak, today) {
  if (!streak || !streak.last) return { last: today, days: 1 };
  if (streak.last === today) return streak;
  const gap = Math.round((Date.parse(today) - Date.parse(streak.last)) / 86400000);
  return { last: today, days: gap === 1 ? streak.days + 1 : 1 };
}

// Returns a list of human-readable problems; empty means valid.
export function validateDeck(deck) {
  const errors = [];
  if (!deck || typeof deck !== 'object') return ['deck is not an object'];
  for (const key of ['id', 'title']) {
    if (typeof deck[key] !== 'string' || !deck[key]) errors.push(`missing ${key}`);
  }
  if (!Array.isArray(deck.cards)) errors.push('cards must be an array');
  if (!Array.isArray(deck.questions)) errors.push('questions must be an array');

  const seen = new Set();
  const uniqueId = (id, where) => {
    if (typeof id !== 'string' || !id) errors.push(`${where}: missing id`);
    else if (seen.has(id)) errors.push(`${where}: duplicate id "${id}"`);
    else seen.add(id);
  };

  (deck.cards || []).forEach((c, i) => {
    uniqueId(c.id, `card ${i}`);
    if (!c.term || !c.definition) errors.push(`card ${c.id || i}: needs term and definition`);
  });

  (deck.formulas || []).forEach((f, i) => {
    if (!f.name || !f.formula) errors.push(`formula ${i}: needs name and formula`);
    if (deck.units && !deck.units.includes(f.unit)) errors.push(`formula ${f.name || i}: unknown unit "${f.unit}"`);
  });

  (deck.questions || []).forEach((q, i) => {
    const where = `question ${q.id || i}`;
    const type = q.type || 'mc';
    uniqueId(q.id, `question ${i}`);
    if (!TYPES.includes(type)) { errors.push(`${where}: unknown type "${type}"`); return; }
    if (!q.prompt) errors.push(`${where}: missing prompt`);
    if (!q.explanation) errors.push(`${where}: missing explanation`);
    if (!['mc', 'num'].includes(type) && !q.code) errors.push(`${where}: ${type} needs code`);
    if (type === 'trace' && !q.var) errors.push(`${where}: trace needs var (the variable asked about)`);
    if (type === 'mc') {
      if (!Array.isArray(q.choices) || q.choices.length < 2) { errors.push(`${where}: needs at least 2 choices`); return; }
      if (new Set(q.choices).size !== q.choices.length) errors.push(`${where}: duplicate choices`);
      if (!q.choices.includes(q.answer)) errors.push(`${where}: answer is not one of the choices`);
    } else if (type === 'bug') {
      const lines = String(q.code || '').split('\n').length;
      if (!Number.isInteger(q.answer) || q.answer < 1 || q.answer > lines) errors.push(`${where}: answer must be a line number 1-${lines}`);
    } else if (type === 'num') {
      if (typeof q.answer !== 'number' || !Number.isFinite(q.answer)) errors.push(`${where}: num answer must be a finite number`);
      for (const k of ['tol', 'abs']) if (q[k] != null && !(typeof q[k] === 'number' && q[k] >= 0)) errors.push(`${where}: ${k} must be a number >= 0`);
    } else if (typeof q.answer !== 'string' || q.answer === '') {
      errors.push(`${where}: answer must be a non-empty string`);
    }
  });

  return errors;
}
