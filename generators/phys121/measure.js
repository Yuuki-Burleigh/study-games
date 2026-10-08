// Physics 121 templates: significant figures, scientific notation and unit conversion / dimensional analysis
// (Quiz 1 problems 2 and 4, extended). Scope: courses/phys121.md.
import { choices } from '../../gen-kit.js';
import { sig4, show, sigFigs, sigNumber, toSci, sciExp, sciDigits, sciText } from './kit.js';

const SF = 'Significant figures', SCI = 'Scientific notation', ROUND = 'Rounding to sig figs', CONV = 'Unit conversion',
  MONEY = 'Dimensional analysis (money)', RATE = 'Rates & profit';
const money = (x) => '$' + x.toLocaleString('en-US');

export default [
  // ---------- significant figures ----------
  { id: 'g-p-sf-count', type: 'num', topic: SF, make(r) {
    const n = sigNumber(r), ans = sigFigs(n);
    const why = n.startsWith('0.') ? 'the zeros in front only place the decimal point, so they never count'
      : n.endsWith('.') ? 'the decimal point written at the end makes every trailing zero count'
      : !n.includes('.') && /0$/.test(n) ? 'with no decimal point, trailing zeros are just placeholders and don\'t count'
      : n.includes('.') && /0$/.test(n) ? 'trailing zeros after a decimal point were measured, so they count'
      : 'zeros trapped between nonzero digits always count';
    return { prompt: `How many significant figures does ${n} have?`, answer: ans, tol: 0,
      explanation: `${n} has ${ans}: ${why}.` };
  } },
  { id: 'g-p-sf-which', type: 'mc', topic: SF, make(r) {
    // Four numbers with different sig-fig counts; exactly one has k.
    const kinds = r.shuffle(['small', 'plain', 'point', 'decimal', 'captive']);
    const nums = [];
    for (let tries = 0; nums.length < 4 && tries < 200; tries++) {
      const n = sigNumber(r, kinds[tries % kinds.length]);
      if (!nums.some((m) => sigFigs(m) === sigFigs(n))) nums.push(n);
    }
    const ans = nums[0], k = sigFigs(ans);
    return { prompt: `Which of these has exactly ${k} significant figure${k === 1 ? '' : 's'}?`,
      answer: ans, choices: choices(r, ans, nums.slice(1)),
      explanation: `${ans} has ${k}. ${nums.slice(1).map((m) => `${m} has ${sigFigs(m)}`).join(', ')}. Leading zeros never count; trailing zeros count only with a decimal point.` };
  } },

  // ---------- scientific notation ----------
  { id: 'g-p-sci-write', type: 'mc', topic: SCI, make(r) {
    const n = sigNumber(r), ans = toSci(n), d = sciDigits(n), e = sciExp(n);
    const trimmed = d.replace(/0+$/, '') || d;
    const padded = d + '0';
    return { prompt: `Write ${n} in scientific notation, keeping its significant figures.`, answer: ans,
      choices: choices(r, ans, [sciText(d, -e || e + 1), sciText(trimmed === d ? padded : trimmed, e), sciText(d, e + (e < 0 ? 1 : -1))], [sciText(padded, e)]),
      explanation: `${n} has ${d.length} sig fig${d.length === 1 ? '' : 's'}, so the mantissa shows exactly ${d.length} digit${d.length === 1 ? '' : 's'}${e === 0 ? '. It is already between 1 and 10, so the power is 0' : `; moving the decimal point ${Math.abs(e)} place${Math.abs(e) === 1 ? '' : 's'} ${e < 0 ? 'right gives a negative' : 'left gives a positive'} power`}.` };
  } },
  { id: 'g-p-sci-exp', type: 'num', topic: SCI, make(r) {
    const n = sigNumber(r, r.pick(['small', 'small', 'plain', 'point', 'captive'])), e = sciExp(n);
    return { prompt: `When ${n} is written in scientific notation (one nonzero digit before the decimal point), what is the power of ten?`,
      answer: e, tol: 0,
      explanation: `${n} = ${toSci(n)}. ${e < 0 ? 'A number smaller than 1 always has a negative power' : e === 0 ? 'It is already between 1 and 10' : 'A number bigger than 10 has a positive power'}: count how far the decimal point moves.` };
  } },
  { id: 'g-p-sci-back', type: 'mc', topic: SCI, make(r) {
    const len = r.int(1, 3), digits = String(r.int(1, 9)) + Array.from({ length: len - 1 }, () => r.int(0, 9)).join('');
    const e = r.chance(0.5) ? -r.int(1, 4) : r.int(1, 4);
    const at = (exp) => {
      const pt = exp + 1; // digits before the point
      if (pt <= 0) return '0.' + '0'.repeat(-pt) + digits;
      if (pt >= digits.length) return digits + '0'.repeat(pt - digits.length);
      return digits.slice(0, pt) + '.' + digits.slice(pt);
    };
    const ans = at(e);
    return { prompt: `Write ${sciText(digits, e)} as an ordinary number.`, answer: ans,
      choices: choices(r, ans, [at(-e), at(e + (e < 0 ? -1 : 1)), at(e + (e < 0 ? 1 : -1))]),
      explanation: `A power of ${e} moves the decimal point ${Math.abs(e)} place${Math.abs(e) === 1 ? '' : 's'} to the ${e < 0 ? 'left (smaller number)' : 'right (bigger number)'}: ${ans}.` };
  } },
  { id: 'g-p-round', type: 'mc', topic: ROUND, make(r) {
    // x has 5 sig figs; n never needs placeholder zeros, and the digit after the cut is never a bare 5 (no tie).
    let x, n, ans;
    do {
      const intDigits = r.int(0, 3), mant = r.int(1000, 9999) * 10 + r.int(1, 9);
      x = Number((intDigits ? mant / 10 ** (5 - intDigits) : mant / 10 ** (5 + r.int(0, 2))).toPrecision(5));
      n = r.int(Math.max(intDigits, 2), 4);
      ans = x.toPrecision(n);
    } while (ans.includes('e') || x.toPrecision(n + 1).endsWith('5'));
    const step = 10 ** (Math.floor(Math.log10(x)) - n + 1);
    const trunc = (Math.trunc(x / step + 1e-9) * step).toPrecision(n);
    const dropZero = ans.includes('.') ? ans.replace(/0+$/, '').replace(/\.$/, '') : ans;
    return { prompt: `Round ${x} to ${n} significant figures.`, answer: ans,
      choices: choices(r, ans, [x.toFixed(n), trunc, dropZero, x.toPrecision(n + 1)].filter((c) => !c.includes('e')),
        [x.toPrecision(n - 1), (Number(ans) + step).toPrecision(n), (Number(ans) - step).toPrecision(n)].filter((c) => !c.includes('e'))),
      explanation: `Count ${n} digits starting at the first nonzero one (${ans}), then round using the next digit.${x.toFixed(n) !== ans ? ` ${x.toFixed(n)} is ${n} decimal places, not ${n} sig figs.` : ''}${dropZero !== ans ? ` Dropping the final 0 (${dropZero}) loses a sig fig.` : ''}` };
  } },

  // ---------- unit conversion ----------
  { id: 'g-p-kmh', type: 'num', topic: CONV, make(r) {
    if (r.chance(0.5)) {
      const v = r.int(18, 150);
      return { prompt: `A car drives at ${v} km/h. What is that in m/s?`, answer: sig4((v * 1000) / 3600), units: 'm/s',
        explanation: `${v} km/h × (1000 m / 1 km) × (1 h / 3600 s) = ${show((v * 1000) / 3600)} m/s. Multiplying by 3.6 instead (${show(v * 3.6)}) puts the units upside down.` };
    }
    const v = r.int(3, 45);
    return { prompt: `A runner's top speed is ${v} m/s. What is that in km/h?`, answer: sig4(v * 3.6), units: 'km/h',
      explanation: `${v} m/s × (3600 s / 1 h) × (1 km / 1000 m) = ${show(v * 3.6)} km/h. Each factor must cancel the unit above or below it.` };
  } },
  { id: 'g-p-time-chain', type: 'num', topic: CONV, make(r) {
    const k = r.pick(['hm', 'days', 'weeks']);
    if (k === 'hm') {
      const h = r.int(1, 9), m = r.int(5, 55);
      return { prompt: `A flight lasts ${h} h ${m} min. How many seconds is that?`, answer: (h * 60 + m) * 60, units: 's',
        explanation: `(${h} h × 60 min/h + ${m} min) × 60 s/min = ${(h * 60 + m) * 60} s. Stopping at ${h * 60 + m} gives minutes, not seconds.` };
    }
    if (k === 'days') {
      const d = r.int(2, 30);
      return { prompt: `How many minutes are in ${d} days?`, answer: d * 24 * 60, units: 'min',
        explanation: `${d} days × 24 h/day × 60 min/h = ${d * 1440} min.` };
    }
    const w = r.int(2, 12);
    return { prompt: `How many hours are in ${w} weeks?`, answer: w * 7 * 24, units: 'h',
      explanation: `${w} weeks × 7 days/week × 24 h/day = ${w * 168} h. Forgetting the 7 days per week gives ${w * 24}.` };
  } },
  { id: 'g-p-factor', type: 'mc', topic: CONV, make(r) {
    const [from, to, f] = r.pick([['km', 'm', '1000 m / 1 km'], ['m', 'km', '1 km / 1000 m'], ['m', 'cm', '100 cm / 1 m'], ['cm', 'm', '1 m / 100 cm'],
      ['h', 's', '3600 s / 1 h'], ['s', 'h', '1 h / 3600 s'], ['min', 's', '60 s / 1 min'], ['days', 'h', '24 h / 1 day'], ['h', 'days', '1 day / 24 h'], ['mm', 'm', '1 m / 1000 mm']]);
    const x = r.int(2, 999);
    const flip = f.split(' / ').reverse().join(' / ');
    const [num, den] = f.split(' / ');
    return { prompt: `To turn ${x} ${from} into ${to}, which factor do you multiply by?`, answer: `× (${f})`,
      choices: choices(r, `× (${f})`, [`× (${flip})`, `× (${num.split(' ')[0]} ${den.split(' ')[1]} / ${den.split(' ')[0]} ${num.split(' ')[1]})`, `÷ (${f})`]),
      explanation: `${from} has to cancel, so ${from} goes on the bottom of the factor: ${x} ${from} × (${f}). With the factor flipped, ${from} doesn't cancel and you'd get ${from}²/${to}.` };
  } },

  // ---------- money and rates (problem 4, extended) ----------
  { id: 'g-p-bars', type: 'num', topic: MONEY, make(r) {
    const [thing, unit] = r.pick([['a used sedan', 'gold bar'], ['a pickup truck', 'gold bar'], ['an electric scooter', 'silver coin'], ['a motorcycle', 'gold coin'], ['a sailboat', 'gold bar'], ['a camper van', 'platinum bar']]);
    let cost, each;
    do { each = r.int(4, 40) * 50; cost = r.int(8, 90) * 500; } while (cost % each === 0 && r.chance(0.8));
    const ans = Math.ceil(cost / each);
    return { prompt: `${thing[0].toUpperCase() + thing.slice(1)} costs ${money(cost)}. One ${unit} sells for ${money(each)}, and you can only sell whole ones. How many ${unit}s must you sell to afford it?`,
      answer: ans, tol: 0, units: `${unit}s`,
      explanation: `${money(cost)} × (1 ${unit} / ${money(each)}) = ${show(cost / each, 3)} ${unit}s${cost % each ? `, but ${Math.floor(cost / each)} isn't enough money, so round UP to ${ans}` : ''}.` };
  } },
  { id: 'g-p-afford-years', type: 'num', topic: MONEY, make(r) {
    const item = r.pick(['lab-grown diamond', 'hand-built guitar', 'custom bike frame', 'oil painting', 'sculpture']);
    const months = r.pick([2, 3, 4, 6, 8, 9]);
    const price = r.int(4, 20) * 500, cost = r.int(12, 80) * 1000;
    const n = Math.ceil(cost / price), years = (n * months) / 12;
    return { prompt: `You want a ${money(cost)} truck. Each ${item} you make sells for ${money(price)} and takes ${months} months to make (one at a time, whole ones only). How many years until you can buy the truck?`,
      answer: sig4(years), units: 'years',
      explanation: `${money(cost)} ÷ ${money(price)} = ${show(cost / price, 3)} → ${n} ${item}s; ${n} × ${months} months × (1 year / 12 months) = ${show(years, 3)} years.` };
  } },
  { id: 'g-p-profit', type: 'num', topic: RATE, make(r) {
    const days = r.pick([30, 45, 60, 90, 120, 182.5]), perDay = r.int(2, 30), price = r.int(4, 60) * 100, n = r.int(1, 6);
    const each = price - perDay * days, total = each * n;
    const span = days === 182.5 ? 'half a year (182.5 days)' : `${days} days`;
    return { prompt: `Making one gem takes ${span}, and the machine's electricity costs $${perDay} per day. Each gem sells for ${money(price)}. What is your total profit after making and selling ${n} gem${n === 1 ? '' : 's'}? (Enter a loss as a negative number.)`,
      answer: total, units: 'dollars', abs: 0.5,
      explanation: `Electricity per gem: $${perDay}/day × ${days} days = $${show(perDay * days)}. Profit per gem: ${money(price)} − $${show(perDay * days)} = $${show(each)}; × ${n} = $${show(total)}.` };
  } },
  { id: 'g-p-rate', type: 'num', topic: RATE, make(r) {
    const k = r.pick(['weeks', 'year', 'hours']);
    if (k === 'weeks') {
      const c = r.int(2, 40), w = r.int(2, 20);
      return { prompt: `A heater costs $${c} per day to run. What does it cost to run for ${w} weeks?`, answer: c * 7 * w, units: 'dollars',
        explanation: `$${c}/day × 7 days/week × ${w} weeks = $${c * 7 * w}. The weeks cancel only after converting them to days.` };
    }
    if (k === 'year') {
      const c = r.int(1, 15);
      return { prompt: `A server costs $${c} per day. What does it cost for one year (365 days)?`, answer: c * 365, units: 'dollars',
        explanation: `$${c}/day × 365 days = $${c * 365}.` };
    }
    const c = r.int(2, 9) / 10, h = r.int(2, 12);
    return { prompt: `A pump uses $${c.toFixed(2)} of electricity per hour and runs ${h} hours every day. What does it cost over 30 days?`, answer: sig4(c * h * 30), units: 'dollars',
      explanation: `$${c.toFixed(2)}/h × ${h} h/day × 30 days = $${show(c * h * 30)}. Both rates multiply: hours cancel, then days cancel.` };
  } },
];
