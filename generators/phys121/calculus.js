// Physics 121 templates: derivatives and integrals of polynomial motion (Mechanics Blueprint p15).
// Scope: courses/phys121.md.
import { choices } from '../../gen-kit.js';
import { sig4 } from './kit.js';

const DER = 'Derivatives', INT = 'Integrals';
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const nz = (r, lo, hi) => { let x; do { x = r.int(lo, hi); } while (!x); return x; };
const sgn = (c) => (c < 0 ? '−' : '+');
// "2t³ + 5t² − 4t + 7"
const co = (c) => (Math.abs(c) === 1 ? '' : Math.abs(c)); // 1t² is written t²
const cubic = (A, B, C, D) => `${co(A)}t³ ${sgn(B)} ${co(B)}t² ${sgn(C)} ${co(C)}t ${sgn(D)} ${Math.abs(D)}`;
const powT = (n) => (n === 1 ? 't' : `t${SUP[n]}`);

export default [
  { id: 'g-p-calc-v', type: 'num', topic: DER, make(r) {
    const A = r.int(1, 5), B = nz(r, -9, 9), C = nz(r, -9, 9), D = nz(r, -9, 9), T = r.int(1, 4);
    const v = 3 * A * T * T + 2 * B * T + C;
    return { prompt: `An object's position is x(t) = ${cubic(A, B, C, D)} (meters, t in seconds). What is its velocity at t = ${T} s?`,
      answer: v, units: 'm/s', tol: 0,
      explanation: `v(t) = dx/dt = ${3 * A}t² ${sgn(2 * B)} ${Math.abs(2 * B)}t ${sgn(C)} ${Math.abs(C)} (the constant ${D} drops out). At t = ${T}: ${v} m/s. Plugging t into x(t) gives the position, not the velocity.` };
  } },
  { id: 'g-p-calc-a', type: 'num', topic: DER, make(r) {
    const A = r.int(1, 5), B = nz(r, -9, 9), C = nz(r, -9, 9), D = nz(r, -9, 9), T = r.int(1, 4);
    const a = 6 * A * T + 2 * B;
    return { prompt: `An object's position is x(t) = ${cubic(A, B, C, D)} (meters, t in seconds). What is its acceleration at t = ${T} s?`,
      answer: a, units: 'm/s²', tol: 0,
      explanation: `Differentiate twice: v(t) = ${3 * A}t² ${sgn(2 * B)} ${Math.abs(2 * B)}t ${sgn(C)} ${Math.abs(C)}, then a(t) = ${6 * A}t ${sgn(2 * B)} ${Math.abs(2 * B)}. At t = ${T}: ${a} m/s².` };
  } },
  { id: 'g-p-calc-int', type: 'num', topic: INT, make(r) {
    const A = r.pick([3, 6, 9]), B = 2 * nz(r, -4, 4), C = r.int(1, 9), T = r.int(1, 4);
    const x = (A / 3) * T ** 3 + (B / 2) * T ** 2 + C * T;
    return { prompt: `An object's velocity is v(t) = ${A}t² ${sgn(B)} ${Math.abs(B)}t + ${C} (m/s, t in seconds), and it starts at x = 0 when t = 0. Where is it at t = ${T} s?`,
      answer: sig4(x), units: 'm',
      explanation: `Integrate: x(t) = ${A / 3}t³ ${sgn(B)} ${Math.abs(B / 2)}t² + ${C}t + 0 (the constant is the starting position, 0). At t = ${T}: ${x} m. v(${T}) × ${T} would only work for a constant velocity.` };
  } },
  { id: 'g-p-calc-power', type: 'mc', topic: DER, make(r) {
    const A = r.int(2, 9), n = r.int(2, 6);
    const ans = `v(t) = ${A * n}${powT(n - 1)}`;
    return { prompt: `x(t) = ${A}${powT(n)} (meters). Which is the velocity function v(t)?`, answer: ans,
      choices: choices(r, ans, [`v(t) = ${A}${powT(n - 1)}`, `v(t) = ${A * n}${powT(n + 1)}`, `v(t) = ${n}${powT(n - 1)}`], [`v(t) = ${A * n}${powT(n)}`]),
      explanation: `Power rule: d/dt (t${SUP[n]}) = ${n}${powT(n - 1)}, so the coefficient is multiplied by ${n} AND the power drops by one: ${ans}.` };
  } },
];
