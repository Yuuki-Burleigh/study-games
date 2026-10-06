// Problem templates for CS 209 for loops (lecture 10-6), mixed with earlier topics. Answers are computed by
// running the same loop in JS with Java's rules (gen-kit.js). Scope: courses/cs209.md (no while syntax, no if,
// no nested loops, no ==). CI samples every template and runs the Java for real.
import { idiv, imod, jdouble, code, jstr, choices, program, NAMES, WORDS, LETTERS } from '../gen-kit.js';

const F = 'For loop basics', ACC = 'Counting & accumulating', SCOPE = 'Scope & braces', MIX = 'Loops + earlier topics', ERR = 'Finding errors';
const OUT = 'Type exactly what this prints.';
const ask = (v) => `After this runs, what is the value of ${v}?`;

// A random loop: start, test, update. up = counting up. Returns the header source and the i values it visits.
function randomLoop(r, { up = r.chance(0.7), maxPasses = 8, allowZero = false } = {}) {
  for (;;) {
    const step = r.pick([1, 1, 1, 2, 3]);
    const s = up ? r.int(0, 6) : r.int(6, 20);
    const strict = r.chance(0.5);
    const e = up ? s + r.int(allowZero ? 0 : 1, 12) : s - r.int(allowZero ? 0 : 1, 12);
    const op = up ? (strict ? '<' : '<=') : (strict ? '>' : '>=');
    const test = (i) => (op === '<' ? i < e : op === '<=' ? i <= e : op === '>' ? i > e : i >= e);
    const vals = [];
    for (let i = s; test(i) && vals.length <= maxPasses; i += up ? step : -step) vals.push(i);
    if (vals.length > maxPasses || (!allowZero && vals.length === 0)) continue;
    const upd = step === 1 ? (up ? 'i++' : 'i--') : (up ? `i += ${step}` : `i -= ${step}`);
    return { head: `for (int i = ${s}; i ${op} ${e}; ${upd})`, vals, s, e, op, step, up };
  }
}
const body = (head, ...lines) => `${head} {\n${lines.map((l) => '    ' + l).join('\n')}\n}`;

