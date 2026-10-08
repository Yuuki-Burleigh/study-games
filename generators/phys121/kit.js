// Physics 121 helpers: sig-fig rules, scientific notation, compass directions and vector sums, so every template
// computes its answer the same (tested) way. Physics answers aren't run through Java: tests/phys121.test.js checks
// these helpers against worked values, and tools/check_physics.py re-derives the hand-written answers.

// ---- numbers ----
// Keep stored answers tidy (no float noise like 18.285714285714285): 4 significant figures.
export const sig4 = (x) => (x === 0 ? 0 : Number(x.toPrecision(4)) || 0);
// A number for a prompt: at most d decimals, no trailing zeros ("12.5", "-300").
export const show = (x, d = 2) => String(Number(x.toFixed(d)) || 0);
// In a formula: negatives get parentheses, "5 + (-3)".
export const par = (x, d = 2) => (x < 0 ? `(${show(x, d)})` : show(x, d));
// Signed velocity text: "-25 m/s" / "+25 m/s".
export const signed = (x, unit) => `${x > 0 ? '+' : ''}${show(x)} ${unit}`;

// ---- significant figures ----
// Rules: nonzero digits count; zeros between them count; leading zeros never count; trailing zeros count only when
// the number has a decimal point (so "190" has 2, but "190." and "190.0" have 3 and 4).
export function sigFigs(text) {
  const s = String(text).replace(/^[+-]/, '');
  const hasPoint = s.includes('.');
  let d = s.replace('.', '').replace(/^0+/, '');
  if (!hasPoint) d = d.replace(/0+$/, '');
  return d.length;
}

// The significant digits and the power of ten of a written number (no E-notation input).
function parts(text) {
  const s = String(text).replace(/^[+-]/, '');
  const [int, frac = ''] = s.split('.');
  const intDigits = int.replace(/^0+/, '');
  const exp = intDigits.length ? intDigits.length - 1 : -(frac.search(/[1-9]/) + 1);
  return { digits: s.replace('.', '').replace(/^0+/, '').slice(0, sigFigs(text)), exp };
}

const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
export const pow10 = (e) => '10' + String(e).split('').map((c) => SUP[c]).join('');
export const sciText = (digits, exp) => `${digits[0]}${digits.length > 1 ? '.' + digits.slice(1) : ''} × ${pow10(exp)}`;

// "0.0500" -> "5.00 × 10⁻²", "190" -> "1.9 × 10²", "140." -> "1.40 × 10²": the mantissa keeps exactly the sig figs.
export function toSci(text) {
  const { digits, exp } = parts(text);
  return sciText(digits, exp);
}
export const sciExp = (text) => parts(text).exp;
export const sciDigits = (text) => parts(text).digits;

// A random written number that exercises one sig-fig rule: leading zeros, captive zeros, trailing zeros with and
// without a decimal point, or a trailing decimal point ("250.").
export function sigNumber(r, kind = r.pick(['small', 'plain', 'point', 'decimal', 'captive'])) {
  const nz = () => String(r.int(1, 9));
  const any = () => String(r.int(0, 9));
  const core = (n) => (n === 1 ? nz() : nz() + Array.from({ length: n - 2 }, any).join('') + nz());
  switch (kind) {
    case 'small': return '0.' + '0'.repeat(r.int(0, 3)) + core(r.int(1, 3)) + '0'.repeat(r.int(0, 2));
    case 'plain': return core(r.int(1, 3)) + '0'.repeat(r.int(1, 3));
    case 'point': return core(r.int(1, 2)) + '0'.repeat(r.int(1, 2)) + '.';
    case 'decimal': return core(r.int(1, 3)) + '.' + Array.from({ length: r.int(0, 2) }, any).join('') + '0'.repeat(r.int(1, 2));
    default: return nz() + '0'.repeat(r.int(1, 3)) + nz() + (r.chance(0.5) ? '.' + any() + nz() : '');
  }
}

// ---- vectors and directions ----
export const CARD = { E: 0, N: 90, W: 180, S: 270 };
export const WORD = { E: 'East', N: 'North', W: 'West', S: 'South' };
const rad = (deg) => (deg * Math.PI) / 180;
export const deg = (r) => (r * 180) / Math.PI;
export const norm360 = (p) => ((p % 360) + 360) % 360;

// "a° <toward> of <from>": start pointing <from>, rotate a degrees toward <toward>. Returns the polar angle (CCW from +x / East).
export function compassToPolar(a, toward, from) {
  const turn = norm360(CARD[toward] - CARD[from]);
  if (turn !== 90 && turn !== 270) throw new Error(`bad direction ${toward} of ${from}`);
  return norm360(CARD[from] + (turn === 90 ? a : -a));
}
export const compassText = (a, toward, from) => `${show(a, 1)}° ${WORD[toward]} of ${WORD[from]}`;

// A polar angle described from the East/West axis, the way the class writes it: "35° North of West".
export function polarToCompass(p) {
  p = norm360(p);
  if (p < 90) return compassText(p, 'N', 'E');
  if (p < 180) return compassText(180 - p, 'N', 'W');
  if (p < 270) return compassText(p - 180, 'S', 'W');
  return compassText(360 - p, 'S', 'E');
}

export const components = (mag, polar) => [mag * Math.cos(rad(polar)), mag * Math.sin(rad(polar))];
export function addVectors(vs) {
  let x = 0, y = 0;
  for (const v of vs) { const [a, b] = components(v.mag, v.polar); x += a; y += b; }
  return { x, y, mag: Math.hypot(x, y), polar: norm360(deg(Math.atan2(y, x))) };
}

// A random vector with an integer magnitude and a direction written either from the E/W axis or the N/S axis
// ("30° North of West" or "60° West of North"), or due along an axis now and then.
export function randomVector(r, lo = 5, hi = 60) {
  const mag = r.int(lo, hi);
  if (r.chance(0.15)) {
    const c = r.pick(['N', 'S', 'E', 'W']);
    return { mag, polar: CARD[c], dir: `due ${WORD[c]}` };
  }
  const a = r.int(10, 80);
  const [toward, from] = r.chance(0.6)
    ? [r.pick(['N', 'S']), r.pick(['E', 'W'])]
    : [r.pick(['E', 'W']), r.pick(['N', 'S'])];
  return { mag, polar: compassToPolar(a, toward, from), dir: compassText(a, toward, from) };
}
