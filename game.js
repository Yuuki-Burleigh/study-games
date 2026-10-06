// Pure game logic, shared by the browser (app.js) and the tests.

export function shuffle(items) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function checkAnswer(question, choice) {
  return choice === question.answer;
}

// n random cards; terms and definitions shuffled independently.
export function buildMatchRound(cards, n = 6) {
  const picked = shuffle(cards).slice(0, n);
  return { terms: shuffle(picked), definitions: shuffle(picked) };
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
    uniqueId(q.id, `question ${i}`);
    if (!q.prompt) errors.push(`${where}: missing prompt`);
    if (!q.explanation) errors.push(`${where}: missing explanation`);
    if (!Array.isArray(q.choices) || q.choices.length < 2) {
      errors.push(`${where}: needs at least 2 choices`);
      return;
    }
    if (new Set(q.choices).size !== q.choices.length) errors.push(`${where}: duplicate choices`);
    if (!q.choices.includes(q.answer)) errors.push(`${where}: answer is not one of the choices`);
  });

  return errors;
}
