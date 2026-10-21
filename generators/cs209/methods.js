// Problem templates for CS 209 static methods and ++x (lectures 10-13, 10-15), mixed with earlier topics.
// Whole-class programs: main first (so tools/check_java.py can append a print for trace), then the methods.
// Answers are computed in JS with Java's rules (gen-kit.js); CI runs every sampled instance through real Java.
import { idiv, imod, jdouble, jstr, choices, uneven, WORDS } from '../../gen-kit.js';
import { ind, main, method, bad, text, prog } from './mkit.js';

const SIG = 'Method signatures', CALL = 'Calling methods', COPY = 'Passing values (copies)', RET = 'Return values', PRE = 'Pre-increment (++x)', FLOW = 'Order of execution';
const OUT = 'Type exactly what this prints.';
const SHOW = ['show', 'report', 'announce', 'display', 'printInfo', 'greet'];
const CALC = ['triple', 'bonus', 'boost', 'shift', 'grow', 'scale', 'adjust'];
const PAIRS = [['x', 'y'], ['a', 'b'], ['p', 'q'], ['m', 'n'], ['w', 'h'], ['u', 'v'], ['s', 't']];

export default [
  // ---------- multiple choice ----------
  { id: 'g-m-rettype', type: 'mc', topic: SIG, make(r) {
    const name = r.pick(CALC), rt = r.pick(['int', 'double', 'void']), np = r.int(1, 3);
    const ps = r.sample(['int a', 'double b', 'int c', 'double d', 'int e'], np);
    const ans = rt === 'void' ? 'Nothing (void)' : `${rt === 'int' ? 'An' : 'A'} ${rt} value`;
    return { prompt: 'What does a call to this method give back to the caller?',
      code: text(method(`${rt} ${name}(${ps.join(', ')})`, ['// ...'])),
      answer: ans, choices: choices(r, ans, ['An int value', 'A double value', 'Nothing (void)', 'A String value']),
      explanation: `The word right before the method name is its return type (${rt}). The words inside ( ) are the inputs, not what comes back.` };
  } },
  { id: 'g-m-params', type: 'mc', topic: SIG, make(r) {
    const name = r.pick(CALC), rt = r.pick(['int', 'double', 'void']), np = r.int(1, 3);
    const ps = r.sample(['int a', 'double b', 'int c', 'double d', 'int e'], np);
    const ans = String(np);
    return { prompt: `How many values must a call to ${name} send?`,
      code: text(method(`${rt} ${name}(${ps.join(', ')})`, ['// ...'])),
      answer: ans, choices: choices(r, ans, [String(np + 1), String(np - 1), '0', '1']),
      explanation: `One value per parameter: ${np} here. The return type (${rt}) says what comes back, not what goes in.` };
  } },
  { id: 'g-m-order', type: 'mc', topic: FLOW, run: true, make(r) {
    const ws = r.sample(WORDS, 3), defs = [0, 1, 2];
    let seq;
    do { seq = Array.from({ length: 4 }, () => r.int(0, 2)); }
    while (seq.join() === defs.join() || new Set(seq).size === seq.length || new Set(seq).size < 2);
    const firsts = [...new Set(seq)];
    const ans = seq.map((k) => ws[k]).join('');
    const body = (k) => method(`void m${k + 1}()`, [`System.out.print(${jstr(ws[k])});`]);
    return { prompt: 'What does this print?',
      code: text(main(seq.map((k) => `m${k + 1}();`)), ...defs.map(body)),
      answer: ans, choices: choices(r, ans, [defs.map((k) => ws[k]).join(''), [...seq].reverse().map((k) => ws[k]).join(''), firsts.map((k) => ws[k]).join('')]),
      explanation: `main runs its calls top to bottom, and a method body runs each time it is called (so repeats print again). The order the methods are written in doesn't matter.` };
  } },
  { id: 'g-m-pre-mc', type: 'mc', topic: PRE, run: true, make(r) {
    const a = r.int(2, 30), k = r.int(2, 9), op = r.pick(['*', '+']);
    const y = op === '*' ? (a + 1) * k : a + 1 + k;
    const ans = `${a + 1} ${y}`;
    return { prompt: 'What does this print?',
      code: text(main([`int x = ${a};`, `int y = ++x ${op} ${k};`, 'System.out.println(x + " " + y);'])),
      answer: ans, choices: choices(r, ans, [`${a} ${op === '*' ? a * k : a + k}`, `${a + 1} ${op === '*' ? a * k : a + k}`, `${a} ${y}`]),
      explanation: `++x adds 1 to x first, and then the new value (${a + 1}) is used in the expression. So both x and y see ${a + 1}.` };
  } },
  { id: 'g-m-validcall', type: 'mc', topic: CALL, make(r) {
    const name = r.pick(CALC), [p, q] = r.pick(PAIRS), n1 = r.int(2, 40), n2 = r.int(2, 40), n3 = r.int(2, 40), e = r.pick(['*', '+', '-']);
    const ans = `int r = ${name}(${n1}, ${n2});`;
    return { prompt: 'Which call matches this method?',
      code: text(method(`int ${name}(int ${p}, int ${q})`, [`return ${p} ${e} ${q};`])),
      answer: ans, choices: choices(r, ans, [`int r = ${name}(${n1});`, `int r = ${name}(${n1}, ${n2}.5);`, `int r = ${name}(${n1}, ${n2}, ${n3});`]),
      explanation: `A call must send exactly the declared inputs: two ints, in order. One value is too few, three is too many, and a double doesn't fit an int parameter.` };
  } },

  // ---------- type the output ----------
  { id: 'g-m-out-void', type: 'output', topic: CALL, make(r) {
    const name = r.pick(SHOW), w = r.pick(WORDS), [p, q] = r.pick(PAIRS), e = r.pick(['+', '*', '-']);
    const v = (x, y) => (e === '+' ? x + y : e === '*' ? x * y : x - y);
    const a = r.int(2, 9), b = r.int(2, 9), c = r.int(2, 9), d = r.int(2, 9);
    return { prompt: OUT,
      code: text(main([`${name}(${a}, ${b});`, `${name}(${c}, ${d});`]), method(`void ${name}(int ${p}, int ${q})`, [`System.out.println(${jstr(w + ': ')} + (${p} ${e} ${q}));`])),
      answer: `${w}: ${v(a, b)}\n${w}: ${v(c, d)}`,
      explanation: `The body runs once per call, each time with that call's values: ${p} gets the first, ${q} the second (so order matters for -).` };
  } },
  { id: 'g-m-out-notcalled', type: 'output', topic: FLOW, make(r) {
    const ws = r.sample(WORDS, 3), skip = r.int(0, 2), used = [0, 1, 2].filter((k) => k !== skip);
    let seq;
    do { seq = [r.pick(used), r.pick(used), r.pick(used)]; } while (new Set(seq).size < 2);
    const body = (k) => method(`void m${k + 1}()`, [`System.out.println(${jstr(ws[k])});`]);
    return { prompt: OUT,
      code: text(main(seq.map((k) => `m${k + 1}();`)), ...[0, 1, 2].map(body)),
      answer: seq.map((k) => ws[k]).join('\n'),
      explanation: `m${skip + 1} is defined but main never calls it, so it never runs. Only called methods execute, in the order main calls them.` };
  } },
  { id: 'g-m-out-copy', type: 'output', topic: COPY, make(r) {
    const a = r.int(3, 12), k = r.int(2, 5), op = r.pick(['*', '+', '-']), name = r.pick(CALC);
    const nv = op === '*' ? a * k : op === '+' ? a + k : a - k;
    return { prompt: OUT,
      code: text(main([`int n = ${a};`, `${name}(n);`, 'System.out.println(n);']), method(`void ${name}(int v)`, [`v = v ${op} ${k};`, 'System.out.println(v);'])),
      answer: `${nv}\n${a}`,
      explanation: `The call sends the VALUE ${a}, a copy. The method changes only its own v; main's n is still ${a}.` };
  } },
  { id: 'g-m-out-loopcall', type: 'output', topic: CALL, make(r) {
    const name = r.pick(SHOW), s = r.int(1, 3), e = s + r.int(2, 3), k = r.int(2, 4), op = r.pick(['*', '+', '%']);
    const f = (n) => (op === '*' ? n * k : op === '+' ? n + k : imod(n, k));
    const lines = []; for (let i = s; i <= e; i++) lines.push(String(f(i)));
    return { prompt: OUT,
      code: text(main([`for (int i = ${s}; i <= ${e}; i++) {`, `    ${name}(i);`, '}']), method(`void ${name}(int n)`, [`System.out.println(n ${op} ${k});`])),
      answer: lines.join('\n'),
      explanation: `The loop calls ${name} once per pass, handing it the current i; each call prints one line.` };
  } },

  // ---------- trace a variable ----------
  { id: 'g-m-tr-return', type: 'trace', topic: RET, make(r) {
    const [a, b] = uneven(r, 5, 40, 2, 9), name = r.pick(CALC), e = r.pick(['x - y', 'x / y', 'x % y']);
    const val = e === 'x - y' ? a - b : e === 'x / y' ? idiv(a, b) : imod(a, b);
    return { prompt: 'After main finishes, what is the value of r?', var: 'r',
      code: text(main([`int r = ${name}(${a}, ${b});`]), method(`int ${name}(int x, int y)`, [`return ${e};`])),
      answer: String(val),
      explanation: `Arguments go to parameters by position: x is ${a}, y is ${b}. ${e.replace('x', a).replace('y', b)} = ${val}.` };
  } },
  { id: 'g-m-tr-avg', type: 'trace', topic: RET, make(r) {
    let s1, s2, s3, sum;
    do { s1 = r.int(60, 99); s2 = r.int(60, 99); s3 = r.int(60, 99); sum = s1 + s2 + s3; } while (sum % 3 === 0);
    return { prompt: 'After main finishes, what is the value of avg?', var: 'avg',
      code: text(main([`double avg = mean(${s1}, ${s2}, ${s3});`]),
        method('double mean(int a, int b, int c)', ['double result = (a + b + c) / 3;', 'return result;'])),
      answer: jdouble(idiv(sum, 3)),
      explanation: `(a + b + c) / 3 is int / int = ${idiv(sum, 3)}: the fraction is dropped BEFORE it is stored in the double. To keep it, divide by 3.0.` };
  } },
  { id: 'g-m-tr-dbl', type: 'trace', topic: RET, make(r) {
    const n = r.int(3, 40), dv = r.pick([2, 4, 5, 8]), name = r.pick(CALC);
    return { prompt: 'After main finishes, what is the value of r?', var: 'r',
      code: text(main([`double r = ${name}(${n});`]), method(`double ${name}(int n)`, [`return n / ${dv}.0;`])),
      answer: jdouble(n / dv),
      explanation: `int with a double is a double and keeps its fraction: ${n} / ${dv}.0 = ${jdouble(n / dv)}.` };
  } },
  { id: 'g-m-tr-pre', type: 'trace', topic: PRE, make(r) {
    const a = r.int(2, 9), k = r.int(2, 6), m = r.int(1, 3);
    return { prompt: 'After main finishes, what is the value of x?', var: 'x',
      code: text(main([`int x = ${a};`, `int y = x + ${k};`, ...Array(m).fill('++x;')])),
      answer: String(a + m),
      explanation: `x + ${k} only READS x to make y, it doesn't change x. Only each ++x adds 1 to x: ${a} + ${m} = ${a + m}.` };
  } },

  // ---------- find the bug ----------
  { id: 'g-m-bug-void-assign', type: 'bug', topic: RET, make(r) {
    const name = r.pick(SHOW), v = r.pick(['score', 'total', 'age', 'level']), a = r.int(2, 20);
    const p = prog(main([`int ${v} = ${a};`, bad(`int r = ${name}(${v});`), 'System.out.println(r);']),
      method(`void ${name}(int n)`, ['System.out.println(n * 2);']));
    return { prompt: "Which line won't compile?", ...p,
      explanation: `${name} is void: it returns nothing, so there is no value to store in r. Make it return an int, or just call ${name}(${v}); on its own.` };
  } },
  { id: 'g-m-bug-argcount', type: 'bug', topic: CALL, make(r) {
    const name = r.pick(CALC), a = r.int(2, 9), b = r.int(2, 9), few = r.chance(0.5);
    const call = few ? `int r = ${name}(${a});` : `int r = ${name}(${a}, ${b}, ${r.int(2, 9)});`;
    const p = prog(main([bad(call), 'System.out.println(r);']), method(`int ${name}(int x, int y)`, ['return x + y;']));
    return { prompt: "Which line won't compile?", ...p,
      explanation: `${name} declares two parameters, so every call must send exactly two values; ${few ? 'one is too few' : 'three is too many'}.` };
  } },
  { id: 'g-m-bug-argtype', type: 'bug', topic: COPY, make(r) {
    const name = r.pick(SHOW), a = r.int(1, 40) + 0.5, c = r.int(2, 30);
    const p = prog(main([`int count = ${c};`, bad(`${name}(${a});`), `${name}(count);`]), method(`void ${name}(int n)`, ['System.out.println(n);']));
    return { prompt: "Which line won't compile?", ...p,
      explanation: `The parameter n is an int, and ${a} is a double: the same mismatch as int price = 2.5;. A double can't be passed in where an int is declared.` };
  } },
  { id: 'g-m-bug-noreturn', type: 'bug', topic: RET, make(r) {
    const name = r.pick(CALC), k = r.int(2, 6), a = r.int(2, 9);
    const p = prog(main([`int r = ${name}(${a});`, 'System.out.println(r);']),
      ['public static int ' + name + '(int n) {', ...ind([`int result = n * ${k};`]), bad('}')]);
    return { prompt: "Which line won't compile?", ...p,
      explanation: `${name} promises an int but never says return. javac complains at the closing brace: add return result; before it.` };
  } },
  { id: 'g-m-bug-scope', type: 'bug', topic: COPY, make(r) {
    const name = r.pick(SHOW), v = r.pick(['score', 'total', 'lives', 'coins']), a = r.int(2, 30);
    const p = prog(main([`int ${v} = ${a};`, `${name}();`]), method(`void ${name}()`, [bad(`System.out.println(${v} * 2);`)]));
    return { prompt: "Which line won't compile?", ...p,
      explanation: `${v} is a local variable of main, so ${name} can't see it. Send it in: ${name}(${v}) with an int parameter.` };
  } },
];
