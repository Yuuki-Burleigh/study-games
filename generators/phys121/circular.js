// Physics 121 templates: centripetal acceleration and force, Newton's gravity, orbits (Blueprint p39-41).
// Scope: courses/phys121.md.
import { sig4, show, pow10 } from './kit.js';

const CIRC = 'Centripetal motion', GRAV = 'Gravity & orbits', G = 6.67e-11;
const GTXT = '(G = 6.67 × 10⁻¹¹ N·m²/kg²)';
const sci = (m, e) => `${m.toFixed(1)} × ${pow10(e)}`;

export default [
  { id: 'g-p-circ-ac', type: 'num', topic: CIRC, make(r) {
    const v = r.int(3, 40), rr = r.int(5, 300), a = (v * v) / rr;
    return { prompt: `A car drives around a curve of radius ${rr} m at a steady ${v} m/s. What is its centripetal acceleration?`, answer: sig4(a), units: 'm/s²',
      explanation: `Steady speed still means acceleration, because the direction changes: a = v²/r = ${v}²/${rr} = ${show(a)} m/s², toward the center.` };
  } },
  { id: 'g-p-circ-force', type: 'num', topic: CIRC, make(r) {
    const m = r.int(1, 20) / 2, v = r.int(2, 15), rr = r.int(2, 30) / 10, F = (m * v * v) / rr;
    return { prompt: `A ${m} kg ball on a string whirls in a horizontal circle of radius ${rr} m at ${v} m/s on a frictionless table. What is the tension in the string?`,
      answer: sig4(F), units: 'N',
      explanation: `The string supplies the centripetal force: F = mv²/r = ${m} × ${v}² / ${rr} = ${show(F)} N. Double the speed and the tension quadruples.` };
  } },
  { id: 'g-p-circ-speed', type: 'num', topic: CIRC, make(r) {
    const m = r.int(6, 30) * 50, F = r.int(2, 20) * 500, rr = r.int(10, 200), v = Math.sqrt((F * rr) / m);
    return { prompt: `A ${m} kg car can get at most ${F} N of sideways friction on a flat curve of radius ${rr} m. What is the fastest it can take the curve?`,
      answer: sig4(v), units: 'm/s',
      explanation: `Friction is the centripetal force: ${F} = ${m}·v²/${rr} → v = √(${F} × ${rr} / ${m}) = ${show(v)} m/s.` };
  } },
  { id: 'g-p-grav-F', type: 'num', topic: GRAV, make(r) {
    const a = r.int(10, 99) / 10, b = r.int(10, 99) / 10, d = r.int(10, 99) / 10;
    const m1 = a * 1e24, m2 = b * 1e22, dd = d * 1e8, F = (G * m1 * m2) / (dd * dd);
    return { prompt: `A planet of mass ${sci(a, 24)} kg and a moon of mass ${sci(b, 22)} kg are ${sci(d, 8)} m apart (center to center). What is the gravitational force between them? ${GTXT}`,
      answer: sig4(F), units: 'N',
      explanation: `F = Gm₁m₂/d² = (6.67 × 10⁻¹¹)(${a} × 10²⁴)(${b} × 10²²)/(${d} × 10⁸)² = ${F.toPrecision(3).replace(/e\+?/, ' × 10^')} N. Square the distance, and keep the powers of ten straight.` };
  } },
  { id: 'g-p-orbit-v', type: 'num', topic: GRAV, make(r) {
    const a = r.int(10, 99) / 10, d = r.int(65, 500) / 10, M = a * 1e24, rr = d * 1e6, v = Math.sqrt((G * M) / rr);
    return { prompt: `A satellite orbits a planet of mass ${sci(a, 24)} kg at ${sci(d, 6)} m from the planet's center. How fast does it move? ${GTXT}`,
      answer: sig4(v), units: 'm/s',
      explanation: `Gravity is the centripetal force: GMm/r² = mv²/r, so v = √(GM/r) = ${show(v, 0)} m/s. The satellite's own mass cancels.` };
  } },
];
