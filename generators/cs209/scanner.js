// Problem templates for CS 209 Scanner input and String methods (lecture 10-27), mixed with earlier topics.
// Answers are computed in JS with Java's rules; `input` is what the user types (CI feeds it to the real program).
// Scope: courses/cs209.md (no if, no ==, no charAt, no overloading, nothing about leftover newlines).
import { idiv, imod, jdouble, jstr, choices, program } from '../../gen-kit.js';

const SETUP = 'Scanner setup', READ = 'Scanner read methods', TOK = 'Tokens', ERR = 'Input errors', STR = 'String methods',
  SUB = 'substring', IDX = 'indexOf', KEEP = 'Strings are not changed', MINT = 'Math.min', MIX = 'Input + earlier topics';
const OUT = 'Type exactly what this prints.';
const SCN = ['console', 'scan', 'sc', 'input'];
const DISTINCT = ['planet', 'rocket', 'pencil', 'garden', 'purple', 'castle', 'bridge', 'flower', 'candle', 'winter', 'monkey', 'jungle'];
const REPEAT = ['banana', 'balloon', 'coffee', 'pepper', 'letter', 'bubble', 'tomato', 'summer', 'rabbit', 'puzzle', 'kitten', 'mississippi', 'address', 'coconut', 'success', 'parallel', 'cannon'];
const FIRST = ['Mia', 'Leo', 'Ava', 'Sam', 'Zoe', 'Kai', 'Eli', 'Ivy', 'Max', 'Ada', 'Noah', 'Luna'];
const LAST = ['Lopez', 'Smith', 'Chen', 'Patel', 'Brown', 'Garcia', 'Kim', 'Nguyen'];
const ANY = [...DISTINCT, ...REPEAT];
const VARS = ['word', 'text', 'name', 'title', 'label'];

const head = (s) => ['import java.util.*;', `Scanner ${s} = new Scanner(System.in);`];
const src = (...ls) => ls.join('\n');
const typed = (lines) => ` Input (↵ = Enter): ${lines.join(' ↵ ')} ↵`;
// problem fields shared by every instance that reads input
const inp = (prompt, lines) => ({ prompt: prompt + typed(lines), input: lines.join('\n') });
// the same tokens on one line or spread over several lines (tokens ignore line breaks)
const lay = (r, toks) => (r.chance(0.4) ? toks.map(String) : [toks.join(' ')]);
// bug programs: fillers go below the import + Scanner lines (an import must stay first)
const withHead = (r, s, lines) => { const p = program(r, lines); return { code: [...head(s), p.code].join('\n'), answer: p.answer + 2 }; };
const cut = (r, toks) => { const k = r.int(1, toks.length - 1); return [toks.slice(0, k).join(' '), toks.slice(k).join(' ')]; };

