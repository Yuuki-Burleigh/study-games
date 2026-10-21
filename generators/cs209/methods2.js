// Problem templates for CS 209 methods continued (lecture 10-20): return values you must catch, global vs local
// variables, parameters that shadow globals, methods with loops. Mixed with earlier topics.
import { idiv, imod, jdouble, jstr, choices, uneven, NAMES, WORDS, LETTERS, code } from '../../gen-kit.js';
import { ind, main, method, bad, text, prog } from './mkit.js';

const GLOB = 'Global vs local variables', CATCH = 'Catching a returned value', SHADOW = 'Parameter shadows a global', RET = 'Return values', LOOPM = 'Methods with loops', CALL = 'Calling methods';
const OUT = 'Type exactly what this prints.';
const SHOW = ['show', 'report', 'announce', 'display', 'printInfo'];
const CALC = ['triple', 'bonus', 'boost', 'shift', 'grow', 'scale', 'adjust'];
const GNAMES = NAMES.filter((n) => !['total', 'count'].includes(n)).concat(['total', 'count']);

export default [
  // ---------- multiple choice ----------
  { id: 'g-m2-shadow-local', type: 'mc', topic: GLOB, run: true, make(r) {
    const g = r.pick(GNAMES), a = r.int(2, 9), b = r.int(10, 19), name = r.pick(SHOW);
    const ans = `${b},${a}`;
    return { prompt: 'What does this print?',
      code: text(['public static int ' + g + ' = ' + a + ';'], main([`${name}();`, `System.out.println(${g});`]),
        method(`void ${name}()`, [`int ${g} = ${b};`, `System.out.print(${g} + ",");`])),
      answer: ans, choices: choices(r, ans, [`${a},${a}`, `${b},${b}`, `${a},${b}`]),
      explanation: `Inside ${name} the local ${g} (${b}) takes precedence over the global. main has no local, so it prints the global ${a}. The global was never changed.` };
  } },
  { id: 'g-m2-catch', type: 'mc', topic: CATCH, run: true, make(r) {
    const a = r.int(2, 9), k = r.int(2, 6), name = r.pick(CALC);
    const ans = String(a + k);
    return { prompt: 'What does this print?',
      code: text(main([`int n = ${a};`, `${name}(n);`, `n = ${name}(n);`, 'System.out.println(n);']), method(`int ${name}(int v)`, [`return v + ${k};`])),
      answer: ans, choices: choices(r, ans, [String(a + 2 * k), String(a), String(k)]),
      explanation: `The first call returns ${a + k} but nothing catches it, so it is thrown away and n stays ${a}. Only n = ${name}(n) stores the result: ${a} + ${k} = ${a + k}.` };
  } },
  { id: 'g-m2-global-who', type: 'mc', topic: GLOB, make(r) {
    const g = r.pick(GNAMES), name = r.pick(SHOW), a = r.int(2, 30);
    const ans = 'Every method in the class, including main';
    return { prompt: `Which methods can read and change ${g}?`,
      code: text([`public static int ${g} = ${a};`], main([`${name}();`]), method(`void ${name}()`, ['// ...'])),
      answer: ans, choices: choices(r, ans, ['Only main', `Only methods that receive ${g} as a parameter`, `Only the method that declares ${g}`]),
      explanation: `A variable declared in the class, outside every method (public static), is global: all methods can use it without declaring it again.` };
  } },

  // ---------- type the output ----------
  { id: 'g-m2-out-global', type: 'output', topic: GLOB, make(r) {
    const g = r.pick(GNAMES), a = r.int(0, 9), n = r.int(2, 5), k = r.int(2, 4), form = r.int(0, 2);
    const step = form === 0 ? `${g}++;` : form === 1 ? `${g} += ${k};` : `${g} = ${g} + ${k};`;
    const add = form === 0 ? 1 : k, name = r.pick(CALC);
    return { prompt: OUT,
      code: text([`public static int ${g} = ${a};`], main([`for (int i = 1; i <= ${n}; i++) {`, `    ${name}();`, '}', `System.out.println("${g}: " + ${g});`]),
        method(`void ${name}()`, [step])),
      answer: `${g}: ${a + n * add}`,
      explanation: `${g} is global, so each call changes the one shared variable and the change stays: ${a} + ${n} × ${add} = ${a + n * add}.` };
  } },
  { id: 'g-m2-out-param-shadow', type: 'output', topic: SHADOW, make(r) {
    const g = r.pick(GNAMES), a = r.int(2, 9), b = r.int(10, 19), k = r.int(2, 6), name = r.pick(CALC), pass = r.chance(0.5);
    const sent = pass ? a : b;
    return { prompt: OUT,
      code: text([`public static int ${g} = ${a};`], main([`${name}(${pass ? g : b});`, `System.out.println(${g});`]),
        method(`void ${name}(int ${g})`, [`${g} = ${g} + ${k};`, `System.out.println(${g});`])),
      answer: `${sent + k}\n${a}`,
      explanation: `The parameter is named ${g} too, so inside ${name} it is a new local copy (${sent}) that shadows the global. It becomes ${sent + k}; the global ${g} stays ${a}.` };
  } },
  { id: 'g-m2-out-concat-call', type: 'output', topic: RET, make(r) {
    const name = r.pick(CALC), c = r.int(2, 5), a = r.int(2, 6), b = r.int(2, 6), w = r.pick(WORDS);
    return { prompt: OUT,
      code: text(main([`System.out.println(${jstr(w + ': ')} + ${name}(${a}) + ${name}(${b}));`, `System.out.println(${name}(${a}) + ${name}(${b}) + ${jstr(' ' + w)});`]),
        method(`int ${name}(int n)`, [`return n * ${c};`])),
      answer: `${w}: ${a * c}${b * c}\n${a * c + b * c} ${w}`,
      explanation: `A call is just a value, so + still goes left to right. After a String it glues the digits (${a * c}${b * c}); with two ints first it adds them (${a * c + b * c}).` };
  } },
  { id: 'g-m2-out-loop-method', type: 'output', topic: LOOPM, make(r) {
    const a = r.int(4, 20), b = r.int(2, 9), st = r.int(1, 2), name = r.pick(['sumTo', 'addUp', 'tally']);
    const sum = (n) => { let s = 0; for (let i = 1; i <= n; i += st) s += i; return s; };
    return { prompt: OUT,
      code: text(main([`System.out.println(${name}(${a}));`, `System.out.println(${name}(${b}));`]),
        method(`int ${name}(int n)`, ['int sum = 0;', `for (int i = 1; i <= n; i += ${st}) {`, '    sum = sum + i;', '}', 'return sum;'])),
      answer: `${sum(a)}\n${sum(b)}`,
      explanation: `Each call runs the whole loop afresh with its own n and a new sum starting at 0: ${name}(${a}) = ${sum(a)}, ${name}(${b}) = ${sum(b)}.` };
  } },
  { id: 'g-m2-out-temp', type: 'output', topic: RET, make(r) {
    const c = r.int(-6, 20) * 5, f = c * 9 / 5 + 32, name = r.pick(['toF', 'convert', 'fahrenheit', 'celsiusToF', 'toFahrenheit']), cn = r.pick(['tempC', 'celsius', 'degC']);
    return { prompt: OUT,
      code: text(main([`double ${cn} = ${c}.0;`, `double tempF = ${name}(${cn});`, `System.out.println(tempF + " F from " + ${cn} + " C");`]),
        method(`double ${name}(double c)`, ['return (c * 9 / 5) + 32;'])),
      answer: `${jdouble(f)} F from ${jdouble(c)} C`,
      explanation: `${c}.0 × 9 / 5 + 32 = ${jdouble(f)}. The returned double is caught in tempF, then both are printed with + (a String comes first, so it is concatenation).` };
  } },

  // ---------- trace a variable ----------
  { id: 'g-m2-tr-chain', type: 'trace', topic: CATCH, make(r) {
    const a = r.int(2, 9), k = r.int(2, 6), calls = Array.from({ length: r.int(3, 4) }, () => r.pick(['up', 'twice']));
    if (new Set(calls).size < 2) calls[0] = calls[0] === 'up' ? 'twice' : 'up';
    let x = a; for (const c of calls) x = c === 'up' ? x + k : x * 2;
    return { prompt: 'After main finishes, what is the value of x?', var: 'x',
      code: text(main([`int x = ${a};`, ...calls.map((c) => `x = ${c}(x);`)]),
        method('int up(int v)', [`return v + ${k};`]), method('int twice(int v)', ['return v * 2;'])),
      answer: String(x),
      explanation: `Each result is caught back into x and feeds the next call, so the order matters: ${calls.join(' → ')} gives ${x}.` };
  } },
  { id: 'g-m2-tr-global', type: 'trace', topic: GLOB, make(r) {
    const a = r.int(1, 9), b = r.int(2, 9), c = r.int(2, 9), name = r.pick(['addTo', 'deposit', 'collect']);
    return { prompt: 'After main finishes, what is the value of total?', var: 'total',
      code: text(['public static int total = ' + a + ';'], main([`${name}(${b});`, `${name}(${c});`]), method(`void ${name}(int v)`, ['total = total + v;'])),
      answer: String(a + b + c),
      explanation: `total is global: the parameter v is a copy, but total itself is the one shared variable, so both calls add to it: ${a} + ${b} + ${c}.` };
  } },
  { id: 'g-m2-tr-loopsum', type: 'trace', topic: LOOPM, make(r) {
    const a = r.int(6, 10), b = r.int(2, 5), k = r.int(2, 4), name = r.pick(['sumTo', 'addUp', 'tally']);
    const sum = (n) => { let s = 0; for (let i = 1; i <= n; i++) s += i * k; return s; };
    return { prompt: 'After main finishes, what is the value of r?', var: 'r',
      code: text(main([`int r = ${name}(${a}) - ${name}(${b});`]),
        method(`int ${name}(int n)`, ['int sum = 0;', 'for (int i = 1; i <= n; i++) {', `    sum += i * ${k};`, '}', 'return sum;'])),
      answer: String(sum(a) - sum(b)),
      explanation: `${name}(${a}) = ${sum(a)} and ${name}(${b}) = ${sum(b)}; each call starts its own sum at 0. ${sum(a)} - ${sum(b)} = ${sum(a) - sum(b)}.` };
  } },
  { id: 'g-m2-tr-char', type: 'trace', topic: RET, make(r) {
    const ch = r.pick(LETTERS), k = r.int(2, 9), name = r.pick(['shiftCode', 'nextCode', 'codeOf']);
    return { prompt: 'After main finishes, what is the value of n?', var: 'n',
      code: text(main([`int n = ${name}(${jstr(ch).replace(/"/g, "'")});`]), method(`int ${name}(char c)`, [`return c + ${k};`])),
      answer: String(code(ch) + k),
      explanation: `A char is its numeric code in arithmetic: '${ch}' is ${code(ch)}, plus ${k} is ${code(ch) + k}, returned as an int (not a letter).` };
  } },

  // ---------- find the bug ----------
  { id: 'g-m2-bug-lossy-call', type: 'bug', topic: RET, make(r) {
    const a = r.int(2, 9), b = r.int(2, 9), name = r.pick(['mean', 'average', 'middle']);
    const p = prog(main([bad(`int r = ${name}(${a}, ${b});`), 'System.out.println(r);']), method(`double ${name}(int x, int y)`, ['return (x + y) / 2.0;']));
    return { prompt: "Which line won't compile?", ...p,
      explanation: `${name} returns a double, and a double can't be stored in an int. Declare double r.` };
  } },
  { id: 'g-m2-bug-retmismatch', type: 'bug', topic: RET, make(r) {
    const a = r.int(3, 20), name = r.pick(CALC), dv = r.pick([2, 4, 5]);
    const p = prog(main([`int r = ${name}(${a});`, 'System.out.println(r);']), method(`int ${name}(int n)`, [bad(`return n / ${dv}.0;`)]));
    return { prompt: "Which line won't compile?", ...p,
      explanation: `The method promises an int, but n / ${dv}.0 is a double. The returned value must match the declared return type.` };
  } },
  { id: 'g-m2-bug-voidreturn', type: 'bug', topic: RET, make(r) {
    const a = r.int(2, 40), name = r.pick(SHOW), v = r.pick(['twice', 'result', 'doubled', 'answer']), k = r.int(2, 5);
    const p = prog(main([`${name}(${a});`]), method(`void ${name}(int n)`, [`int ${v} = n * ${k};`, bad(`return ${v};`)]));
    return { prompt: "Which line won't compile?", ...p,
      explanation: `void means "returns nothing", so return ${v}; isn't allowed. Change void to int, or print inside instead.` };
  } },
  { id: 'g-m2-bug-divzero', type: 'bug', topic: CALL, make(r) {
    const total = r.int(20, 90), top = r.int(2, 4), name = r.pick(['share', 'split', 'portion']);
    const p = prog(main([`int total = ${total};`, `for (int i = ${top}; i >= 0; i--) {`, `    System.out.println(${name}(total, i));`, '}']),
      method(`int ${name}(int t, int people)`, [bad('return t / people;')]));
    return { prompt: 'This compiles. Which line crashes when it runs?', ...p,
      explanation: `The loop counts down to 0, so the last call sends people = 0 and int division by zero crashes inside ${name}, even though the call line looks fine.` };
  } },
];