export default [
  // ---------- multiple choice ----------
  { id: 'g-l-times', type: 'mc', topic: ACC, make(r) {
    const L = randomLoop(r, { allowZero: r.chance(0.15) });
    const n = L.vals.length, ans = String(n);
    const span = Math.abs(L.e - L.s);
    return { prompt: 'How many times does the body run?', code: body(L.head, 'System.out.print("*");'), answer: ans,
      choices: choices(r, ans, [String(n + 1), String(Math.max(0, n - 1)), String(span)], [String(n + 2), 'It never stops']),
      explanation: n === 0 ? `The test is checked before the first pass and ${L.s} ${L.op} ${L.e} is already false, so the body never runs.`
        : `i takes ${L.vals.join(', ')}. The next value fails i ${L.op} ${L.e}, so that's ${n} pass${n === 1 ? '' : 'es'}.` };
  } },
  { id: 'g-l-header', type: 'mc', topic: F, make(r) {
    const s = r.int(0, 5), e = s + r.int(2, 9), good = `for (int i = ${s}; i <= ${e}; i++)`;
    const bad = r.sample([`for (int i = ${s}, i <= ${e}, i++)`, `for (int i = ${s}; i =< ${e}; i++)`, `For (int i = ${s}; i <= ${e}; i++)`,
      `for (i = ${s}; i <= ${e}; i++)`, `for (int i = ${s}; i <= ${e}; i++;)`], 3);
    return { prompt: 'Which for loop header compiles?', answer: good, check: 'compiles', wrap: '%s { }', choices: choices(r, good, bad),
      explanation: 'Semicolons separate the three parts (none after the update), the operator is <= not =<, the counter needs a type, and it\'s lowercase for.' };
  } },

  // ---------- type the output ----------
  { id: 'g-l-print', type: 'output', topic: F, make(r) {
    const L = randomLoop(r), sep = r.pick([' ', ',', '-']);
    return { prompt: OUT, code: body(L.head, `System.out.print(i + ${jstr(sep)});`), answer: L.vals.map((i) => i + sep).join(''),
      explanation: `i takes ${L.vals.join(', ')}, and each pass prints the number followed by "${sep}".` };
  } },
  { id: 'g-l-nobrace', type: 'output', topic: SCOPE, make(r) {
    const L = randomLoop(r, { maxPasses: 5 }), [a, b] = r.sample(WORDS, 2);
    return { prompt: OUT, code: `${L.head}\n    System.out.print(${jstr(a)});\n    System.out.print(${jstr(b)});`,
      answer: a.repeat(L.vals.length) + b,
      explanation: `No braces, so only print("${a}") is in the loop (${L.vals.length} times). print("${b}") runs once afterwards, whatever the indentation suggests.` };
  } },
  { id: 'g-l-concat', type: 'output', topic: MIX, make(r) {
    const L = randomLoop(r, { up: true, maxPasses: 5 });
    const v = r.pick([
      { src: 'i + i + " "', f: (i) => `${i + i} `, why: 'i + i is number + number, so it adds before the " " turns it into text.' },
      { src: '"" + i + i', f: (i) => `${i}${i}`, why: '"" comes first, so i is appended twice as text.' },
      { src: 'i + " " + i + ","', f: (i) => `${i} ${i},`, why: 'Once " " joins, the second i and the "," are appended as text.' },
      { src: 'i * 2 + "," ', f: (i) => `${i * 2},`, why: '* happens before +, so i * 2 is worked out first, then "," is appended.' },
    ]);
    return { prompt: OUT, code: body(L.head, `System.out.print(${v.src.trim()});`), answer: L.vals.map(v.f).join(''),
      explanation: `${v.why} i takes ${L.vals.join(', ')}.` };
  } },
  { id: 'g-l-running', type: 'output', topic: ACC, make(r) {
    const L = randomLoop(r, { up: true, maxPasses: 5 });
    let sum = 0;
    const lines = L.vals.map((i) => (sum += i));
    return { prompt: OUT, code: `int sum = 0;\n${body(L.head, 'sum += i;', 'System.out.println(sum);')}`, answer: lines.join('\n'),
      explanation: `The println is INSIDE the loop, so it prints the running total after each pass: ${lines.join(', ')}.` };
  } },
  { id: 'g-l-total', type: 'output', topic: ACC, make(r) {
    const L = randomLoop(r), w = r.pick(WORDS);
    const sum = L.vals.reduce((a, b) => a + b, 0);
    return { prompt: OUT, code: `int sum = 0;\n${body(L.head, 'sum = sum + i;')}\nSystem.out.println(${jstr(w + ': ')} + sum);`, answer: `${w}: ${sum}`,
      explanation: `${L.vals.join(' + ')} = ${sum}, printed once because the println is after the loop.` };
  } },
  { id: 'g-l-mod', type: 'output', topic: MIX, make(r) {
    const L = randomLoop(r, { up: true }), k = r.int(2, 4);
    const div = r.chance(0.5);
    return { prompt: OUT, code: body(L.head, `System.out.print(i ${div ? '/' : '%'} ${k} + " ");`),
      answer: L.vals.map((i) => `${div ? idiv(i, k) : imod(i, k)} `).join(''),
      explanation: div ? `Integer division: each i / ${k} drops the fraction (${L.vals.map((i) => `${i}/${k}=${idiv(i, k)}`).join(', ')}).`
        : `% ${k} gives the remainder: ${L.vals.map((i) => `${i}%${k}=${imod(i, k)}`).join(', ')}.` };
  } },
  { id: 'g-l-chars', type: 'output', topic: MIX, make(r) {
    const L = randomLoop(r, { up: true, maxPasses: 4 }), c = r.pick(LETTERS);
    return { prompt: OUT, code: `char c = '${c}';\n${body(L.head, 'System.out.print(c + i + " ");')}`, answer: L.vals.map((i) => `${code(c) + i} `).join(''),
      explanation: `c + i is char + int, a number ('${c}' is ${code(c)}), and that's worked out before " " joins.` };
  } },

  // ---------- trace ----------
  { id: 'g-l-count', type: 'trace', topic: ACC, make(r) {
    const L = randomLoop(r, { allowZero: r.chance(0.1) });
    return { prompt: ask('count'), var: 'count', code: `int count = 0;\n${body(L.head, 'count++;')}`, answer: String(L.vals.length),
      explanation: L.vals.length ? `i takes ${L.vals.join(', ')}: ${L.vals.length} passes, one count++ each.` : `The test fails before the first pass, so count stays 0.` };
  } },
  { id: 'g-l-sum', type: 'trace', topic: ACC, make(r) {
    const L = randomLoop(r), sum = L.vals.reduce((a, b) => a + b, 0);
    return { prompt: ask('sum'), var: 'sum', code: `int sum = 0;\n${body(L.head, 'sum += i;')}`, answer: String(sum),
      explanation: `i takes ${L.vals.join(', ')}, so sum = ${L.vals.join(' + ')} = ${sum}.` };
  } },
  { id: 'g-l-product', type: 'trace', topic: ACC, make(r) {
    const n = r.int(2, 6), m = r.pick([2, 3]), start = r.int(1, 3), s = r.int(0, 3);
    return { prompt: ask('x'), var: 'x', code: `int x = ${start};\n${body(`for (int i = ${s}; i < ${s + n}; i++)`, `x = x * ${m};`)}`, answer: String(start * m ** n),
      explanation: `The loop runs ${n} times (i = ${s} to ${s + n - 1}), multiplying by ${m} each time: ${start} × ${m}^${n} = ${start * m ** n}.` };
  } },
  { id: 'g-l-last', type: 'trace', topic: SCOPE, make(r) {
    const L = randomLoop(r);
    return { prompt: ask('n'), var: 'n', code: `int n = 0;\n${body(L.head, 'n = i;')}`, answer: String(L.vals.at(-1)),
      explanation: `The last pass has i = ${L.vals.at(-1)}. i changes once more after that, but the test fails, so the body (and n = i) doesn't run again.` };
  } },
  { id: 'g-l-avg', type: 'trace', topic: MIX, make(r) {
    let L, sum, k;
    do { L = randomLoop(r, { up: true }); sum = L.vals.reduce((a, b) => a + b, 0); k = L.vals.length; } while (k < 2 || sum % k === 0);
    return { prompt: ask('avg'), var: 'avg', code: `int sum = 0;\n${body(L.head, 'sum += i;')}\ndouble avg = sum / ${k};`, answer: jdouble(idiv(sum, k)),
      explanation: `sum is ${sum}, and ${sum} / ${k} is int / int = ${idiv(sum, k)} BEFORE it's stored, so avg is ${jdouble(idiv(sum, k))}. Dividing by ${k}.0 would keep the fraction.` };
  } },
  { id: 'g-l-string', type: 'trace', topic: MIX, make(r) {
    const L = randomLoop(r, { maxPasses: 5 }), front = r.chance(0.5);
    const val = L.vals.reduce((s, i) => (front ? `${i}${s}` : `${s}${i}`), '');
    return { prompt: ask('s'), var: 's', code: `String s = "";\n${body(L.head, front ? 's = i + s;' : 's = s + i;')}`, answer: val,
      explanation: front ? 'Each new number goes on the FRONT of s, so the order comes out reversed.' : 'Each pass appends i to the end of the String as text.' };
  } },
  { id: 'g-l-minus', type: 'trace', topic: ACC, make(r) {
    const n = r.int(2, 6), k = r.int(3, 15), start = r.int(50, 150), name = r.pick(NAMES);
    return { prompt: ask(name), var: name, code: `int ${name} = ${start};\n${body(`for (int i = 0; i < ${n}; i++)`, `${name} -= ${k};`)}`, answer: String(start - n * k),
      explanation: `${n} passes of -${k}: ${start} - ${n * k} = ${start - n * k}.` };
  } },
  { id: 'g-l-compound', type: 'trace', topic: F, make(r) {
    const name = r.pick(NAMES);
    let x = r.int(5, 30);
    const lines = [`int ${name} = ${x};`];
    for (let k = 0; k < r.int(3, 4); k++) {
      const op = r.pick(['++', '--', '+=', '-=']), v = r.int(2, 9);
      if (op === '++') { x++; lines.push(`${name}++;`); } else if (op === '--') { x--; lines.push(`${name}--;`); }
      else if (op === '+=') { x += v; lines.push(`${name} += ${v};`); } else { x -= v; lines.push(`${name} -= ${v};`); }
    }
    return { prompt: ask(name), var: name, code: lines.join('\n'), answer: String(x),
      explanation: `++ adds 1, -- subtracts 1, += n adds n and -= n subtracts n, each applied in order. ${name} ends at ${x}.` };
  } },
  { id: 'g-l-nobrace-trace', type: 'trace', topic: SCOPE, make(r) {
    const L = randomLoop(r, { maxPasses: 6 }), askY = r.chance(0.6);
    return { prompt: ask(askY ? 'y' : 'x'), var: askY ? 'y' : 'x', code: `int x = 0;\nint y = 0;\n${L.head}\n    x++;\n    y++;`,
      answer: String(askY ? 1 : L.vals.length),
      explanation: `Without braces only x++ is inside the loop (${L.vals.length} times). y++ runs once afterwards, however it's indented.` };
  } },

  // ---------- find the broken line ----------
  { id: 'g-lb-scope', type: 'bug', topic: SCOPE, make(r) {
    const L = randomLoop(r), name = r.pick(NAMES);
    const lines = [{ src: `int ${name} = 0;` }, { src: `${L.head} {` }, { src: `    ${name} += i;` }, { src: '}' },
      { src: `System.out.println(${name} + " " + i);`, bad: true }];
    return { prompt: "Which line won't compile?", ...program(r, lines, 0), explanation: 'i is declared in the for( ), so it only exists inside the loop. After the closing brace the name is gone.' };
  } },
  { id: 'g-lb-header', type: 'bug', topic: ERR, make(r) {
    const name = r.pick(NAMES), s = r.int(0, 5), e = s + r.int(2, 9);
    const v = r.pick([
      { h: `for (int i = ${s}, i < ${e}, i++) {`, why: 'The three parts of a for header are separated by semicolons, not commas.' },
      { h: `for (int i = ${s}; i =< ${e}; i++) {`, why: '=< isn\'t an operator. "Less than or equal" is <=.' },
      { h: `for (int i = ${e}; i => ${s}; i--) {`, why: '=> isn\'t an operator. "Greater than or equal" is >=.' },
      { h: `for (i = ${s}; i < ${e}; i++) {`, why: 'i is never declared: the init needs a type, int i = ...' },
      { h: `for (int i = ${s}; i < ${e}; i++ {`, why: 'The for header\'s ( ) is never closed.' },
    ]);
    const lines = [{ src: `int ${name} = 0;` }, { src: v.h, bad: true }, { src: `    ${name} += ${r.int(1, 5)};` }, { src: '}' }, { src: `System.out.println(${name});` }];
    return { prompt: "Which line won't compile?", ...program(r, lines, 0), explanation: v.why };
  } },
  { id: 'g-lb-uninit', type: 'bug', topic: ERR, make(r) {
    const L = randomLoop(r), name = r.pick(NAMES);
    const lines = [{ src: `int ${name};` }, { src: `${L.head} {` }, { src: `    ${name} += i;`, bad: true }, { src: '}' }];
    return { prompt: "Which line won't compile?", ...program(r, lines, 0),
      explanation: `${name} += i means ${name} = ${name} + i, but ${name} never got a starting value. Accumulators start at 0.` };
  } },
  { id: 'g-lb-zero', type: 'bug', topic: ERR, make(r) {
    const total = r.int(10, 99), k = r.int(1, 4), n = k + r.int(1, 3);
    // i - k hits 0 on the pass where i == k (the first pass when k is 0)
    const lines = [{ src: `int total = ${total};` }, { src: `for (int i = 0; i < ${n}; i++) {` },
      { src: `    System.out.println(total / (i - ${k}));`, bad: true }, { src: '}' }];
    const p = program(r, lines, 0);
    return { prompt: 'This compiles. Which line crashes when it runs?', ...p,
      explanation: `When i reaches ${k}, i - ${k} is 0 and total / 0 crashes at runtime (the earlier passes print fine). The compiler can't see it coming.` };
  } },
];
