// Physics 121 templates: conservation of energy (KE, mgh, ½kx²) and work done by friction (Blueprint p47-49).
// Scope: courses/phys121.md.
import { sig4, show } from './kit.js';

const CON = 'Conservation of energy', FR = 'Work & friction', SP = 'Spring energy', g = 9.8;

export default [
  { id: 'g-p-e-drop', type: 'num', topic: CON, make(r) {
    const m = r.int(1, 50), h = r.int(1, 80), v = Math.sqrt(2 * g * h);
    return { prompt: `A ${m} kg ${r.pick(['rock', 'box', 'bag of sand', 'melon'])} is dropped from rest ${h} m above the ground. How fast is it moving just before it lands? (g = 9.8 m/s², no air resistance)`,
      answer: sig4(v), units: 'm/s',
      explanation: `mgh = ½mv²: the mass cancels, so v = √(2gh) = √(2 × 9.8 × ${h}) = ${show(v)} m/s.` };
  } },
  { id: 'g-p-e-ramp', type: 'num', topic: CON, make(r) {
    const m = r.int(2, 90), v0 = r.int(1, 15), h = r.int(1, 30), v = Math.sqrt(v0 * v0 + 2 * g * h);
    return { prompt: `A ${m} kg box moving at ${v0} m/s slides down a frictionless ramp that drops ${h} m. How fast is it at the bottom? (g = 9.8 m/s²)`,
      answer: sig4(v), units: 'm/s',
      explanation: `½mv₀² + mgh = ½mv²: v = √(${v0}² + 2 × 9.8 × ${h}) = ${show(v)} m/s. Energies add, speeds don't: √(2gh) + ${v0} would be wrong.` };
  } },
  { id: 'g-p-e-hill', type: 'num', topic: CON, make(r) {
    for (;;) {
      const m = r.int(2, 90), v0 = r.int(8, 30), h = r.int(1, 40);
      if (v0 * v0 - 2 * g * h < 4) continue;
      const v = Math.sqrt(v0 * v0 - 2 * g * h);
      return { prompt: `A ${m} kg cart rolling at ${v0} m/s coasts up a frictionless hill ${h} m high. How fast is it going at the top? (g = 9.8 m/s²)`,
        answer: sig4(v), units: 'm/s',
        explanation: `½mv₀² = ½mv² + mgh: v = √(${v0}² − 2 × 9.8 × ${h}) = ${show(v)} m/s. Climbing turns kinetic energy into potential energy.` };
    }
  } },
  { id: 'g-p-e-friction', type: 'num', topic: FR, make(r) {
    for (;;) {
      const m = r.int(2, 120), v0 = r.int(5, 30), d = r.int(2, 60), k = r.pick([0.1, 0.15, 0.2, 0.25, 0.3, 0.4]);
      const v2 = v0 * v0 - 2 * k * g * d;
      if (v2 < 4) continue;
      const W = k * m * g * d, v = Math.sqrt(v2);
      return { prompt: `A ${m} kg box slides at ${v0} m/s across ${d} m of level floor with μk = ${k}. How fast is it going at the end of that stretch? (g = 9.8 m/s²)`,
        answer: sig4(v), units: 'm/s',
        explanation: `Friction does W = μk·mg·d = ${show(W)} J of negative work: ½m(${v0})² − ${show(W)} = ½mv² → v = ${show(v)} m/s.` };
    }
  } },
  { id: 'g-p-e-spring', type: 'num', topic: SP, make(r) {
    const k = r.int(2, 80) * 50, x = r.int(2, 40) / 100, m = r.int(1, 20) / 2, v = x * Math.sqrt(k / m);
    return { prompt: `A spring (k = ${k} N/m) is compressed ${x} m and then launches a ${m} kg block across a frictionless floor. How fast does the block leave the spring?`,
      answer: sig4(v), units: 'm/s',
      explanation: `½kx² = ½mv²: v = x√(k/m) = ${x} × √(${k}/${m}) = ${show(v)} m/s. x is squared in the energy, so double the squeeze, double the speed.` };
  } },
];
