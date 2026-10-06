import { shuffle, checkAnswer, buildMatchRound, validateDeck } from './game.js';

const app = document.getElementById('app');
const QUIZ_LENGTH = 10;
const MATCH_PAIRS = 6;
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
  app.replaceChildren(...nodes);
  app.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

function onKey(handler) {
  const fn = (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    handler(e);
  };
  window.addEventListener('keydown', fn);
  cleanup = () => window.removeEventListener('keydown', fn);
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

// ---------- data ----------
const cache = new Map();

async function loadIndex() {
  const res = await fetch('./decks/index.json', { cache: 'no-cache' });
  if (!res.ok) throw new Error('Could not load decks/index.json');
  return (await res.json()).decks;
}

async function loadDeck(id) {
  if (cache.has(id)) return cache.get(id);
  const entry = (await loadIndex()).find((d) => d.id === id);
  if (!entry) throw new Error(`No deck called "${id}"`);
  const res = await fetch('./' + entry.file, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`Could not load ${entry.file}`);
  const deck = await res.json();
  const errors = validateDeck(deck);
  if (errors.length) throw new Error(`${entry.file} is invalid: ${errors.join('; ')}`);
  cache.set(id, deck);
  return deck;
}

const topicsOf = (items) => [...new Set(items.map((x) => x.topic).filter(Boolean))];
const filterTopic = (items, topic) => (topic ? items.filter((x) => x.topic === topic) : items);
const missedKey = (deck) => `missed:${deck.id}`;

// ---------- screens ----------
async function homeScreen() {
  const entries = await loadIndex();
  const decks = await Promise.all(entries.map((e) => loadDeck(e.id).catch((err) => ({ id: e.id, error: err.message }))));
  render(
    el('h1', {}, 'Your decks'),
    el('p', { class: 'muted' }, 'Pick a class topic, then a game.'),
    el('div', { class: 'deck-list' }, decks.map((d) => d.error
      ? el('div', { class: 'card' }, el('h2', {}, d.id), el('p', { class: 'muted' }, d.error))
      : el('a', { class: 'deck-link', href: `#/deck/${d.id}` },
          el('div', { class: 'card' },
            el('h2', {}, d.title),
            d.description && el('p', { class: 'muted' }, d.description),
            el('div', { class: 'tags' },
              el('span', { class: 'tag' }, `${d.cards.length} cards`),
              el('span', { class: 'tag' }, `${d.questions.length} questions`),
              bestTag(d))))))
  );
}

function bestTag(deck) {
  const best = store.get(`best:${deck.id}`, null);
  return best ? el('span', { class: 'tag' }, `Best quiz: ${best}%`) : null;
}

async function deckScreen(id, params) {
  const deck = await loadDeck(id);
  const topic = params.get('topic') || '';
  const topics = topicsOf([...deck.cards, ...deck.questions]);
  const missed = store.get(missedKey(deck), []).filter((qid) => deck.questions.some((q) => q.id === qid));
  const q = topic ? `?topic=${encodeURIComponent(topic)}` : '';

  const mode = (icon, name, blurb, hash) => el('button', { class: 'card mode', onclick: () => { location.hash = hash; } },
    el('span', { class: 'icon', 'aria-hidden': 'true' }, icon), el('strong', {}, name), el('span', { class: 'muted' }, blurb));

  render(
    el('a', { class: 'back', href: '#/' }, '← All decks'),
    el('h1', {}, deck.title),
    deck.description && el('p', { class: 'muted' }, deck.description),
    topics.length > 1 && el('div', { class: 'chips', role: 'group', 'aria-label': 'Filter by topic' },
      [['', 'Everything'], ...topics.map((t) => [t, t])].map(([value, label]) =>
        el('button', {
          class: 'chip', 'aria-pressed': String(value === topic),
          onclick: () => { location.hash = `#/deck/${id}` + (value ? `?topic=${encodeURIComponent(value)}` : ''); },
        }, label))),
    el('div', { class: 'modes' },
      mode('🃏', 'Flashcards', `Flip through ${filterTopic(deck.cards, topic).length} terms`, `#/deck/${id}/flash${q}`),
      mode('❓', 'Quiz', `${Math.min(QUIZ_LENGTH, filterTopic(deck.questions, topic).length)} questions, incl. "what prints?"`, `#/deck/${id}/quiz${q}`),
      mode('🔗', 'Match', `Pair ${MATCH_PAIRS} terms with definitions, against the clock`, `#/deck/${id}/match${q}`),
      missed.length > 0 && mode('🔁', 'Review missed', `${missed.length} question${missed.length === 1 ? '' : 's'} you got wrong`, `#/deck/${id}/quiz?missed=1`)),
    bestTag(deck) && el('div', { class: 'tags' }, bestTag(deck))
  );
}

// Flashcards: "Again" puts the card back at the end of the pile.
async function flashScreen(id, params) {
  const deck = await loadDeck(id);
  const pile = shuffle(filterTopic(deck.cards, params.get('topic')));
  const total = pile.length;
  let known = 0;
  if (!total) return render(el('p', {}, 'No cards for this topic.'), el('a', { href: `#/deck/${id}` }, 'Back'));

  const show = () => {
    if (!pile.length) {
      return render(
        el('h1', {}, 'Deck cleared 🎉'),
        el('p', { class: 'muted' }, `You went through all ${total} cards.`),
        el('div', { class: 'row' },
          el('button', { class: 'btn primary', onclick: () => flashScreen(id, params) }, 'Go again'),
          el('a', { class: 'btn', href: `#/deck/${id}` }, 'Back to deck')));
    }
    const card = pile[0];
    let flipped = false;
    const flash = el('button', { class: 'flash', 'aria-label': 'Flip card' },
      el('div', { class: 'flash-inner' },
        el('div', { class: 'face card' }, el('div', { class: 'term' }, card.term), el('span', { class: 'hint' }, 'Tap or press Space to flip')),
        el('div', { class: 'face back card' }, el('div', { class: 'def' }, card.definition), card.topic && el('span', { class: 'hint' }, card.topic))));
    const flip = () => { flipped = !flipped; flash.classList.toggle('flipped', flipped); };
    flash.addEventListener('click', flip);
    const again = () => { pile.push(pile.shift()); show(); };
    const gotIt = () => { pile.shift(); known++; show(); };

    render(
      el('a', { class: 'back', href: `#/deck/${id}` }, '← ' + deck.title),
      el('div', { class: 'bar' }, el('span', {}, 'Flashcards'), el('span', {}, `${known} / ${total} known`)),
      el('div', { class: 'progress' }, el('span', { style: `width:${(100 * known) / total}%` })),
      flash,
      el('div', { class: 'row' },
        el('button', { class: 'btn', onclick: again }, 'Again (←)'),
        el('span', { class: 'spacer' }),
        el('button', { class: 'btn primary', onclick: gotIt }, 'Got it (→)')));
    onKey((e) => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); }
      else if (e.key === 'ArrowRight') gotIt();
      else if (e.key === 'ArrowLeft') again();
    });
  };
  show();
}

