// Problem templates for CS 209 loop scope & nested loops (lecture 10-8), mixed with earlier topics. Answers are
// computed by running the same loops in JS with Java's rules (gen-kit.js). Scope: courses/cs209.md (no while
// syntax, no if, no ==). CI samples every template and runs the Java for real.
import { idiv, jdouble, jstr, choices, program, NAMES, WORDS } from '../../gen-kit.js';

const NEST = 'Nested loops', TRI = 'Triangle (dependent) loops', SC = 'Loop variable scope', MIX = 'Nested + earlier topics';
const OUT = 'Type exactly what this prints.';
const ask = (v) => `After this runs, what is the value of ${v}?`;
const PAIRS = [['i', 'j'], ['i', 'x'], ['r', 'c'], ['row', 'col'], ['a', 'b'], ['k', 'm']];
const SYMS = ['*', '#', '+', 'o', '@'];
const ind = (lines, n = 1) => lines.map((l) => '    '.repeat(n) + l);
// outer { inner { body } after } as source lines
const nest = (outer, inner, body, after = []) =>
  [`${outer} {`, ...ind([`${inner} {`]), ...ind(body, 2), ...ind(['}']), ...ind(after), '}'].join('\n');
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, k) => a + k);
// Header counting v from s to e (inclusive), written with < or <= at random.
const upTo = (r, v, s, e) => (r.chance(0.5) ? `for (int ${v} = ${s}; ${v} < ${e + 1}; ${v}++)` : `for (int ${v} = ${s}; ${v} <= ${e}; ${v}++)`);

