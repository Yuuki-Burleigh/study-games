// Toolkit for problem templates: a seeded RNG plus Java-semantics helpers, so a generated answer is
// computed the way Java would compute it. Every template is also sampled and run through real Java in CI
// (tools/check_java.py), which is what makes these helpers trustworthy.

// mulberry32: small, fast, deterministic. The same seed always rebuilds the same problem.
export function rng(seed) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const r = {
    next,
    int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)), // inclusive
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    chance: (p) => next() < p,
    shuffle(arr) {
      const out = [...arr];
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
      }
      return out;
    },
    // n distinct items from arr
    sample: (arr, n) => r.shuffle(arr).slice(0, n),
  };
  return r;
}

export const newSeed = () => Math.floor(Math.random() * 2 ** 31);

// ---- Java semantics ----
export const idiv = (a, b) => Math.trunc(a / b); // int / int (truncates toward zero)
export const imod = (a, b) => a % b; // same sign rule as Java's %

// Double.toString for "ordinary" magnitudes (1e-3 <= |x| < 1e7): whole values get ".0".
// Outside that range Java switches to E-notation, so templates must keep doubles inside it.
export function jdouble(x) {
  if (!Number.isFinite(x)) throw new Error('jdouble: not finite');
  const ax = Math.abs(x);
  if (ax !== 0 && (ax < 1e-3 || ax >= 1e7)) throw new Error(`jdouble: ${x} is outside the safe range`);
  return Number.isInteger(x) ? x.toFixed(1) : String(x);
}

export const code = (ch) => ch.charCodeAt(0);
export const chr = (n) => String.fromCharCode(n);

// Java source literal for a String value (escapes \ and ").
export const jstr = (s) => '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n') + '"';

// Multiple-choice options: the answer plus up to 3 distinct distractors (falls back to extras).
export function choices(r, answer, distractors, extras = []) {
  const seen = new Set([answer]);
  const out = [answer];
  for (const d of [...distractors, ...extras]) {
    const v = String(d);
    if (out.length === 4) break;
    if (!seen.has(v)) { seen.add(v); out.push(v); }
  }
  if (out.length < 2) throw new Error('choices: no distinct distractors');
  return r.shuffle(out);
}

// ---- pools ----
export const NAMES = ['score', 'total', 'count', 'price', 'age', 'points', 'items', 'level', 'coins', 'lives', 'speed',
  'width', 'height', 'minutes', 'seconds', 'hours', 'steps', 'tickets', 'guests', 'pages', 'laps', 'votes', 'boxes', 'cookies'];
export const WORDS = ['Java', 'Code', 'Sum', 'Total', 'Hi', 'Score', 'Level', 'Day', 'Room', 'Team', 'Lab', 'Bus', 'Box',
  'Cat', 'Map', 'Run', 'Win', 'Gold', 'Star', 'Byte', 'Bit', 'App', 'Key', 'Top'];
export const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYabcdefghijklmnopqrstuvwxy'.split(''); // no Z/z: +1 stays a letter

// ---- template building blocks ----
// a, b with a % b != 0, so integer division actually drops something
export function uneven(r, aLo, aHi, bLo, bHi) {
  for (;;) { const a = r.int(aLo, aHi), b = r.int(bLo, bHi); if (a % b !== 0) return [a, b]; }
}
// Program builder for find-the-bug: lines plus optional filler printlns, tracking the flagged line.
export function program(r, lines, fillers = r.int(0, 2)) {
  const out = [...lines];
  for (let k = 0; k < fillers; k++) {
    const at = r.int(0, out.length - 1); // never after the last line, so the program still "ends" on real code
    out.splice(at, 0, { src: `System.out.println(${jstr(r.pick(WORDS))});` });
  }
  return { code: out.map((l) => l.src).join('\n'), answer: out.findIndex((l) => l.bad) + 1 };
}

// Turn a template instance into a full question object with a stable, replayable id.
export function instantiate(template, seed) {
  const q = template.make(rng(seed));
  return { type: template.type, topic: template.topic, ...q, id: `${template.id}#${seed}`, generated: true };
}