async function quizScreen(id, params) {
  const deck = await loadDeck(id);
  const reviewing = params.get('missed') === '1';
  const missedIds = new Set(store.get(missedKey(deck), []));
  const pool = reviewing ? deck.questions.filter((q) => missedIds.has(q.id)) : filterTopic(deck.questions, params.get('topic'));
  const questions = shuffle(pool).slice(0, reviewing ? pool.length : QUIZ_LENGTH)
    .map((q) => ({ ...q, order: shuffle(q.choices) }));
  if (!questions.length) return render(el('p', {}, 'Nothing to quiz here.'), el('a', { href: `#/deck/${id}` }, 'Back'));

  let i = 0, score = 0, streak = 0, bestStreak = 0;
  const wrong = [];

  const finish = () => {
    const pct = Math.round((100 * score) / questions.length);
    // Update the missed list: right answers leave it, wrong ones join it.
    for (const q of questions) missedIds.delete(q.id);
    for (const q of wrong) missedIds.add(q.id);
    store.set(missedKey(deck), [...missedIds]);
    if (!reviewing && pct > store.get(`best:${deck.id}`, 0)) store.set(`best:${deck.id}`, pct);

    render(
      el('h1', {}, pct === 100 ? 'Perfect! 🏆' : pct >= 70 ? 'Nice work 👏' : 'Keep going 💪'),
      el('div', { class: 'big' }, `${score} / ${questions.length}`),
      el('p', { class: 'muted' }, `${pct}% · best streak ${bestStreak}`),
      wrong.length > 0 && el('div', { class: 'card' },
        el('strong', {}, 'Review these'),
        el('ul', { class: 'missed' }, wrong.map((q) => el('li', {},
          q.prompt, q.code && el('pre', {}, q.code),
          el('div', {}, 'Answer: ', el('code', {}, q.answer)),
          el('div', { class: 'muted' }, q.explanation))))),
      el('div', { class: 'row' },
        el('button', { class: 'btn primary', onclick: () => quizScreen(id, params) }, 'New quiz'),
        wrong.length > 0 && el('a', { class: 'btn', href: `#/deck/${id}/quiz?missed=1`, onclick: (e) => {
          // Same hash as now when already reviewing: hashchange will not fire, so re-render directly.
          if (location.hash === `#/deck/${id}/quiz?missed=1`) { e.preventDefault(); quizScreen(id, params); }
        } }, 'Retry missed'),
        el('a', { class: 'btn', href: `#/deck/${id}` }, 'Back to deck')));
  };

  const show = () => {
    const q = questions[i];
    let answered = false;
    // Short, non-code choices read better in the normal font.
    const plain = !q.code && q.order.every((c) => !/[\n"'\\;(){}+]/.test(c));
    const next = el('button', { class: 'btn primary', disabled: true, onclick: () => { i++; i < questions.length ? show() : finish(); } },
      i + 1 < questions.length ? 'Next (Enter)' : 'See results');
    const feedback = el('div', { 'aria-live': 'polite' });

    const pick = (choice, btn) => {
      if (answered) return;
      answered = true;
      const ok = checkAnswer(q, choice);
      if (ok) { score++; streak++; bestStreak = Math.max(bestStreak, streak); } else { streak = 0; wrong.push(q); }
      for (const b of buttons) {
        b.disabled = true;
        if (b.dataset.value === q.answer) b.classList.add('right');
      }
      if (!ok) btn.classList.add('wrong');
      feedback.replaceChildren(el('div', { class: `feedback ${ok ? 'good' : 'bad'}` },
        el('strong', {}, ok ? (streak >= 3 ? `Correct, ${streak} in a row 🔥` : 'Correct') : 'Not quite'),
        q.explanation));
      next.disabled = false;
      next.focus();
    };

    const buttons = q.order.map((c, n) => {
      const b = el('button', { class: `choice${plain ? ' plain' : ''}`, 'data-value': c },
        el('span', { class: 'key', 'aria-hidden': 'true' }, n + 1), el('span', { class: 'val' }, c));
      b.addEventListener('click', () => pick(c, b));
      return b;
    });

    render(
      el('a', { class: 'back', href: `#/deck/${id}` }, '← ' + deck.title),
      el('div', { class: 'bar' },
        el('span', {}, `${reviewing ? 'Review' : 'Quiz'} · ${i + 1} of ${questions.length}`),
        el('span', {}, `Score ${score}${streak >= 2 ? ` · 🔥 ${streak}` : ''}`)),
      el('div', { class: 'progress' }, el('span', { style: `width:${(100 * i) / questions.length}%` })),
      el('div', { class: 'card' },
        q.topic && el('div', { class: 'tag', style: 'display:inline-block;margin-bottom:8px' }, q.topic),
        el('div', { style: 'white-space:pre-wrap;font-weight:600' }, q.prompt),
        q.code && el('pre', {}, q.code),
        el('div', { class: 'choices' }, buttons),
        feedback),
      el('div', { class: 'row' }, el('span', { class: 'spacer' }), next));

    onKey((e) => {
      const n = Number(e.key);
      if (!answered && n >= 1 && n <= buttons.length) pick(q.order[n - 1], buttons[n - 1]);
      else if (answered && e.key === 'Enter' && document.activeElement !== next) { e.preventDefault(); next.click(); }
    });
  };
  show();
}

async function matchScreen(id, params) {
  const deck = await loadDeck(id);
  const cards = filterTopic(deck.cards, params.get('topic'));
  if (cards.length < 2) return render(el('p', {}, 'Not enough cards for this topic.'), el('a', { href: `#/deck/${id}` }, 'Back'));

  const { terms, definitions } = buildMatchRound(cards, MATCH_PAIRS);
  const pairs = terms.length;
  const start = performance.now();
  let selected = null, matched = 0, misses = 0;
  const clock = el('span', {}, '0.0s');
  const timer = setInterval(() => { clock.textContent = ((performance.now() - start) / 1000).toFixed(1) + 's'; }, 100);

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
      if (++matched === pairs) done();
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
    render(
      el('h1', {}, record ? 'New best time! ⚡' : 'All matched ✅'),
      el('div', { class: 'big' }, final.toFixed(1) + 's'),
      el('p', { class: 'muted' }, `${secs.toFixed(1)}s + ${misses} miss${misses === 1 ? '' : 'es'} × 2s${best != null && !record ? ` · best ${best.toFixed(1)}s` : ''}`),
      el('div', { class: 'row' },
        el('button', { class: 'btn primary', onclick: () => matchScreen(id, params) }, 'Play again'),
        el('a', { class: 'btn', href: `#/deck/${id}` }, 'Back to deck')));
  };

  render(
    el('a', { class: 'back', href: `#/deck/${id}` }, '← ' + deck.title),
    el('div', { class: 'bar' }, el('span', {}, 'Match: tap a term, then its definition'), clock),
    el('div', { class: 'match' },
      el('div', { class: 'col' }, terms.map((c) => tile(c, 'term'))),
      el('div', { class: 'col' }, definitions.map((c) => tile(c, 'def')))));
  cleanup = () => clearInterval(timer);
}

// ---------- router ----------
async function route() {
  const [path, query = ''] = location.hash.replace(/^#/, '').split('?');
  const params = new URLSearchParams(query);
  const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
  try {
    if (parts[0] === 'deck' && parts[1]) {
      const screen = { flash: flashScreen, quiz: quizScreen, match: matchScreen }[parts[2]] || deckScreen;
      await screen(parts[1], params);
    } else {
      await homeScreen();
    }
  } catch (err) {
    render(el('h1', {}, 'Something went wrong'), el('p', {}, err.message), el('a', { href: '#/' }, 'Home'));
  }
}

window.addEventListener('hashchange', route);
route();
