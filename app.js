import { instantiate, newSeed } from './gen-kit.js';
import { shuffle, pickMixed, checkAnswer, recordResult, templateWeights, weightedIndex, weakTopics, buildMatchRound, validateDeck, xpFor, nextStreak, normalizeOutput } from './game.js';

const app = document.getElementById('app');
const QUIZ_LENGTH = 10;
const MATCH_PAIRS = 6;
const XP_PER_LEVEL = 100;
let cleanup = () => {};

// ---------- tiny helpers ----------
function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) node.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) {
    if (c != null && c !== false) node.append(c instanceof Node ? c : String(c));
  }
  return node;
}

function render(...nodes) {
  cleanup();
  cleanup = () => {};
  app.replaceChildren(...nodes.filter((n) => n != null && n !== false));
  app.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

function onKey(handler) {
  const fn = (e) => { if (!e.altKey && !e.metaKey && !(e.ctrlKey && e.key !== 'Enter')) handler(e); };
  window.addEventListener('keydown', fn);
  const prev = cleanup;
  cleanup = () => { prev(); window.removeEventListener('keydown', fn); };
}

// localStorage can be missing or throw (private mode); progress is a convenience.
const store = {
  get(key, fallback) {
    try { return JSON.parse(localStorage.getItem('sg:' + key)) ?? fallback; } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem('sg:' + key, JSON.stringify(value)); } catch { /* not saved */ }
  },
};

// Java syntax colouring, built as DOM nodes (never innerHTML).
const TOKENS = /(\/\/.*$)|("(?:\\.|[^"\\\n])*"?)|('(?:\\.|[^'\\\n])*'?)|(\b\d+(?:\.\d+)?\b)|(\b(?:public|static|void|class|int|double|boolean|char|String|System|true|false|new|return)\b)/gm;
function highlight(code) {
  const frag = document.createDocumentFragment();
  let last = 0;
  for (const m of code.matchAll(TOKENS)) {
    if (m.index > last) frag.append(code.slice(last, m.index));
    const cls = m[1] ? 'tok-com' : m[2] || m[3] ? 'tok-str' : m[4] ? 'tok-num' : 'tok-kw';
    frag.append(el('span', { class: cls }, m[0]));
    last = m.index + m[0].length;
  }
  frag.append(code.slice(last));
  return frag;
}
const codeBlock = (code) => el('pre', { class: 'code' }, el('code', {}, highlight(code)));

// ---------- XP + streak (header) ----------
const today = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD, local time

function renderStats(bump = false) {
  const xp = store.get('xp', 0);
  let streak = store.get('streak', null);
  // A streak only counts if you studied today or yesterday.
  if (streak && nextStreak(streak, today()).days === 1 && streak.last !== today()) streak = { ...streak, days: 0 };
  const s = document.getElementById('streak');
  const x = document.getElementById('xp');
  s.querySelector('b').textContent = streak ? streak.days : 0;
  x.querySelector('.lv b').textContent = Math.floor(xp / XP_PER_LEVEL) + 1;
  x.querySelector('.xpnum b').textContent = xp;
  x.querySelector('.xpbar i').style.width = `${xp % XP_PER_LEVEL}%`;
  x.title = `${xp} XP · ${XP_PER_LEVEL - (xp % XP_PER_LEVEL)} to the next level`;
  if (bump) for (const n of [s, x]) { n.classList.remove('bump'); void n.offsetWidth; n.classList.add('bump'); }
}

function awardXP(n) {
  store.set('xp', store.get('xp', 0) + n);
  store.set('streak', nextStreak(store.get('streak', null), today()));
  renderStats(true);
}

function confetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const colors = ['#ff6b2c', '#35a63f', '#ffb020', '#2b2118', '#ff9a6b'];
  const box = el('div', { class: 'confetti', 'aria-hidden': 'true' },
    Array.from({ length: 60 }, (_, i) => el('i', { style: `left:${Math.random() * 100}%;background:${colors[i % colors.length]};animation-delay:${Math.random() * 0.5}s;animation-duration:${1.2 + Math.random()}s` })));
  document.body.append(box);
  setTimeout(() => box.remove(), 2600);
}

// ---------- data ----------
const cache = new Map();

async function loadIndex() {
  const res = await fetch('./decks/index.json', { cache: 'no-cache' });
  if (!res.ok) throw new Error('Could not load decks/index.json');
  const decks = (await res.json()).decks;
  migrateProgress(decks);
  return decks;
}