export default [
  // ---------- multiple choice ----------
  { id: 'g-s-sum-ints', type: 'mc', topic: READ, run: true, make(r) {
    const s = r.pick(SCN), a = r.int(2, 19), b = r.int(2, 19), form = r.int(0, 2);
    const expr = ['x + y', '"" + x + y', 'x + y + "!"'][form];
    const ans = [String(a + b), `${a}${b}`, `${a + b}!`][form];
    const dist = [[`${a}${b}`, String(a * b), `${a} ${b}`], [String(a + b), String(a * b), `${a} ${b}`], [`${a}${b}!`, `${a} ${b}!`, String(a + b)]][form];
    return { ...inp('What does this print?', r.chance(0.5) ? [`${a} ${b}`] : [String(a), String(b)]),
      code: src(...head(s), `int x = ${s}.nextInt();`, `int y = ${s}.nextInt();`, `System.out.println(${expr});`),
      answer: ans, choices: choices(r, ans, dist),
      explanation: [`nextInt() reads two int tokens, so x + y is addition: ${a} + ${b} = ${a + b}. The typed text is never echoed by println.`,
        `"" + x + y starts with a String, so everything after it is concatenation: ${a}${b}, not ${a + b}.`,
        `x + y is added first (${a + b}) and only then joined to "!". The input is not echoed.`][form] };
  } },
  { id: 'g-s-token-count', type: 'mc', topic: TOK, make(r) {
    const k = r.int(3, 6), toks = Array.from({ length: k }, () => (r.chance(0.5) ? String(r.int(1, 99)) : r.pick(ANY)));
    let line = ' '.repeat(r.int(0, 2)), spaces = line.length;
    toks.forEach((t, i) => { const g = i < k - 1 ? r.int(1, 3) : r.int(0, 2); line += t + ' '.repeat(g); spaces += g; });
    const ans = String(k);
    return { prompt: `How many tokens can a Scanner read from this line? (« » mark where the line starts and ends)  Input (↵ = Enter): «${line}» ↵`,
      answer: ans, choices: choices(r, ans, [String(spaces), String(k + 1), String(k - 1), String(k * 2)]),
      explanation: `A token is a run of characters between whitespace, however many spaces separate them: ${k} tokens. Counting spaces, or the gaps, is the trap.` };
  } },
  { id: 'g-s-next-vs-nextline', type: 'mc', topic: READ, run: true, make(r) {
    const s = r.pick(SCN), n = r.int(2, 4), words = r.sample(ANY, n), all = words.join(' '), whole = r.chance(0.5);
    const ans = String(whole ? all.length : words[0].length);
    return { ...inp('What does this print?', [all]),
      code: src(...head(s), `String t = ${s}.${whole ? 'nextLine' : 'next'}();`, 'System.out.println(t.length());'),
      answer: ans, choices: choices(r, ans, [String(whole ? words[0].length : all.length), String(n), String(all.length - 1), String(words[0].length + 1)]),
      explanation: whole ? `nextLine() takes the whole line "${all}", spaces included: ${all.length} characters.`
        : `next() takes only the first token "${words[0]}" (${words[0].length} characters). The rest of the line is still waiting.` };
  } },
  { id: 'g-s-substring-mc', type: 'mc', topic: SUB, run: true, make(r) {
    const w = r.pick(DISTINCT), i = r.int(1, 2), j = r.int(i + 2, w.length - 1), v = r.pick(VARS), ans = w.slice(i, j);
    const d = [w.slice(i, j + 1), w.slice(i - 1, j), w.slice(i - 1, j - 1), w.slice(i + 1, j)].filter((x) => x !== ans);
    return { prompt: 'What does this print?',
      code: src(`String ${v} = ${jstr(w)};`, `System.out.println(${v}.substring(${i}, ${j}));`),
      answer: ans, choices: choices(r, ans, d),
      explanation: `Indexes start at 0 and substring(${i}, ${j}) stops one before ${j}: positions ${i} to ${j - 1}, which is "${ans}". Including position ${j}, or counting from 1, are the traps.` };
  } },
  { id: 'g-s-immutable-mc', type: 'mc', topic: KEEP, run: true, make(r) {
    const w = r.pick(ANY), v = r.pick(VARS), k = r.int(1, 3), up = r.chance(0.5);
    const stmt = up ? `${v}.toUpperCase();` : `${v}.substring(${k});`;
    const ans = w;
    return { prompt: 'What does this print?',
      code: src(`String ${v} = ${jstr(w)};`, stmt, `System.out.println(${v});`),
      answer: ans, choices: choices(r, ans, [up ? w.toUpperCase() : w.slice(k), w.toUpperCase(), w.slice(k), w.slice(0, k)]),
      explanation: `String methods return a new String and never change the variable. The result of ${stmt.slice(0, -1)} is thrown away, so ${v} is still ${w}.` };
  } },
  { id: 'g-s-indexof-mc', type: 'mc', topic: IDX, run: true, make(r) {
    const w = r.pick(REPEAT), v = r.pick(VARS), rep = [...new Set(w)].filter((c) => w.split(c).length > 2), c = r.pick(rep);
    const ans = String(w.indexOf(c));
    return { prompt: 'What does this print?',
      code: src(`String ${v} = ${jstr(w)};`, `System.out.println(${v}.indexOf(${jstr(c)}));`),
      answer: ans, choices: choices(r, ans, [String(w.indexOf(c) + 1), String(w.lastIndexOf(c)), String(w.lastIndexOf(c) + 1), String(w.length)]),
      explanation: `indexOf gives the position of the FIRST "${c}" and positions start at 0: ${w.indexOf(c)}. Counting from 1, or using a later "${c}", are the traps.` };
  } },
  { id: 'g-s-min-mc', type: 'mc', topic: MINT, run: true, make(r) {
    const w = r.pick([...ANY, ...FIRST]), v = r.pick(VARS), k = r.int(3, 8), ans = String(Math.min(k, w.length));
    return { prompt: 'What does this print?',
      code: src(`String ${v} = ${jstr(w)};`, `System.out.println(Math.min(${k}, ${v}.length()));`),
      answer: ans, choices: choices(r, ans, [String(Math.max(k, w.length)), String(k), String(w.length), String(k + w.length), String(Math.abs(k - w.length))]),
      explanation: `Math.min picks the smaller of ${k} and the length ${w.length}, so ${ans}. It is not the length every time.` };
  } },
  { id: 'g-s-substring-which', type: 'mc', topic: SUB, make(r) {
    const w = r.pick(DISTINCT), v = r.pick(VARS), i = r.int(0, 2), j = r.int(i + 2, w.length - 1), t = w.slice(i, j);
    const ok = (a, b) => a >= 0 && b <= w.length && a < b && w.slice(a, b) !== t;
    const ans = `${v}.substring(${i}, ${j})`;
    const d = [[i, j - 1], [i + 1, j], [i, j + 1], [i + 1, j + 1], [i - 1, j]].filter(([a, b]) => ok(a, b)).map(([a, b]) => `${v}.substring(${a}, ${b})`);
    return { prompt: `${v} holds ${jstr(w)}. Which expression gives ${jstr(t)}?`,
      answer: ans, choices: choices(r, ans, d),
      explanation: `${jstr(t)} sits at positions ${i} to ${j - 1} (the first position is 0). substring(start, end) stops one BEFORE end, so end is ${j}.` };
  } },
  { id: 'g-s-rest-len', type: 'mc', topic: SUB, run: true, make(r) {
    const w = r.pick(ANY), v = r.pick(VARS), k = r.int(1, 4), ans = String(w.length - k);
    return { prompt: 'What does this print?',
      code: src(`String ${v} = ${jstr(w)};`, `System.out.println(${v}.substring(${k}).length());`),
      answer: ans, choices: choices(r, ans, [String(w.length - k + 1), String(w.length - k - 1), String(k), String(w.length)]),
      explanation: `substring(${k}) with one number keeps everything from position ${k} to the end: ${w.length} - ${k} = ${w.length - k} characters.` };
  } },

  // ---------- type the output ----------
  { id: 'g-s-out-prompt-concat', type: 'output', topic: MIX, make(r) {
    const s = r.pick(SCN), a = r.int(2, 9), b = r.int(2, 9), form = r.int(0, 1), lab = r.pick(['Total: ', 'Sum = ', 'Result: ']);
    const line = form === 0 ? `${lab}${a}${b}` : `${a + b} total`;
    return { ...inp(OUT, lay(r, [a, b])),
      code: src(...head(s), 'System.out.print("Enter two numbers: ");', `int a = ${s}.nextInt();`, `int b = ${s}.nextInt();`,
        form === 0 ? `System.out.println(${jstr(lab)} + a + b);` : 'System.out.println(a + b + " total");'),
      answer: `Enter two numbers: ${line}`,
      explanation: form === 0 ? `print leaves the cursor on the same line, so the result follows the prompt. ${jstr(lab)} + a is a String, so + b is joined too: ${a}${b}.`
        : `print leaves the cursor on the same line. a + b is added first (${a + b}) because no String comes before it, then " total" is joined.` };
  } },
  { id: 'g-s-out-two-tokens', type: 'output', topic: READ, make(r) {
    const s = r.pick(SCN), f = r.pick(FIRST), l = r.pick(LAST), age = r.int(15, 60);
    return { ...inp(OUT, [`${f} ${l} ${age}`]),
      code: src(...head(s), `String a = ${s}.next();`, `String b = ${s}.next();`, 'System.out.println(b.toUpperCase() + ", " + a);'),
      answer: `${l.toUpperCase()}, ${f}`,
      explanation: `next() reads one token at a time: a is ${f}, b is ${l}. The age is never read, so it is ignored.` };
  } },
  { id: 'g-s-out-split', type: 'output', topic: IDX, make(r) {
    const s = r.pick(SCN), [w1, w2] = r.sample(ANY, 2), sep = r.pick(['-', '+', '/', '|']);
    const sp = w1.length;
    return { ...inp(OUT, [`${w1} ${w2}`]),
      code: src(...head(s), `String line = ${s}.nextLine();`, 'int sp = line.indexOf(" ");', `System.out.println(line.substring(sp + 1) + ${jstr(sep)} + line.substring(0, sp));`),
      answer: `${w2}${sep}${w1}`,
      explanation: `The space is at position ${sp}. substring(sp + 1) starts just after it (${w2}); substring(0, sp) stops before it (${w1}). The two halves print swapped.` };
  } },
  { id: 'g-s-out-loop-sum', type: 'output', topic: MIX, make(r) {
    const s = r.pick(SCN), n = r.int(3, 5);
    let vals, sum;
    do { vals = Array.from({ length: n }, () => r.int(5, 40)); sum = vals.reduce((x, y) => x + y, 0); } while (sum % n === 0);
    return { ...inp(OUT, lay(r, vals)),
      code: src(...head(s), 'int sum = 0;', `for (int i = 1; i <= ${n}; i++) {`, `    sum += ${s}.nextInt();`, '}', 'System.out.println("Average: " + sum / ' + n + ');'),
      answer: `Average: ${idiv(sum, n)}`,
      explanation: `The loop reads ${n} tokens: sum is ${sum}. int / int drops the fraction: ${sum} / ${n} = ${idiv(sum, n)}, not ${(sum / n).toFixed(1)}.` };
  } },
  { id: 'g-s-out-original-kept', type: 'output', topic: KEEP, make(r) {
    const s = r.pick(SCN), w = r.pick(ANY), k = r.int(1, 3);
    return { ...inp(OUT, [w]),
      code: src(...head(s), `String w = ${s}.next();`, 'String big = w.toUpperCase();', `String tail = w.substring(${k});`, 'System.out.println(w + " " + big + " " + tail);'),
      answer: `${w} ${w.toUpperCase()} ${w.slice(k)}`,
      explanation: `toUpperCase() and substring(${k}) hand back new Strings; w itself is never changed, so it prints as typed (${w}).` };
  } },
  { id: 'g-s-out-min-cut', type: 'output', topic: MINT, make(r) {
    const s = r.pick(SCN), w = r.pick([...FIRST, ...LAST, ...ANY]), k = r.int(3, 5), n = Math.min(k, w.length);
    return { ...inp(OUT, [w]),
      code: src(...head(s), `String w = ${s}.next();`, `int n = Math.min(${k}, w.length());`, 'System.out.println(w.substring(0, n));'),
      answer: w.slice(0, n),
      explanation: `w.length() is ${w.length}, so n = Math.min(${k}, ${w.length}) = ${n}. Math.min keeps substring from running past a short word.` };
  } },
  { id: 'g-s-out-minsec', type: 'output', topic: MIX, make(r) {
    const s = r.pick(SCN), t = r.int(61, 7000);
    return { ...inp(OUT, [String(t)]),
      code: src(...head(s), `int total = ${s}.nextInt();`, 'System.out.println(total / 60 + " min " + total % 60 + " sec");'),
      answer: `${idiv(t, 60)} min ${imod(t, 60)} sec`,
      explanation: `/ and % run before the + joins, so this is ${t} / 60 = ${idiv(t, 60)} whole minutes and ${t} % 60 = ${imod(t, 60)} seconds left over.` };
  } },
  { id: 'g-s-out-double-int', type: 'output', topic: READ, make(r) {
    const s = r.pick(SCN), w = r.int(1, 9) + r.pick([0.5, 0.25, 0.75]), h = r.int(2, 9);
    return { ...inp(OUT, lay(r, [w, h])),
      code: src(...head(s), `double w = ${s}.nextDouble();`, `int h = ${s}.nextInt();`, 'System.out.println(w * h);'),
      answer: jdouble(w * h),
      explanation: `w is the double ${w} and h is the int ${h}; double * int is a double, so it prints with a decimal: ${jdouble(w * h)}.` };
  } },
  { id: 'g-s-out-lines-ignored', type: 'output', topic: TOK, make(r) {
    const s = r.pick(SCN), v = Array.from({ length: 4 }, () => r.int(10, 99));
    return { ...inp(OUT, cut(r, v)),
      code: src(...head(s), `int a = ${s}.nextInt();`, `int b = ${s}.nextInt();`, `int c = ${s}.nextInt();`, 'System.out.println(c + " " + b + " " + a);'),
      answer: `${v[2]} ${v[1]} ${v[0]}`,
      explanation: `Tokens ignore line breaks, so a, b, c are the first three numbers in order. The fourth token (${v[3]}) is never read.` };
  } },

  // ---------- trace a variable ----------
  { id: 'g-s-tr-avg-input', type: 'trace', topic: MIX, make(r) {
    const s = r.pick(SCN);
    let a, b;
    do { a = r.int(20, 99); b = r.int(20, 99); } while ((a + b) % 2 === 0);
    return { ...inp('After this runs, what is the value of avg?', lay(r, [a, b])), var: 'avg',
      code: src(...head(s), `int a = ${s}.nextInt();`, `int b = ${s}.nextInt();`, 'double avg = (a + b) / 2;'),
      answer: jdouble(idiv(a + b, 2)),
      explanation: `${a} + ${b} = ${a + b}; int / int drops the .5 to ${idiv(a + b, 2)} before it is stored in the double, so avg is ${jdouble(idiv(a + b, 2))}.` };
  } },
  { id: 'g-s-tr-indexof-space', type: 'trace', topic: IDX, make(r) {
    const s = r.pick(SCN), f = r.pick([...FIRST, ...DISTINCT]), l = r.pick(LAST);
    return { ...inp('After this runs, what is the value of sp?', [`${f} ${l}`]), var: 'sp',
      code: src(...head(s), `String line = ${s}.nextLine();`, 'int sp = line.indexOf(" ");'),
      answer: String(f.length),
      explanation: `The space comes right after "${f}", whose ${f.length} characters sit at positions 0 to ${f.length - 1}, so the space is at position ${f.length}.` };
  } },
  { id: 'g-s-tr-after-space', type: 'trace', topic: SUB, make(r) {
    const s = r.pick(SCN), f = r.pick(FIRST), l = r.pick(LAST);
    return { ...inp('After this runs, what is the value of last?', [`${f} ${l}`]), var: 'last',
      code: src(...head(s), `String line = ${s}.nextLine();`, 'String last = line.substring(line.indexOf(" ") + 1);'),
      answer: l,
      explanation: `indexOf(" ") is ${f.length}; the + 1 skips the space itself, and substring with one number keeps everything to the end: ${l}.` };
  } },
  { id: 'g-s-tr-third-token', type: 'trace', topic: TOK, make(r) {
    const s = r.pick(SCN), v = [r.int(2, 9), r.int(2, 9), r.int(10, 30)];
    return { ...inp('After this runs, what is the value of r?', lay(r, v)), var: 'r',
      code: src(...head(s), `int first = ${s}.nextInt();`, `int second = ${s}.nextInt();`, `int third = ${s}.nextInt();`, 'int r = first * second - third;'),
      answer: String(v[0] * v[1] - v[2]),
      explanation: `The reads happen in order: first = ${v[0]}, second = ${v[1]}, third = ${v[2]}. So r = ${v[0]} * ${v[1]} - ${v[2]} = ${v[0] * v[1] - v[2]}.` };
  } },
  { id: 'g-s-tr-mid', type: 'trace', topic: SUB, make(r) {
    const s = r.pick(SCN), w = r.pick(ANY);
    return { ...inp('After this runs, what is the value of mid?', [w]), var: 'mid',
      code: src(...head(s), `String w = ${s}.next();`, 'String mid = w.substring(1, w.length() - 1);'),
      answer: w.slice(1, -1),
      explanation: `The end is w.length() - 1 = ${w.length - 1}, and substring stops one before it, so the first AND the last letter are dropped: ${w.slice(1, -1)}.` };
  } },
  { id: 'g-s-tr-price', type: 'trace', topic: READ, make(r) {
    const s = r.pick(SCN), n = r.int(2, 6), p = r.int(1, 9) + r.pick([0.5, 0.25, 0.75]);
    return { ...inp('After this runs, what is the value of cost?', lay(r, [n, p])), var: 'cost',
      code: src(...head(s), `int n = ${s}.nextInt();`, `double price = ${s}.nextDouble();`, 'double cost = n * price;'),
      answer: jdouble(n * p),
      explanation: `n is read first (${n}), then price (${p}). int * double is a double: ${n} * ${p} = ${jdouble(n * p)}.` };
  } },

  // ---------- find the bug ----------
  { id: 'g-s-bug-noimport', type: 'bug', topic: SETUP, make(r) {
    const s = r.pick(SCN), v = r.pick(['n', 'x', 'value', 'num']), p = program(r, [
      { src: `Scanner ${s} = new Scanner(System.in);`, bad: true }, { src: `int ${v} = ${s}.nextInt();` }, { src: `System.out.println(${v} * 2);` }]);
    return { ...inp("This program won't compile. Which line is the problem?", [String(r.int(2, 50))]), code: p.code, answer: p.answer,
      explanation: 'There is no import java.util.*; at the top, so Java does not know what a Scanner is. The error is reported on the line that first uses it.' };
  } },
  { id: 'g-s-bug-wrong-type', type: 'bug', topic: READ, make(r) {
    const s = r.pick(SCN), [ty, m, why] = r.pick([['int', 'next', 'next() gives a String'], ['String', 'nextInt', 'nextInt() gives an int'],
      ['int', 'nextDouble', 'nextDouble() gives a double'], ['int', 'nextLine', 'nextLine() gives a String'], ['double', 'next', 'next() gives a String']]);
    const v = r.pick(['a', 'x', 'value', 'item']);
    const p = withHead(r, s, [{ src: `${ty} ${v} = ${s}.${m}();`, bad: true }, { src: `System.out.println(${v});` }]);
    return { ...inp("This program won't compile. Which line is the problem?", [r.pick(['7', 'hello', '3.5'])]), code: p.code, answer: p.answer,
      explanation: `${why}, so it can't be stored in ${ty === 'int' ? 'an' : 'a'} ${ty} variable: a type mismatch caught at compile time, whatever the user types.` };
  } },
  { id: 'g-s-bug-out-of-tokens', type: 'bug', topic: ERR, make(r) {
    const s = r.pick(SCN), n = r.int(3, 5), have = n - r.int(1, 2), vals = Array.from({ length: have }, () => r.int(1, 50));
    const p = withHead(r, s, [{ src: 'int sum = 0;' }, { src: `for (int i = 1; i <= ${n}; i++) {` },
      { src: `    sum += ${s}.nextInt();`, bad: true }, { src: '}' }, { src: 'System.out.println(sum);' }]);
    return { ...inp('This compiles. Which line crashes when it runs?', lay(r, vals)), code: p.code, answer: p.answer,
      explanation: `The loop asks for ${n} numbers but only ${have} were typed. When the tokens run out, the next nextInt() crashes.` };
  } },
  { id: 'g-s-bug-wrong-order', type: 'bug', topic: ERR, make(r) {
    const s = r.pick(SCN), w = r.pick(FIRST), n = r.int(10, 60), numFirst = r.chance(0.5);
    const p = withHead(r, s, [{ src: `int a = ${s}.nextInt();`, bad: !numFirst },
      { src: `int b = ${s}.nextInt();`, bad: numFirst }, { src: 'System.out.println(a + b);' }]);
    return { ...inp('This compiles. Which line crashes when it runs?', [numFirst ? `${n} ${w}` : `${w} ${n}`]), code: p.code, answer: p.answer,
      explanation: `${w} is not an int. The crash happens on the nextInt() that reaches the token "${w}", not at the end of the program.` };
  } },
  { id: 'g-s-bug-no-parens', type: 'bug', topic: STR, make(r) {
    const s = r.pick(SCN), w = r.pick(ANY), v = r.pick(['w', 'word', 'text']), [ty, call] = r.pick([['int', 'length'], ['String', 'toUpperCase']]), x = r.pick(['n', 'result', 'out']);
    const p = program(r, [{ src: `String ${v} = ${jstr(w)};` }, { src: `${ty} ${x} = ${v}.${call};`, bad: true }, { src: `System.out.println(${x});` }]);
    return { prompt: "This program won't compile. Which line is the problem?", code: p.code, answer: p.answer,
      explanation: `${call} is a method, so the call needs parentheses: ${v}.${call}(). Without them Java looks for a variable with that name.` };
  } },
  { id: 'g-s-bug-sub-to-int', type: 'bug', topic: STR, make(r) {
    const w = r.pick(ANY), v = r.pick(['w', 'word', 'text']), x = r.pick(['n', 'part', 'res']);
    const [ty, call, why] = r.pick([['int', `${v}.substring(1)`, 'substring gives a String'], ['String', `${v}.length()`, 'length() gives an int'],
      ['String', `${v}.indexOf("a")`, 'indexOf gives an int'], ['int', `${v}.toUpperCase()`, 'toUpperCase() gives a String']]);
    const p = program(r, [{ src: `String ${v} = ${jstr(w)};` }, { src: `${ty} ${x} = ${call};`, bad: true }, { src: `System.out.println(${x});` }]);
    return { prompt: "This program won't compile. Which line is the problem?", code: p.code, answer: p.answer,
      explanation: `${why}, so it can't be stored in ${ty === 'int' ? 'an' : 'a'} ${ty}: a type mismatch caught at compile time.` };
  } },
];