export default [
  // ---------- multiple choice ----------
  { id: 'g-n-total', type: 'mc', topic: NEST, make(r) {
    const [o, n] = r.pick(PAIRS), a = r.int(2, 6), b = r.int(2, 6), s = r.int(0, 1), ans = String(a * b), sym = r.pick(SYMS);
    return { prompt: `How many ${sym} symbols does this print in total?`,
      code: nest(upTo(r, o, s, s + a - 1), upTo(r, n, 1, b), [`System.out.print(${jstr(sym)});`]),
      answer: ans, choices: choices(r, ans, [String(a + b), String(a), String(b)], [String(a * b + a)]),
      explanation: `The inner loop runs all ${b} passes on EACH of the outer loop's ${a} passes: ${a} × ${b} = ${a * b}, not ${a} + ${b}.` };
  } },
  { id: 'g-n-rows', type: 'mc', topic: NEST, make(r) {
    const [o, n] = r.pick(PAIRS);
    let a, b;
    do { a = r.int(2, 6); b = r.int(2, 6); } while (a === b);
    const ans = String(a);
    return { prompt: 'How many lines (rows) does this print?',
      code: nest(upTo(r, o, 1, a), upTo(r, n, 1, b), [`System.out.print(${jstr(r.pick(SYMS))});`], ['System.out.println();']),
      answer: ans, choices: choices(r, ans, [String(b), String(a * b), '1']),
      explanation: `println() sits after the inner loop but inside the outer one, so it runs once per outer pass: ${a} rows of ${b}.` };
  } },

  // ---------- type the output ----------
  { id: 'g-n-grid', type: 'output', topic: NEST, make(r) {
    const [o, n] = r.pick(PAIRS), m = r.int(2, 3), k = r.int(2, 4), a = r.int(1, 3), sep = r.pick([',', ' ', '-']);
    const rows = range(a, a + m - 1).map((i) => range(1, k).map((j) => `${i * j}${sep}`).join(''));
    return { prompt: OUT, code: nest(upTo(r, o, a, a + m - 1), upTo(r, n, 1, k), [`System.out.print(${o} * ${n} + ${jstr(sep)});`], ['System.out.println();']),
      answer: rows.join('\n'), explanation: `Each row is one value of ${o}; across it ${n} goes 1 to ${k}. * runs before + joins the "${sep}".` };
  } },
  { id: 'g-n-print-outer', type: 'output', topic: NEST, make(r) {
    const [o, n] = r.pick(PAIRS), m = r.int(2, 4), k = r.int(2, 4), s = r.int(0, 3);
    const rows = range(s, s + m - 1).map((i) => String(i).repeat(k));
    return { prompt: OUT, code: nest(upTo(r, o, s, s + m - 1), upTo(r, n, 1, k), [`System.out.print(${o});`], ['System.out.println();']),
      answer: rows.join('\n'), explanation: `It prints ${o} (the OUTER counter), which stays the same for the whole row: each row repeats it ${k} times.` };
  } },
  { id: 'g-n-tri', type: 'output', topic: TRI, make(r) {
    const [o, n] = r.pick(PAIRS), e = r.int(3, 5), s = r.int(1, 2), sep = r.pick(['', ' ', ',']);
    const rows = range(s, e).map((i) => range(1, i).map((x) => x + sep).join(''));
    return { prompt: OUT, code: nest(upTo(r, o, s, e), `for (int ${n} = 1; ${n} <= ${o}; ${n}++)`, [sep ? `System.out.print(${n} + ${jstr(sep)});` : `System.out.print(${n});`], ['System.out.println();']),
      answer: rows.join('\n'), explanation: `The inner loop stops at ${o}, so each row is one longer: row ${o} prints 1 up to ${o}.` };
  } },
  { id: 'g-n-tri-down', type: 'output', topic: TRI, make(r) {
    const [o, n] = r.pick(PAIRS), e = r.int(3, 6), sym = r.pick(SYMS), gt = r.chance(0.5);
    const rows = range(1, e).reverse().map((i) => sym.repeat(i));
    return { prompt: OUT, code: nest(`for (int ${o} = ${e}; ${o} ${gt ? '> 0' : '>= 1'}; ${o}--)`, `for (int ${n} = 1; ${n} <= ${o}; ${n}++)`, [`System.out.print(${jstr(sym)});`], ['System.out.println();']),
      answer: rows.join('\n'), explanation: `${o} counts DOWN from ${e}, and the inner loop runs ${o} times, so the rows shrink.` };
  } },
  { id: 'g-n-add-first', type: 'output', topic: MIX, make(r) {
    const [o, n] = r.pick(PAIRS), m = r.int(2, 3), k = r.int(2, 3), s = r.int(0, 2), sep = r.pick([',', '-', ';']);
    const rows = range(s, s + m - 1).map((i) => range(1, k).map((j) => `${i + j}${sep}`).join(''));
    return { prompt: OUT, code: nest(upTo(r, o, s, s + m - 1), upTo(r, n, 1, k), [`System.out.print(${o} + ${n} + ${jstr(sep)});`], ['System.out.println();']),
      answer: rows.join('\n'), explanation: `Left to right: ${o} + ${n} are both ints, so they ADD before the String joins.` };
  } },
  { id: 'g-n-text-first', type: 'output', topic: MIX, make(r) {
    const [o, n] = r.pick(PAIRS), m = r.int(2, 3), k = r.int(2, 3), s = r.int(0, 2), sep = r.pick([',', '-', ';']);
    const rows = range(s, s + m - 1).map((i) => range(1, k).map((j) => `${i}${j}${sep}`).join(''));
    return { prompt: OUT, code: nest(upTo(r, o, s, s + m - 1), upTo(r, n, 1, k), [`System.out.print("" + ${o} + ${n} + ${jstr(sep)});`], ['System.out.println();']),
      answer: rows.join('\n'), explanation: `The "" comes first, so ${o} and ${n} are glued on as text (1 and 2 make "12", not 3).` };
  } },
  { id: 'g-n-reuse', type: 'output', topic: SC, make(r) {
    const a = r.int(2, 4), b = r.int(2, 4), w = r.pick(WORDS);
    return { prompt: OUT, code: [`for (int i = 1; i <= ${a}; i++) {`, '    System.out.print(i);', '}',
      `System.out.println(${jstr(' ' + w)});`, `for (int i = ${b}; i >= 1; i--) {`, '    System.out.print(i);', '}'].join('\n'),
      answer: `${range(1, a).join('')} ${w}\n${range(1, b).reverse().join('')}`,
      explanation: 'The first i is gone once its loop ends, so the second loop is free to declare a brand-new int i.' };
  } },

  // ---------- trace ----------
  { id: 'g-n-count', type: 'trace', topic: NEST, make(r) {
    const [o, n] = r.pick(PAIRS), a = r.int(2, 7), b = r.int(2, 7), name = r.pick(NAMES);
    return { prompt: ask(name), var: name, code: `int ${name} = 0;\n` + nest(upTo(r, o, 0, a - 1), upTo(r, n, 0, b - 1), [`${name}++;`]),
      answer: String(a * b), explanation: `Independent loops: the inner body runs ${a} × ${b} = ${a * b} times.` };
  } },
  { id: 'g-n-tri-count', type: 'trace', topic: TRI, make(r) {
    const [o, n] = r.pick(PAIRS), e = r.int(3, 8), name = r.pick(NAMES);
    return { prompt: ask(name), var: name, code: `int ${name} = 0;\n` + nest(upTo(r, o, 1, e), `for (int ${n} = 1; ${n} <= ${o}; ${n}++)`, [`${name}++;`]),
      answer: String((e * (e + 1)) / 2), explanation: `The inner loop runs ${o} times: ${range(1, e).join(' + ')} = ${(e * (e + 1)) / 2}, not ${e} × ${e}.` };
  } },
  { id: 'g-n-tri-strict', type: 'trace', topic: TRI, make(r) {
    const [o, n] = r.pick(PAIRS), e = r.int(3, 8), name = r.pick(NAMES);
    return { prompt: ask(name), var: name, code: `int ${name} = 0;\n` + nest(upTo(r, o, 1, e), `for (int ${n} = 1; ${n} < ${o}; ${n}++)`, [`${name}++;`]),
      answer: String((e * (e - 1)) / 2), explanation: `${n} < ${o} runs ${o} - 1 times (0 on the first row): ${range(0, e - 1).join(' + ')} = ${(e * (e - 1)) / 2}.` };
  } },
  { id: 'g-n-sum-outer', type: 'trace', topic: NEST, make(r) {
    const [o, n] = r.pick(PAIRS), m = r.int(2, 5), k = r.int(2, 4), s = r.int(1, 3), vals = range(s, s + m - 1), tot = vals.reduce((a, b) => a + b, 0) * k;
    return { prompt: ask('sum'), var: 'sum', code: 'int sum = 0;\n' + nest(upTo(r, o, s, s + m - 1), upTo(r, n, 1, k), [`sum += ${o};`]),
      answer: String(tot), explanation: `Each ${o} is added ${k} times (once per inner pass): ${k} × (${vals.join(' + ')}) = ${tot}.` };
  } },
  { id: 'g-n-tri-sum', type: 'trace', topic: TRI, make(r) {
    const [o, n] = r.pick(PAIRS), e = r.int(2, 5), name = r.pick(NAMES);
    const tot = range(1, e).reduce((a, i) => a + (i * (i + 1)) / 2, 0);
    return { prompt: ask(name), var: name, code: `int ${name} = 0;\n` + nest(upTo(r, o, 1, e), `for (int ${n} = 1; ${n} <= ${o}; ${n}++)`, [`${name} += ${n};`]),
      answer: String(tot), explanation: `Row ${o} adds 1 + ... + ${o}: ${range(1, e).map((i) => (i * (i + 1)) / 2).join(' + ')} = ${tot}.` };
  } },
  { id: 'g-n-avg', type: 'trace', topic: MIX, make(r) {
    const [o, n] = r.pick(PAIRS), name = r.pick(NAMES);
    let m, k, d, tot;
    do { m = r.int(2, 4); k = r.int(2, 4); d = r.pick([2, 4, 5]); tot = (m * (m + 1) / 2) * k; } while (tot % d === 0);
    return { prompt: ask('avg'), var: 'avg', code: `int ${name} = 0;\n` + nest(upTo(r, o, 1, m), upTo(r, n, 1, k), [`${name} += ${o};`]) + `\ndouble avg = ${name} / ${d}.0;`,
      answer: jdouble(tot / d), explanation: `${name} is ${tot}. ${d}.0 is a double, so this is real division and keeps the fraction: ${jdouble(tot / d)} (not ${jdouble(idiv(tot, d))}).` };
  } },

  // ---------- find the broken line ----------
  { id: 'g-nb-same-name', type: 'bug', topic: SC, make(r) {
    const [o] = r.pick(PAIRS), m = r.int(2, 5), k = r.int(2, 5), name = r.pick(NAMES);
    const lines = [{ src: `int ${name} = 0;` }, { src: `for (int ${o} = 0; ${o} < ${m}; ${o}++) {` }, { src: `    for (int ${o} = 0; ${o} < ${k}; ${o}++) {`, bad: true },
      { src: `        ${name}++;` }, { src: '    }' }, { src: '}' }];
    return { prompt: "Which line won't compile?", ...program(r, lines, 0),
      explanation: `The outer ${o} still exists inside the outer loop, so the inner loop can't declare another ${o}. Give the inner counter its own name.` };
  } },
  { id: 'g-nb-body-decl', type: 'bug', topic: SC, make(r) {
    const [o] = r.pick(PAIRS), m = r.int(2, 6), k = r.int(1, 9);
    const lines = [{ src: `for (int ${o} = 0; ${o} < ${m}; ${o}++) {` }, { src: `    int ${o} = ${k};`, bad: true }, { src: `    System.out.print(${o});` }, { src: '}' }];
    return { prompt: "Which line won't compile?", ...program(r, lines, r.int(0, 1)),
      explanation: `${o} was already declared by the for header, and the body is inside its scope: declaring int ${o} again is a duplicate.` };
  } },
  { id: 'g-nb-after', type: 'bug', topic: SC, make(r) {
    const m = r.int(2, 6), k = r.int(1, 9), name = r.pick(NAMES);
    const lines = [{ src: `int ${name} = 0;` }, { src: `for (int i = 0; i < ${m}; i++) {` }, { src: `    ${name} += i;` }, { src: '}' },
      { src: `i = ${k};`, bad: true }, { src: `System.out.println(${name});` }];
    return { prompt: "Which line won't compile?", ...program(r, lines, 0),
      explanation: `After the loop, i is gone, so i = ${k}; assigns to a variable that doesn't exist. int i = ${k}; would compile.` };
  } },
  { id: 'g-nb-inner-after', type: 'bug', topic: SC, make(r) {
    const [o, n] = r.pick(PAIRS), m = r.int(2, 4), k = r.int(2, 4);
    const lines = [{ src: `for (int ${o} = 0; ${o} < ${m}; ${o}++) {` }, { src: `    for (int ${n} = 0; ${n} < ${k}; ${n}++) {` }, { src: `        System.out.print(${jstr(r.pick(SYMS))});` },
      { src: '    }' }, { src: `    System.out.println(${n});`, bad: true }, { src: '}' }];
    return { prompt: "Which line won't compile?", ...program(r, lines, 0),
      explanation: `${n} belongs to the inner loop and is gone after its closing brace, even though we are still inside the outer loop.` };
  } },
  { id: 'g-nb-zero', type: 'bug', topic: MIX, make(r) {
    const m = r.int(2, 4), n = r.int(2, 4), t = r.int(10, 99);
    const lines = [{ src: `for (int i = 1; i <= ${m}; i++) {` }, { src: `    for (int j = 1; j <= ${n}; j++) {` },
      { src: `        System.out.print(${t} / (i - j) + " ");`, bad: true }, { src: '    }' }, { src: '}' }];
    return { prompt: 'This compiles. Which line crashes when it runs?', ...program(r, lines, 0),
      explanation: 'On the very first pass i and j are both 1, so i - j is 0 and dividing an int by 0 crashes at runtime.' };
  } },
];