// Decks that were merged into one keep working: old links redirect, and saved progress folds into the new id.
function migrateProgress(decks) {
  for (const d of decks) for (const old of d.aliases || []) {
    const take = (k) => { const v = store.get(`${k}:${old}`, null); try { localStorage.removeItem(`sg:${k}:${old}`); } catch { /* ignore */ } return v; };
    const best = take('best'), match = take('match'), missed = take('missed'), stats = take('tstats');
    if (best != null) store.set(`best:${d.id}`, Math.max(best, store.get(`best:${d.id}`, -1)));
    if (match != null) store.set(`match:${d.id}`, Math.min(match, store.get(`match:${d.id}`, Infinity)));
    if (missed) store.set(`missed:${d.id}`, [...new Set([...store.get(`missed:${d.id}`, []), ...missed])]);
    if (stats) store.set(`tstats:${d.id}`, { ...stats, ...store.get(`tstats:${d.id}`, {}) });
  }
}

async function loadDeck(id) {
  if (cache.has(id)) return cache.get(id);
  const index = await loadIndex();
  const alias = index.find((d) => (d.aliases || []).includes(id));
  if (alias) { location.replace(location.hash.replace(`/deck/${id}`, `/deck/${alias.id}`)); return loadDeck(alias.id); }
  const entry = index.find((d) => d.id === id);
  if (!entry) throw new Error(`There's no deck called "${id}".`);
  const res = await fetch('./' + entry.file, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`Could not load ${entry.file}`);
  const deck = await res.json();
  const errors = validateDeck(deck);
  if (errors.length) throw new Error(`${entry.file} is invalid: ${errors.join('; ')}`);
  deck.templates = deck.generators ? (await import('./' + deck.generators)).default : [];
  cache.set(id, deck);
  return deck;
}

const typeOf = (q) => q.type || 'mc';
const topicsOf = (items) => [...new Set(items.map((x) => x.topic).filter(Boolean))];
// A scope narrows a class to one unit (lecture) and/or one topic; empty means the whole class.
const scopeOf = (params) => ({ unit: params.get('unit') || '', topic: params.get('topic') || '' });
const matches = (x, sc) => (!sc.unit || x.unit === sc.unit) && (!sc.topic || x.topic === sc.topic);
const inScope = (items, sc) => items.filter((x) => matches(x, sc));
const scopeQuery = (sc) => [sc.unit && `unit=${encodeURIComponent(sc.unit)}`, sc.topic && `topic=${encodeURIComponent(sc.topic)}`].filter(Boolean);
const scopeLabel = (sc) => [sc.unit, sc.topic].filter(Boolean).join(' · ');
const missedKey = (deck) => `missed:${deck.id}`;

// Generated problems: a random template (matching the filters) instantiated from a random seed.
// Their ids are "<template>#<seed>", so a missed one can be rebuilt exactly later.
const templatesFor = (deck, sc, types) => deck.templates.filter((t) => matches(t, sc) && (!types.length || types.includes(t.type)));
const statsKey = (deck) => `tstats:${deck.id}`;
// Weighted toward the templates you miss (see templateWeights), formats balanced.
function generateBatch(deck, sc, types, n) {
  const ts = templatesFor(deck, sc, types);
  if (!ts.length) return [];
  const weights = templateWeights(ts, store.get(statsKey(deck), {}));
  return Array.from({ length: n }, () => instantiate(ts[weightedIndex(weights)], newSeed()));
}
function questionById(deck, id) {
  const [tid, seed] = id.split('#');
  if (seed === undefined) return deck.questions.find((q) => q.id === id);
  const t = deck.templates.find((x) => x.id === tid);
  return t && instantiate(t, Number(seed));
}
const TYPE_LABEL = { mc: '🎯 Pick one', output: '⌨️ Type the output', trace: '🔍 Trace it', bug: '🐞 Find the bug', num: '🧮 Solve it' };
// The answer as shown after a miss and in the review list.
// 1.355e+19 reads better as 1.355 × 10^19 than as twenty digits.
const bigOrTiny = (x) => x !== 0 && (Math.abs(x) >= 1e7 || Math.abs(x) < 1e-3);
const shownAnswer = (q) => (typeOf(q) === 'bug' ? `line ${q.answer}` : typeOf(q) === 'num' ? `${bigOrTiny(q.answer) ? q.answer.toPrecision(4).replace(/e\+?(-?\d+)/, ' × 10^$1') : q.answer}${q.units ? ' ' + q.units : ''}` : q.answer);

