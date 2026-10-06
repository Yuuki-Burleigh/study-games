// Pure game logic, shared by the browser (app.js) and the tests.

export const TYPES = ['mc', 'output', 'trace', 'bug'];

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

  (deck.questions || []).forEach((q, i) => {
    const where = `question ${q.id || i}`;
    const type = q.type || 'mc';
    uniqueId(q.id, `question ${i}`);
    if (!TYPES.includes(type)) { errors.push(`${where}: unknown type "${type}"`); return; }
    if (!q.prompt) errors.push(`${where}: missing prompt`);
    if (!q.explanation) errors.push(`${where}: missing explanation`);
    if (type !== 'mc' && !q.code) errors.push(`${where}: ${type} needs code`);
    if (type === 'trace' && !q.var) errors.push(`${where}: trace needs var (the variable asked about)`);
    if (type === 'mc') {
      if (!Array.isArray(q.choices) || q.choices.length < 2) { errors.push(`${where}: needs at least 2 choices`); return; }
      if (new Set(q.choices).size !== q.choices.length) errors.push(`${where}: duplicate choices`);
      if (!q.choices.includes(q.answer)) errors.push(`${where}: answer is not one of the choices`);
    } else if (type === 'bug') {
      const lines = String(q.code || '').split('\n').length;
      if (!Number.isInteger(q.answer) || q.answer < 1 || q.answer > lines) errors.push(`${where}: answer must be a line number 1-${lines}`);
    } else if (typeof q.answer !== 'string' || q.answer === '') {
      errors.push(`${where}: answer must be a non-empty string`);
    }
  });

  return errors;
}
