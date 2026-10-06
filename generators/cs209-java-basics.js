// Problem templates for CS 209 Java basics. Each make(r) builds one problem from random values and computes
// the answer with Java's rules (see ../gen-kit.js). Scope: courses/cs209.md (no casts, ++, if, loops).
// CI samples every template and runs the Java for real, so a wrong formula here fails the build.
import { idiv, imod, jdouble, code, jstr, choices, uneven, program, NAMES, WORDS, LETTERS } from '../gen-kit.js';

const RUN = 'How Java runs', PRINT = 'Printing & concatenation', ESC = 'Escape sequences',
  VARS = 'Variables & types', ARITH = 'Arithmetic & division', ERR = 'Finding errors';
const OUT = 'Type exactly what this prints.';
const println = (expr) => `System.out.println(${expr});`;
export default [
  // ---------- type the output ----------
  { id: 'g-concat-mid', type: 'output', topic: PRINT, make(r) {
    const [a, b, c, d] = [r.int(1, 30), r.int(1, 30), r.int(1, 30), r.int(1, 30)], w = r.pick(WORDS);
    return { prompt: OUT, code: println(`${a} + ${b} + ${jstr(w)} + ${c} + ${d}`), answer: `${a + b}${w}${c}${d}`,
      explanation: `${a} + ${b} = ${a + b} is real addition (no String yet). Once "${w}" joins, ${c} and ${d} are appended as text.` };
  } },
  { id: 'g-str-first', type: 'output', topic: PRINT, make(r) {
    const [a, b] = [r.int(1, 40), r.int(1, 40)], w = r.pick(WORDS);
    return { prompt: OUT, code: println(`${jstr(w + ' ')} + ${a} + ${b}`), answer: `${w} ${a}${b}`,
      explanation: `The String comes first, so ${a} and ${b} are each appended as text, not added (${a + b} would be the trap).` };
  } },
  { id: 'g-paren', type: 'output', topic: PRINT, make(r) {
    const [a, b] = [r.int(1, 50), r.int(1, 50)], w = r.pick(WORDS);
    return { prompt: OUT, code: println(`${jstr(w + ': ')} + (${a} + ${b})`), answer: `${w}: ${a + b}`,
      explanation: `Parentheses go first, so ${a} + ${b} = ${a + b} is added before it's joined to the text.` };
  } },
  { id: 'g-mult-first', type: 'output', topic: PRINT, make(r) {
    const [a, b, c] = [r.int(2, 12), r.int(2, 12), r.int(1, 9)], w = r.pick(WORDS);
    return { prompt: OUT, code: println(`${jstr(w)} + ${a} * ${b} + ${c}`), answer: `${w}${a * b}${c}`,
      explanation: `* happens before +, so ${a} * ${b} = ${a * b} first. Then left to right: "${w}" + ${a * b} is text, and + ${c} appends ${c}.` };
  } },
  { id: 'g-intdiv', type: 'output', topic: ARITH, make(r) {
    const [a, b] = uneven(r, 10, 99, 2, 9);
    return { prompt: OUT, code: println(`${a} / ${b}`), answer: String(idiv(a, b)),
      explanation: `int / int gives an int: ${a} / ${b} is ${(a / b).toFixed(2)}… on paper, but the fraction is dropped (not rounded), leaving ${idiv(a, b)}.` };
  } },
  { id: 'g-mod', type: 'output', topic: ARITH, make(r) {
    const a = r.int(5, 99), b = r.int(2, 12);
    return { prompt: OUT, code: println(`${a} % ${b}`), answer: String(imod(a, b)),
      explanation: `${b} goes into ${a} ${idiv(a, b)} times (${idiv(a, b) * b}), leaving a remainder of ${imod(a, b)}.` };
  } },
  { id: 'g-div-mod', type: 'output', topic: ARITH, make(r) {
    const [a, b] = uneven(r, 10, 99, 2, 9);
    return { prompt: OUT, code: println(`${a} / ${b} + ${a} % ${b}`), answer: String(idiv(a, b) + imod(a, b)),
      explanation: `${a} / ${b} = ${idiv(a, b)} (integer division) and ${a} % ${b} = ${imod(a, b)}, so ${idiv(a, b)} + ${imod(a, b)} = ${idiv(a, b) + imod(a, b)}.` };
  } },
  { id: 'g-dbl-div', type: 'output', topic: ARITH, make(r) {
    const b = r.pick([2, 4, 5, 8]), a = r.int(1, 99);
    return { prompt: OUT, code: println(`${a} / ${b}.0`), answer: jdouble(a / b),
      explanation: `${b}.0 is a double, so the division keeps its fraction and prints as a double: ${jdouble(a / b)}.` };
  } },
  { id: 'g-char-plus', type: 'output', topic: VARS, make(r) {
    const L = r.pick(LETTERS), n = r.int(1, 9);
    return { prompt: OUT, code: `char c = '${L}';\n${println(`c + ${n}`)}`, answer: String(code(L) + n),
      explanation: `char + int is math on the char's code: '${L}' is ${code(L)}, so ${code(L)} + ${n} = ${code(L) + n}. No String is involved, so it stays a number.` };
  } },
  { id: 'g-char-str', type: 'output', topic: VARS, make(r) {
    const L = r.pick(LETTERS), n = r.int(1, 9);
    return { prompt: OUT, code: `char c = '${L}';\n${println(`"" + c + ${n}`)}`, answer: `${L}${n}`,
      explanation: `Starting with "" makes everything after it text, so the char prints as ${L} and ${n} is appended (not ${code(L) + n}).` };
  } },
  { id: 'g-escape', type: 'output', topic: ESC, make(r) {
    const seg = {
      word: () => { const w = r.pick(WORDS); return { src: w, out: w }; },
      newline: () => ({ src: '\\n', out: '\n' }),
      quoted: () => { const w = r.pick(WORDS); return { src: `\\"${w}\\"`, out: `"${w}"` }; },
      slash: () => ({ src: '\\\\', out: '\\' }),
      space: () => ({ src: ' ', out: ' ' }),
    };
    const middle = r.sample(['newline', 'quoted', 'slash', 'space', 'newline', 'quoted'], r.int(2, 3)).map((k) => seg[k]());
    const parts = [seg.word(), ...middle, seg.word()];
    return { prompt: OUT, code: println(`"${parts.map((p) => p.src).join('')}"`), answer: parts.map((p) => p.out).join(''),
      explanation: 'Read escapes in pairs: \\n is a new line, \\" is a quote character, and \\\\ is one backslash.' };
  } },
  { id: 'g-print-seq', type: 'output', topic: PRINT, make(r) {
    const steps = r.sample(WORDS, 3).map((w) => ({ w, ln: r.chance(0.5) }));
    return { prompt: OUT, code: steps.map((s) => `System.out.${s.ln ? 'println' : 'print'}(${jstr(s.w)});`).join('\n'),
      answer: steps.map((s) => s.w + (s.ln ? '\n' : '')).join('').replace(/\n+$/, ''),
      explanation: 'print leaves the cursor on the same line; println ends the line after printing, so the NEXT output starts on a new line.' };
  } },
  { id: 'g-time', type: 'output', topic: ARITH, make(r) {
    const t = r.int(100, 9999);
    return { prompt: OUT, code: `int s = ${t};\n${println(`s / 60 + "m " + s % 60 + "s"`)}`, answer: `${idiv(t, 60)}m ${imod(t, 60)}s`,
      explanation: `${t} / 60 = ${idiv(t, 60)} full minutes, and ${t} % 60 = ${imod(t, 60)} seconds left over. The divisions happen before any + joins text.` };
  } },
  { id: 'g-precedence', type: 'output', topic: ARITH, make(r) {
    const a = r.int(1, 20), b = r.int(2, 9), c = r.int(2, 9), d = r.int(3, 11);
    return { prompt: OUT, code: println(`${a} + ${b} * ${c} % ${d}`), answer: String(a + imod(b * c, d)),
      explanation: `* and % share a level and go left to right before +: ${b} * ${c} = ${b * c}, ${b * c} % ${d} = ${imod(b * c, d)}, then ${a} + ${imod(b * c, d)} = ${a + imod(b * c, d)}.` };
  } },

  // ---------- trace the variable ----------
  { id: 'g-copy', type: 'trace', topic: VARS, make(r) {
    const [x, y] = r.sample(NAMES, 2), [a, b] = [r.int(1, 50), r.int(51, 99)];
    return { prompt: `After this runs, what is the value of ${y}?`, var: y, code: `int ${x} = ${a};\nint ${y} = ${x};\n${x} = ${b};`, answer: String(a),
      explanation: `${y} = ${x} copies the value ${a} into ${y}'s own storage. Changing ${x} to ${b} afterwards doesn't touch ${y}.` };
  } },
  { id: 'g-reassign', type: 'trace', topic: VARS, make(r) {
    const n = r.pick(NAMES), a = r.int(2, 15), k = r.int(2, 5);
    return { prompt: `After this runs, what is the value of ${n}?`, var: n, code: `int ${n} = ${a};\n${n} = ${n} * ${k} + ${n};`, answer: String(a * k + a),
      explanation: `The right side uses the OLD value: ${a} * ${k} + ${a} = ${a * k + a}. Only then is it stored back into ${n}.` };
  } },
  { id: 'g-avg', type: 'trace', topic: ARITH, make(r) {
    let s;
    do { s = [r.int(60, 100), r.int(60, 100), r.int(60, 100)]; } while ((s[0] + s[1] + s[2]) % 3 === 0);
    const sum = s[0] + s[1] + s[2];
    return { prompt: 'After this runs, what is the value of avg?', var: 'avg', code: `int sum = ${s.join(' + ')};\ndouble avg = sum / 3;`, answer: jdouble(idiv(sum, 3)),
      explanation: `${sum} / 3 is int / int = ${idiv(sum, 3)}, and the fraction is lost BEFORE it reaches the double, so avg is ${jdouble(idiv(sum, 3))}. Writing sum / 3.0 would keep it.` };
  } },
  { id: 'g-dbl-int', type: 'trace', topic: ARITH, make(r) {
    const [a, b] = uneven(r, 10, 60, 3, 9), k = r.int(2, 4);
    return { prompt: 'After this runs, what is the value of x?', var: 'x', code: `double x = ${a} / ${b};\nx = x * ${k};`, answer: jdouble(idiv(a, b) * k),
      explanation: `${a} / ${b} = ${idiv(a, b)} (integer division), stored as ${jdouble(idiv(a, b))}. Then ${jdouble(idiv(a, b))} * ${k} = ${jdouble(idiv(a, b) * k)}.` };
  } },
  { id: 'g-str-append', type: 'trace', topic: PRINT, make(r) {
    const w = r.pick(WORDS), [a, b] = [r.int(1, 9), r.int(1, 9)];
    return { prompt: 'After this runs, what is the value of s?', var: 's', code: `String s = ${jstr(w)};\ns = s + ${a} + ${b};`, answer: `${w}${a}${b}`,
      explanation: `s is a String, so + ${a} + ${b} appends text twice: ${w}${a}${b}, not ${w}${a + b}.` };
  } },
  { id: 'g-char-code', type: 'trace', topic: VARS, make(r) {
    const L = r.pick(LETTERS), n = r.int(1, 9);
    return { prompt: 'After this runs, what is the value of n?', var: 'n', code: `char letter = '${L}';\nint n = letter + ${n};`, answer: String(code(L) + n),
      explanation: `'${L}' is ${code(L)}, so ${code(L)} + ${n} = ${code(L) + n}. It's stored in an int, so it stays a number.` };
  } },
  { id: 'g-mod-div', type: 'trace', topic: ARITH, make(r) {
    const a = r.int(10, 99), k = r.int(3, 9);
    return { prompt: 'After this runs, what is the value of x?', var: 'x', code: `int x = ${a};\nx = x % ${k} + x / ${k};`, answer: String(imod(a, k) + idiv(a, k)),
      explanation: `Both parts use the old x (${a}): ${a} % ${k} = ${imod(a, k)} and ${a} / ${k} = ${idiv(a, k)}, so x becomes ${imod(a, k) + idiv(a, k)}.` };
  } },
  { id: 'g-swap', type: 'trace', topic: VARS, make(r) {
    const [x, y] = r.sample(NAMES, 2), [a, b] = [r.int(1, 49), r.int(50, 99)], ask = r.pick([x, y]);
    return { prompt: `After this runs, what is the value of ${ask}?`, var: ask, code: `int ${x} = ${a};\nint ${y} = ${b};\n${x} = ${y};\n${y} = ${x};`, answer: String(b),
      explanation: `After ${x} = ${y}, both hold ${b} and the ${a} is gone for good, so ${y} = ${x} just copies ${b} back. Swapping needs a third, temporary variable.` };
  } },

  // ---------- find the broken line ----------
  { id: 'g-bug-lossy', type: 'bug', topic: ERR, make(r) {
    const [i, d, t] = r.sample(NAMES, 3);
    const decls = r.shuffle([{ src: `int ${i} = ${r.int(1, 40)};` }, { src: `double ${d} = ${r.int(1, 9)}.${r.int(1, 9)};` }]);
    const p = program(r, [...decls, { src: `int ${t} = ${i} + ${d};`, bad: true }, { src: println(t) }]);
    return { prompt: "Which line won't compile?", ...p, explanation: `${i} + ${d} is a double (int + double), and a double can't go into an int without losing data.` };
  } },
  { id: 'g-bug-semi', type: 'bug', topic: ERR, make(r) {
    const [a, b] = r.sample(NAMES, 2);
    const lines = [{ src: `int ${a} = ${r.int(1, 50)};` }, { src: `int ${b} = ${a} * ${r.int(2, 5)};` }, { src: println(`${jstr(r.pick(WORDS) + ' ')} + ${b}`) }];
    const k = r.int(0, lines.length - 1);
    lines[k] = { src: lines[k].src.replace(/;$/, ''), bad: true };
    return { prompt: "Which line won't compile?", ...program(r, lines, 0), explanation: 'One statement is missing its semicolon. That\'s a syntax error, caught at compile time.' };
  } },
  { id: 'g-bug-uninit', type: 'bug', topic: ERR, make(r) {
    const [a, b] = r.sample(NAMES, 2);
    const p = program(r, [{ src: `int ${a} = ${r.int(1, 50)};` }, { src: `int ${b};` }, { src: println(a) }, { src: println(`${a} + ${b}`), bad: true }]);
    return { prompt: "Which line won't compile?", ...p, explanation: `${b} is declared but never given a value. Declaring it is fine; USING it before it has a value is the error.` };
  } },
  { id: 'g-bug-case', type: 'bug', topic: ERR, make(r) {
    const n = r.pick(NAMES), N = n[0].toUpperCase() + n.slice(1);
    const p = program(r, [{ src: `int ${n} = ${r.int(1, 50)};` }, { src: println(`${N} + ${r.int(1, 9)}`), bad: true }]);
    return { prompt: "Which line won't compile?", ...p, explanation: `Java is case-sensitive: ${N} and ${n} are different names, and ${N} was never declared.` };
  } },
  { id: 'g-bug-str-minus', type: 'bug', topic: ERR, make(r) {
    const n = r.pick(NAMES), w = r.pick(WORDS);
    const p = program(r, [{ src: `int ${n} = ${r.int(10, 90)};` }, { src: println(`${jstr(w + ': ')} + ${n} - ${r.int(1, 9)}`), bad: true }]);
    return { prompt: "Which line won't compile?", ...p, explanation: `"${w}: " + ${n} is already a String, and you can't subtract from a String. Parentheses fix it: "${w}: " + (${n} - …).` };
  } },
  { id: 'g-bug-zero', type: 'bug', topic: ERR, make(r) {
    const [t, p, e] = r.sample(NAMES, 3), small = r.int(1, 9), big = r.int(small + 1, 20);
    const prog = program(r, [{ src: `int ${t} = ${r.int(10, 99)};` }, { src: `int ${p} = ${small} / ${big};` }, { src: `int ${e} = ${t} / ${p};`, bad: true }, { src: println(e) }]);
    return { prompt: 'This compiles. Which line crashes when it runs?', ...prog,
      explanation: `${small} / ${big} is integer division = 0, so ${p} is 0 and ${t} / ${p} divides by zero. The compiler can't see that coming; it crashes at runtime.` };
  } },
  { id: 'g-bug-quotes', type: 'bug', topic: ERR, make(r) {
    const n = r.pick(NAMES), w = r.pick(WORDS), L = r.pick(LETTERS);
    const bad = r.chance(0.5) ? { src: `String ${n} = '${w}';`, why: 'Single quotes hold exactly one char; a String needs double quotes.' }
      : { src: `char ${n} = "${L}";`, why: 'Double quotes make a String, even for one letter. A char needs single quotes.' };
    const p = program(r, [{ src: `int x = ${r.int(1, 9)};` }, { src: bad.src, bad: true }, { src: println(`x + " " + ${n}`) }]);
    return { prompt: "Which line won't compile?", ...p, explanation: bad.why };
  } },
  { id: 'g-bug-dbl-div', type: 'bug', topic: ERR, make(r) {
    const [n, m] = r.sample(NAMES, 2), [a, b] = [r.int(5, 50), r.int(2, 9)];
    const p = program(r, [{ src: `double ${m} = ${a};` }, { src: `int ${n} = ${a}.0 / ${b};`, bad: true }, { src: println(`${m} + ${n}`) }]);
    return { prompt: "Which line won't compile?", ...p, explanation: `${a}.0 / ${b} is a double, which can't be stored in an int. (double ${m} = ${a}; is fine: it becomes ${a}.0.)` };
  } },

  // ---------- multiple choice ----------
  { id: 'g-mc-concat', type: 'mc', topic: PRINT, make(r) {
    const [a, b, c] = [r.int(1, 20), r.int(1, 20), r.int(1, 20)], w = r.pick(WORDS), ans = `${a + b}${w}${c}`;
    return { prompt: 'What does this print?', code: println(`${a} + ${b} + ${jstr(w)} + ${c}`), answer: ans, run: true,
      choices: choices(r, ans, [`${a}${b}${w}${c}`, `${a + b + c}${w}`, `${w}${a + b + c}`], [`${a + b}${w}${c + 1}`]),
      explanation: `Left to right: ${a} + ${b} = ${a + b} (numbers), then "${w}" makes the rest text, so ${c} is appended.` };
  } },
  { id: 'g-mc-store', type: 'mc', topic: ARITH, make(r) {
    const [a, b] = uneven(r, 10, 60, 3, 9), ans = jdouble(idiv(a, b));
    return { prompt: 'What does this print?', code: `int x = ${a};\ndouble y = x / ${b};\n${println('y')}`, answer: ans, run: true,
      choices: choices(r, ans, [String(a / b), String(idiv(a, b)), 'Compile error']),
      explanation: `x / ${b} is int / int = ${idiv(a, b)} BEFORE it's stored; storing ${idiv(a, b)} in a double prints ${ans}.` };
  } },
  { id: 'g-mc-prec', type: 'mc', topic: ARITH, make(r) {
    const a = r.int(2, 20), b = r.int(5, 30), c = r.int(2, 7), ans = String(a + imod(b, c));
    return { prompt: 'What does this print?', code: println(`${a} + ${b} % ${c}`), answer: ans, run: true,
      choices: choices(r, ans, [String(imod(a + b, c)), String(a + b), String(a + idiv(b, c))], [String(a + imod(b, c) + 1)]),
      explanation: `% goes before +: ${b} % ${c} = ${imod(b, c)}, then ${a} + ${imod(b, c)} = ${ans}.` };
  } },
  { id: 'g-mc-chars', type: 'mc', topic: VARS, make(r) {
    const [L1, L2] = r.sample(LETTERS, 2), w = r.pick(WORDS), ans = `${code(L1) + code(L2)}${w}`;
    return { prompt: 'What does this print?', code: println(`'${L1}' + '${L2}' + ${jstr(w)}`), answer: ans, run: true,
      choices: choices(r, ans, [`${L1}${L2}${w}`, `${w}${code(L1) + code(L2)}`, `${code(L1)}${code(L2)}${w}`]),
      explanation: `Two chars added are numbers: ${code(L1)} + ${code(L2)} = ${code(L1) + code(L2)}. Only then does "${w}" turn it into text.` };
  } },
  { id: 'g-mc-decl', type: 'mc', topic: VARS, make(r) {
    const n = r.pick(NAMES), a = r.int(2, 99), L = r.pick(LETTERS);
    const good = `double ${n} = ${a};`;
    const bad = r.sample([`int ${n} = ${a}.${r.int(1, 9)};`, `char ${n} = "${L}";`, `boolean ${n} = ${r.int(0, 1)};`, `String ${n} = ${a};`, `int ${n} = "${a}";`], 3);
    return { prompt: 'Which declaration compiles?', answer: good, check: 'compiles', choices: choices(r, good, bad),
      explanation: `A whole number fits in a double (it becomes ${a}.0). A fraction can't go into an int, quotes make a String, and a boolean is only true or false.` };
  } },
];