// ---------- screens ----------
async function homeScreen() {
  const entries = await loadIndex();
  const decks = await Promise.all(entries.map((e) => loadDeck(e.id).catch((err) => ({ id: e.id, error: err.message }))));
  const xp = store.get('xp', 0);
  render(
    el('section', { class: 'hello' },
      el('h1', {}, xp ? 'Back for more?' : 'Ready to study?'),
      el('p', { class: 'muted' }, xp ? `Level ${Math.floor(xp / XP_PER_LEVEL) + 1}, ${XP_PER_LEVEL - (xp % XP_PER_LEVEL)} XP to the next one.` : 'Pick a class and start earning XP.')),
    el('div', { class: 'deck-list' }, decks.map((d) => d.error
      ? el('div', { class: 'deck' }, el('h2', {}, d.id), el('p', { class: 'muted' }, d.error))
      : el('a', { class: 'deck', href: `#/deck/${d.id}` },
          d.course && d.course !== d.title && el('span', { class: 'course' }, d.course),
          el('h2', {}, d.title.replace(/^.*?:\s*/, '')),
          d.description && el('p', { class: 'muted' }, d.description),
          el('div', { class: 'meta' },
            el('span', {}, `🧩 ${d.questions.length} problems`),
            d.templates.length > 0 && el('span', {}, `♾️ endless practice`),
            el('span', {}, `🃏 ${d.cards.length} cards`),
            store.get(`best:${d.id}`, null) != null && el('span', {}, `🏆 best ${store.get(`best:${d.id}`)}%`)),
          el('span', { class: 'go', 'aria-hidden': 'true' }, '→')))));
}

async function deckScreen(id, params) {
  const deck = await loadDeck(id);
  const sc = scopeOf(params);
  const units = deck.units || [];
  const topics = topicsOf(inScope([...deck.cards, ...deck.questions], { unit: sc.unit, topic: '' }));
  const qs = inScope(deck.questions, sc);
  const missed = store.get(missedKey(deck), []).filter((qid) => questionById(deck, qid));
  const go = (mode, extra = '') => { const q = [...scopeQuery(sc), extra].filter(Boolean); location.hash = `#/deck/${id}/${mode}` + (q.length ? '?' + q.join('&') : ''); };
  const pickScope = (next) => { const q = scopeQuery(next); location.hash = `#/deck/${id}` + (q.length ? '?' + q.join('&') : ''); };
  const count = (...types) => qs.filter((q) => types.includes(typeOf(q))).length;
  const plus = (...types) => (templatesFor(deck, sc, types).length ? ' + fresh ones' : '');
  const mode = (icon, name, blurb, onclick, cls = '') => el('button', { class: `mode ${cls}`, onclick },
    el('span', { class: 'icon', 'aria-hidden': 'true' }, icon), el('strong', {}, name), el('span', {}, blurb));
  const bestQuiz = store.get(`best:${deck.id}`, null);
  const weak = weakTopics(deck.templates, store.get(statsKey(deck), {}));
  const bestMatch = store.get(`match:${deck.id}`, null);

  render(
    el('a', { class: 'link', href: '#/' }, '← All classes'),
    el('section', { class: 'deck-head' },
      deck.course && deck.course !== deck.title && el('span', { class: 'qtype' }, deck.course),
      el('h1', {}, deck.title.replace(/^.*?:\s*/, '')),
      deck.description && el('p', { class: 'muted' }, deck.description)),
    units.length > 1 && el('div', { class: 'chips units', role: 'group', 'aria-label': 'Filter by unit' },
      [['', 'Whole class'], ...units.map((u) => [u, u])].map(([value, label]) =>
        el('button', { class: 'chip unit', 'aria-pressed': String(value === sc.unit), onclick: () => pickScope({ unit: value, topic: '' }) }, label))),
    topics.length > 1 && (sc.unit || units.length < 2) && el('div', { class: 'chips', role: 'group', 'aria-label': 'Filter by topic' },
      [['', sc.unit ? `All of ${sc.unit}` : 'All topics'], ...topics.map((x) => [x, x])].map(([value, label]) =>
        el('button', { class: 'chip', 'aria-pressed': String(value === sc.topic), onclick: () => pickScope({ unit: sc.unit, topic: value }) }, label))),
    el('div', { style: 'height:18px' }),
    el('button', { class: 'hero-play', onclick: () => go('quiz') },
      el('div', {}, el('strong', {}, 'Quick play'), el('span', {}, `${Math.min(QUIZ_LENGTH, qs.length)} mixed problems${scopeLabel(sc) ? ` on ${scopeLabel(sc)}` : ' from the whole class'}`)),
      el('span', { class: 'big-arrow', 'aria-hidden': 'true' }, '▶')),
    templatesFor(deck, sc, []).length > 0 && el('button', { class: 'hero-play endless', onclick: () => go('quiz', 'endless=1') },
      el('div', {}, el('strong', {}, 'Endless practice'), el('span', {}, `Fresh problems from ${templatesFor(deck, sc, []).length} templates with random values. Stop whenever.`)),
      el('span', { class: 'big-arrow', 'aria-hidden': 'true' }, '∞')),
    weak.length > 0 && el('div', { class: 'weak' },
      el('span', {}, '🎯 Your weak spots:'),
      weak.slice(0, 3).map((w) => el('button', { class: 'chip', onclick: () => { location.hash = `#/deck/${id}/quiz?endless=1&topic=${encodeURIComponent(w.topic)}`; } }, w.topic)),
      el('span', { class: 'muted' }, 'Endless already serves these more often.')),
    el('div', { class: 'section-label' }, 'PICK A CHALLENGE'),
    el('div', { class: 'modes' },
      count('bug') > 0 && mode('🐞', 'Error hunt', `${count('bug')} programs with one broken line${plus('bug')}`, () => go('quiz', 'types=bug')),
      count('output', 'trace', 'num') > 0 && mode('⌨️', 'Type it', `${count('output', 'trace', 'num')} problems${plus('output', 'trace', 'num')}, no choices to guess from`, () => go('quiz', 'types=output,trace,num')),
      count('mc') > 0 && mode('🎯', 'Multiple choice', `${count('mc')} tricky picks${plus('mc')}`, () => go('quiz', 'types=mc')),
      missed.length > 0 && mode('🔁', 'Fix mistakes', `${missed.length} you got wrong last time`, () => { location.hash = `#/deck/${id}/quiz?missed=1`; }, 'alert')),
    el('div', { class: 'section-label' }, 'WARM UP'),
    el('div', { class: 'modes' },
      mode('🃏', 'Flashcards', `${inScope(deck.cards, sc).length} key terms`, () => go('flash')),
      mode('🔗', 'Match', `Pair ${MATCH_PAIRS} terms against the clock`, () => go('match'))),
    (bestQuiz != null || bestMatch != null) && el('div', { class: 'records' },
      bestQuiz != null && el('span', { class: 'record' }, `🏆 Best quiz ${bestQuiz}%`),
      bestMatch != null && el('span', { class: 'record' }, `⚡ Best match ${bestMatch.toFixed(1)}s`)));
}

function playbar(id, progress, right) {
  const fill = el('i', { style: `width:${progress}%` });
  return { bar: el('div', { class: 'playbar' }, el('a', { class: 'close', href: `#/deck/${id}`, 'aria-label': 'Quit to deck' }, '×'), el('div', { class: 'track', role: 'progressbar', 'aria-valuenow': Math.round(progress), 'aria-valuemin': 0, 'aria-valuemax': 100 }, fill), right), fill };
}

async function quizScreen(id, params) {
  const deck = await loadDeck(id);
  const reviewing = params.get('missed') === '1';
  const endless = params.get('endless') === '1';
  const sc = scopeOf(params);
  const types = (params.get('types') || '').split(',').filter(Boolean);
  const missedIds = new Set(store.get(missedKey(deck), []));
  let pool = reviewing ? [...missedIds].map((qid) => questionById(deck, qid)).filter(Boolean) : inScope(deck.questions, sc);
  if (types.length && !reviewing) pool = pool.filter((q) => types.includes(typeOf(q)));
  const prep = (q) => (typeOf(q) === 'mc' ? { ...q, order: shuffle(q.choices) } : q);
  // Endless: mostly generated, with a hand-written problem mixed in now and then.
  const missedPool = pool.filter((q) => missedIds.has(q.id));
  const nextEndless = () => {
    if (Math.random() < 0.75 || !pool.length) return generateBatch(deck, sc, types, 1)[0];
    return shuffle(missedPool.length && Math.random() < 0.5 ? missedPool : pool)[0];
  };
  let questions;
  if (reviewing) questions = shuffle(pool);
  else if (endless) questions = [nextEndless()].filter(Boolean);
  else {
    // Half hand-written, half freshly generated (when the deck has templates), spread across formats.
    const gen = pickMixed(generateBatch(deck, sc, types, 40), QUIZ_LENGTH / 2);
    questions = shuffle([...pickMixed(pool, QUIZ_LENGTH - gen.length), ...gen]);
  }
  questions = questions.map(prep);
  if (!questions.length) {
    return render(el('div', { class: 'empty' }, el('h1', {}, 'Nothing here yet'), el('p', { class: 'muted' }, 'No problems match this filter.'), el('a', { class: 'btn primary', href: `#/deck/${id}` }, 'Back to the deck')));
  }

  let i = 0, score = 0, combo = 0, bestCombo = 0, earned = 0, answered = 0;
  const wrong = [];

  const finish = () => {
    if (!answered) { location.hash = `#/deck/${id}`; return; }
    questions = questions.slice(0, answered);
    const pct = Math.round((100 * score) / questions.length);
    for (const q of questions) missedIds.delete(q.id);
    for (const q of wrong) missedIds.add(q.id);
    store.set(missedKey(deck), [...missedIds]);
    if (!reviewing && !endless && !types.length && pct > store.get(`best:${deck.id}`, -1)) store.set(`best:${deck.id}`, pct);
    if (pct === 100) confetti();
    const again = () => quizScreen(id, params);

    render(el('section', { class: 'results' },
      el('h1', {}, pct === 100 ? 'Flawless.' : pct >= 80 ? 'Great run.' : pct >= 50 ? 'Getting there.' : 'Tough round.'),
      endless && el('p', { class: 'muted' }, `Endless session: ${questions.length} problems`),
      el('div', { class: 'ring', style: `--p:${pct}` }, el('span', {}, `${pct}%`)),
      el('div', { class: 'tally' },
        el('div', {}, el('b', {}, `${score}/${questions.length}`), el('span', {}, 'correct')),
        el('div', { class: 'gold' }, el('b', {}, `+${earned}`), el('span', {}, 'XP')),
        el('div', {}, el('b', {}, bestCombo), el('span', {}, 'best combo'))),
      wrong.length > 0 && el('div', { class: 'review' },
        el('h2', {}, 'Worth another look'),
        wrong.map((q) => el('article', {},
          el('span', { class: 'qtype' }, TYPE_LABEL[typeOf(q)]),
          el('p', {}, el('strong', {}, q.prompt)),
          q.code && codeBlock(q.code),
          el('p', {}, 'Answer: ', el('span', { class: 'ans' }, shownAnswer(q))),
          el('p', { class: 'muted' }, q.explanation)))),
      el('div', { class: 'actions' },
        wrong.length > 0 && el('a', { class: 'btn primary', href: `#/deck/${id}/quiz?missed=1`, onclick: (e) => {
          if (location.hash === `#/deck/${id}/quiz?missed=1`) { e.preventDefault(); again(); }
        } }, `Fix my ${wrong.length} mistake${wrong.length === 1 ? '' : 's'}`),
        el('button', { class: `btn ${wrong.length ? '' : 'primary'}`, onclick: again }, endless ? 'Keep practicing' : 'Play again'),
        el('a', { class: 'link', href: `#/deck/${id}`, style: 'justify-content:center' }, 'Back to the deck'))));
  };

  const show = () => {
    const q = questions[i];
    const type = typeOf(q);
    let response = null;
    let checked = false;

    const combLabel = el('span', { class: 'combo', 'aria-live': 'polite' }, combo >= 2 ? `🔥${combo}` : '');
    // Endless has no end, so the bar fills toward the next 10 answered.
    const progressAt = (n) => (endless ? (100 * (n % 10 || (n ? 10 : 0))) / 10 : (100 * n) / questions.length);
    const { bar, fill } = playbar(id, progressAt(i), combLabel);
    if (endless) bar.append(el('button', { class: 'btn end', onclick: finish }, `Done (${score}/${answered})`));
    const action = el('button', { class: 'btn primary wide', disabled: true }, 'Check');
    const verdict = el('div', { class: 'verdict', 'aria-live': 'polite' });
    const dock = el('div', { class: 'dock' }, el('div', { class: 'dock-inner' }, verdict, action));
    const setResponse = (v) => { response = v; action.disabled = v == null || String(v).trim() === ''; };

    // --- answer UI per type ---
    let body, lockUI, markUI, focusFirst, typeKey = () => {};
    if (type === 'mc') {
      const mono = q.code || (!deck.prose && q.order.some((c) => /[;"'\\(){}]/.test(c)));
      const buttons = q.order.map((c, n) => {
        const b = el('button', { class: `choice${mono ? ' mono' : ''}`, 'data-value': c, 'aria-pressed': 'false' },
          el('span', { class: 'key', 'aria-hidden': 'true' }, n + 1), el('span', { class: 'val' }, c));
        b.addEventListener('click', () => select(n));
        return b;
      });
      const select = (n) => {
        if (checked) return;
        buttons.forEach((b, k) => { b.classList.toggle('selected', k === n); b.setAttribute('aria-pressed', String(k === n)); });
        setResponse(q.order[n]);
      };
      body = el('div', { class: 'choices' }, buttons);
      lockUI = () => buttons.forEach((b) => { b.disabled = true; });
      markUI = (ok) => buttons.forEach((b) => {
        if (b.dataset.value === q.answer) b.classList.add('right');
        else if (!ok && b.dataset.value === response) b.classList.add('wrong');
        b.classList.remove('selected');
      });
      typeKey = (e) => { const n = Number(e.key); if (!checked && n >= 1 && n <= buttons.length) select(n - 1); };
      focusFirst = () => {};
    } else if (type === 'bug') {
      const lines = q.code.split('\n').map((src, n) => {
        const b = el('button', { class: 'line', 'aria-pressed': 'false', 'aria-label': `Line ${n + 1}: ${src}` },
          el('span', { class: 'n', 'aria-hidden': 'true' }, n + 1), el('code', {}, highlight(src)));
        b.addEventListener('click', () => select(n));
        return b;
      });
      const select = (n) => {
        if (checked) return;
        lines.forEach((b, k) => { b.classList.toggle('selected', k === n); b.setAttribute('aria-pressed', String(k === n)); });
        setResponse(n + 1);
      };
      body = el('div', { class: 'lines', role: 'group', 'aria-label': 'Program lines' }, lines);
      lockUI = () => lines.forEach((b) => { b.disabled = true; });
      markUI = (ok) => lines.forEach((b, k) => {
        if (k + 1 === q.answer) b.classList.add('right');
        else if (!ok && k + 1 === response) b.classList.add('wrong');
        b.classList.remove('selected');
      });
      typeKey = (e) => { const n = Number(e.key); if (!checked && n >= 1 && n <= lines.length) select(n - 1); };
      focusFirst = () => {};
    } else {
      const multi = type === 'output', num = type === 'num';
      const input = multi
        ? el('textarea', { class: 'typed', id: 'answer', rows: 3, spellcheck: 'false', autocapitalize: 'off', autocomplete: 'off', placeholder: 'Type the output…' })
        : el('input', { class: 'typed', id: 'answer', type: 'text', spellcheck: 'false', autocapitalize: 'off', autocomplete: 'off', placeholder: num ? 'Number…' : 'Value…' });
      input.addEventListener('input', () => setResponse(input.value));
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (!multi || e.ctrlKey || e.metaKey)) { e.preventDefault(); e.stopPropagation(); if (!action.disabled) action.click(); }
      });
      body = el('div', { class: 'answer-box' },
        el('label', { for: 'answer' }, multi ? 'Exact output (spaces and line breaks count)' : num ? `Your answer${q.units ? ` in ${q.units}` : ''}` : 'Your answer (exactly as Java would show it)'),
        num && q.units ? el('div', { class: 'with-units' }, input, el('span', { class: 'units' }, q.units)) : input,
        el('span', { class: 'hint' }, num ? el('span', {}, (q.tol === 0 && !q.abs ? 'Exact number' : 'Close enough counts') + ' · minus sign for direction · 3e8 or 3x10^8 work · ', el('kbd', {}, 'Enter'), ' checks') : multi ? el('span', {}, 'Enter makes a new line · ', el('kbd', {}, 'Ctrl'), ' + ', el('kbd', {}, 'Enter'), ' checks') : el('span', {}, el('kbd', {}, 'Enter'), ' checks')));
      lockUI = () => { input.disabled = true; };
      markUI = () => {};
      focusFirst = () => input.focus({ preventScroll: true });
    }

    const check = () => {
      checked = true;
      const ok = checkAnswer(q, response);
      lockUI();
      markUI(ok);
      answered++;
      if (q.generated) store.set(statsKey(deck), recordResult(store.get(statsKey(deck), {}), q.id.split('#')[0], checkAnswer(q, response)));
      let gain = 0;
      if (ok) {
        score++; combo++; bestCombo = Math.max(bestCombo, combo);
        gain = xpFor(q) + (combo >= 3 ? 5 : 0);
        earned += gain;
        awardXP(gain);
      } else { combo = 0; wrong.push(q); }
      combLabel.textContent = combo >= 2 ? `🔥${combo}` : '';
      fill.style.width = `${progressAt(i + 1)}%`;
      if (endless) { bar.querySelector('.end').textContent = `Done (${score}/${answered})`; questions.push(prep(nextEndless())); }

      const praise = ['Nice!', 'Nailed it.', 'Correct.', 'Sharp.', 'Exactly.'];
      const showYours = !ok && ['output', 'trace', 'num'].includes(type);
      verdict.replaceChildren(...[
        el('strong', {}, ok ? praise[Math.floor(Math.random() * praise.length)] : 'Not quite.', ok && el('span', { class: 'gain' }, `+${gain} XP${combo >= 3 ? ' 🔥' : ''}`)),
        showYours && el('div', { class: 'pair' },
          el('div', { class: 'expected' }, el('small', {}, 'YOU TYPED'), normalizeOutput(response) || '(nothing)'),
          el('div', { class: 'expected' }, el('small', {}, type === 'num' ? 'ANSWER' : 'JAVA PRINTS'), shownAnswer(q))),
        !ok && type === 'bug' && el('p', {}, el('strong', { style: 'font-size:1rem' }, `Line ${q.answer} is the broken one.`)),
        el('p', {}, q.explanation)].filter(Boolean));
      dock.classList.add(ok ? 'good' : 'bad');
      action.className = `btn wide ${ok ? 'good' : 'bad'}`;
      action.textContent = i + 1 < questions.length ? 'Continue' : 'See results';
      if (endless && answered % 10 === 0) verdict.append(el('p', { class: 'milestone' }, `${answered} done, ${score} right. Keep going or tap Done.`));
      action.disabled = false;
      action.focus({ preventScroll: true });
    };

    action.addEventListener('click', () => {
      if (!checked) return check();
      i++;
      i < questions.length ? show() : finish();
    });

    render(
      bar,
      el('div', {}, el('span', { class: 'qtype' }, TYPE_LABEL[type]), q.topic && el('span', { class: 'topic' }, ` · ${q.topic}`),
        q.generated && el('span', { class: 'fresh', title: 'Generated from a template with random values' }, 'fresh')),
      el('h1', { class: q.prompt.length > 140 ? 'prompt long' : 'prompt' }, q.prompt),
      q.code && type !== 'bug' && codeBlock(q.code),
      body,
      dock);
    onKey((e) => {
      typeKey(e);
      if (e.key === 'Enter' && !action.disabled && document.activeElement !== action && !['TEXTAREA', 'INPUT'].includes(document.activeElement?.tagName)) {
        e.preventDefault(); action.click();
      }
    });
    focusFirst();
  };
  show();
}

// Flashcards: "Again" puts the card back at the end of the pile.
async function flashScreen(id, params) {
  const deck = await loadDeck(id);
  const pile = shuffle(inScope(deck.cards, scopeOf(params)));
  const total = pile.length;
  let known = 0;
  if (!total) return render(el('div', { class: 'empty' }, el('h1', {}, 'No cards here'), el('a', { class: 'btn primary', href: `#/deck/${id}` }, 'Back to the deck')));

  const show = () => {
    if (!pile.length) {
      awardXP(10);
      return render(el('section', { class: 'results' },
        el('h1', {}, 'Deck cleared.'),
        el('p', { class: 'muted' }, `All ${total} cards known. +10 XP`),
        el('div', { class: 'actions' },
          el('button', { class: 'btn primary', onclick: () => flashScreen(id, params) }, 'Go again'),
          el('a', { class: 'btn', href: `#/deck/${id}/quiz` }, 'Now try a quiz'),
          el('a', { class: 'link', href: `#/deck/${id}`, style: 'justify-content:center' }, 'Back to the deck'))));
    }
    const card = pile[0];
    let flipped = false;
    const flash = el('button', { class: 'flash', 'aria-label': `Flashcard: ${card.term}. Press to flip.` },
      el('div', { class: 'flash-inner' },
        el('div', { class: 'face' }, el('div', { class: 'term' }, card.term), el('span', { class: 'corner' }, 'Tap or press Space to flip')),
        el('div', { class: 'face back' }, el('div', { class: 'def' }, card.definition), card.topic && el('span', { class: 'corner' }, card.topic))));
    const flip = () => { flipped = !flipped; flash.classList.toggle('flipped', flipped); };
    flash.addEventListener('click', flip);
    const again = () => { pile.push(pile.shift()); show(); };
    const gotIt = () => { pile.shift(); known++; show(); };
    const { bar } = playbar(id, (100 * known) / total, el('span', { class: 'combo' }, `${known}/${total}`));

    render(bar, flash,
      el('div', { class: 'dock' }, el('div', { class: 'dock-inner pile' },
        el('button', { class: 'btn', onclick: again }, '↺ Again'),
        el('button', { class: 'btn primary', onclick: gotIt }, 'Got it ✓'))));
    onKey((e) => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); }
      else if (e.key === 'ArrowRight') gotIt();
      else if (e.key === 'ArrowLeft') again();
    });
  };
  show();
}

async function matchScreen(id, params) {
  const deck = await loadDeck(id);
  const cards = inScope(deck.cards, scopeOf(params));
  if (cards.length < 2) return render(el('div', { class: 'empty' }, el('h1', {}, 'Not enough cards'), el('a', { class: 'btn primary', href: `#/deck/${id}` }, 'Back to the deck')));

  const { terms, definitions } = buildMatchRound(cards, MATCH_PAIRS);
  const pairs = terms.length;
  const start = performance.now();
  let selected = null, matched = 0, misses = 0;
  const clock = el('span', { class: 'timer' }, '0.0s');
  const timer = setInterval(() => { clock.textContent = ((performance.now() - start) / 1000).toFixed(1) + 's'; }, 100);
  const { bar, fill } = playbar(id, 0, clock);

  const tile = (card, side) => {
    const b = el('button', { class: `tile ${side}`, 'data-id': card.id, 'data-side': side }, side === 'term' ? card.term : card.definition);
    b.addEventListener('click', () => choose(b));
    return b;
  };

  const choose = (b) => {
    if (b.classList.contains('done')) return;
    if (!selected || selected.dataset.side === b.dataset.side) {
      if (selected) selected.classList.remove('selected');
      selected = b === selected ? null : b;
      if (selected) selected.classList.add('selected');
      return;
    }
    const a = selected;
    selected = null;
    a.classList.remove('selected');
    if (a.dataset.id === b.dataset.id) {
      for (const t of [a, b]) { t.classList.add('done'); t.disabled = true; }
      fill.style.width = `${(100 * ++matched) / pairs}%`;
      if (matched === pairs) setTimeout(done, 350);
    } else {
      misses++;
      for (const t of [a, b]) t.classList.add('shake');
      setTimeout(() => { for (const t of [a, b]) t.classList.remove('shake'); }, 450);
    }
  };

  const done = () => {
    clearInterval(timer);
    const secs = (performance.now() - start) / 1000;
    const final = secs + misses * 2; // each miss costs 2 seconds
    const key = `match:${deck.id}`;
    const best = store.get(key, null);
    const record = best == null || final < best;
    if (record) store.set(key, final);
    awardXP(20);
    if (record && misses === 0) confetti();
    render(el('section', { class: 'results' },
      el('h1', {}, record ? 'New best time.' : 'All matched.'),
      el('div', { class: 'ring', style: `--p:${Math.round((100 * pairs) / (pairs + misses))}` }, el('span', {}, final.toFixed(1) + 's')),
      el('div', { class: 'tally' },
        el('div', {}, el('b', {}, secs.toFixed(1)), el('span', {}, 'seconds')),
        el('div', {}, el('b', {}, misses), el('span', {}, `miss${misses === 1 ? '' : 'es'} (+2s)`)),
        el('div', { class: 'gold' }, el('b', {}, '+20'), el('span', {}, 'XP'))),
      best != null && !record && el('p', { class: 'muted' }, `Your best is ${best.toFixed(1)}s.`),
      el('div', { class: 'actions' },
        el('button', { class: 'btn primary', onclick: () => matchScreen(id, params) }, 'Play again'),
        el('a', { class: 'link', href: `#/deck/${id}`, style: 'justify-content:center' }, 'Back to the deck'))));
  };

  render(bar,
    el('p', { class: 'qtype', style: 'margin-bottom:12px' }, '🔗 Tap a term, then its definition'),
    el('div', { class: 'match' },
      el('div', { class: 'col' }, terms.map((c) => tile(c, 'term'))),
      el('div', { class: 'col' }, definitions.map((c) => tile(c, 'def')))));
  const prev = cleanup;
  cleanup = () => { prev(); clearInterval(timer); };
}

// ---------- router ----------
async function route() {
  const [path, query = ''] = location.hash.replace(/^#/, '').split('?');
  const params = new URLSearchParams(query);
  const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
  if (!app.firstElementChild || app.querySelector('noscript')) render(el('div', { class: 'skeleton', 'aria-label': 'Loading' }));
  try {
    if (parts[0] === 'deck' && parts[1]) {
      const screen = { flash: flashScreen, quiz: quizScreen, match: matchScreen }[parts[2]] || deckScreen;
      await screen(parts[1], params);
    } else {
      await homeScreen();
    }
  } catch (err) {
    render(el('div', { class: 'empty' }, el('h1', {}, 'That didn’t load'), el('p', { class: 'muted' }, err.message), el('a', { class: 'btn primary', href: '#/' }, 'Go home')));
  }
}

renderStats();
window.addEventListener('hashchange', route);
route();
