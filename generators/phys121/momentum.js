// Physics 121 templates: momentum, collisions (stick together / elastic) and impulse (Blueprint p22-31).
// Right = +. Scope: courses/phys121.md.
import { sig4, show } from './kit.js';

const IN = 'Inelastic collisions', EL = 'Elastic collisions', IMP = 'Impulse';
const OBJ = ['cart', 'puck', 'sled', 'block'];

export default [
  { id: 'g-p-mom-stick', type: 'num', topic: IN, make(r) {
    const m1 = r.int(2, 12) * 5, v1 = r.int(2, 15), m2 = r.int(2, 12) * 5, o = r.pick(OBJ);
    const k = r.pick(['rest', 'left', 'right']), s = k === 'right' ? r.int(1, Math.max(1, v1 - 1)) : r.int(1, 15);
    const v2 = k === 'rest' ? 0 : k === 'left' ? -s : s;
    const desc = k === 'rest' ? 'at rest' : `moving ${k} at ${s} m/s`;
    const vf = (m1 * v1 + m2 * v2) / (m1 + m2);
    return { prompt: `A ${m1} kg ${o} moving right at ${v1} m/s hits a ${m2} kg ${o} ${desc}. They stick together. What is their velocity right after? (right = +)`,
      answer: sig4(vf), units: 'm/s',
      explanation: `Momentum before = after: (${m1})(${v1}) + (${m2})(${v2}) = (${m1 + m2})v_f, so v_f = ${show(vf)} m/s.${v2 < 0 ? ' The left-moving one counts as negative momentum.' : ''}` };
  } },
  { id: 'g-p-elastic-1', type: 'num', topic: EL, make(r) {
    let m1, m2; do { m1 = r.int(1, 10); m2 = r.int(1, 10); } while (m1 === m2);
    const v = r.int(2, 12), vf = ((m1 - m2) / (m1 + m2)) * v;
    return { prompt: `A ${m1} kg ball moving right at ${v} m/s hits a ${m2} kg ball at rest head-on, and the collision is elastic. What is the ${m1} kg ball's velocity after? (right = +)`,
      answer: sig4(vf), units: 'm/s',
      explanation: `Elastic, target at rest: v₁f = (m₁ − m₂)/(m₁ + m₂) · v₁ = (${m1 - m2}/${m1 + m2})(${v}) = ${show(vf)} m/s. ${m1 < m2 ? 'The lighter ball bounces back, so it is negative.' : 'The heavier ball keeps going forward, slower.'}` };
  } },
  { id: 'g-p-elastic-2', type: 'num', topic: EL, make(r) {
    let m1, m2; do { m1 = r.int(1, 10); m2 = r.int(1, 10); } while (m1 === m2);
    const v = r.int(2, 12), vf = ((2 * m1) / (m1 + m2)) * v;
    return { prompt: `A ${m1} kg ball moving right at ${v} m/s hits a ${m2} kg ball at rest head-on, and the collision is elastic. What is the ${m2} kg ball's velocity after? (right = +)`,
      answer: sig4(vf), units: 'm/s',
      explanation: `Elastic, target at rest: v₂f = 2m₁/(m₁ + m₂) · v₁ = (${2 * m1}/${m1 + m2})(${v}) = ${show(vf)} m/s. Sticking together would give ${show((m1 * v) / (m1 + m2))} m/s instead.` };
  } },
  { id: 'g-p-impulse-v', type: 'num', topic: IMP, make(r) {
    const m = r.int(2, 40) * 5, v0 = r.int(2, 30), F = r.int(1, 40) * 10, t = r.int(1, 10), dir = r.pick(['left', 'right']);
    const J = (dir === 'left' ? -1 : 1) * F * t, vf = v0 + J / m;
    return { prompt: `A ${m} kg ${r.pick(OBJ)} moving right at ${v0} m/s is pushed by a constant ${F} N force pointing ${dir} for ${t} s. What is its velocity afterward? (right = +)`,
      answer: sig4(vf), units: 'm/s',
      explanation: `J = FΔt = ${J} N·s ${dir === 'left' ? '(negative: it pushes left)' : ''}. p_f = p_i + J = ${m * v0} + (${J}) = ${m * v0 + J} kg·m/s, so v_f = ${show(vf)} m/s.` };
  } },
  { id: 'g-p-impulse-area', type: 'num', topic: IMP, make(r) {
    const F = r.int(2, 50) * 10, t1 = r.int(1, 8), t2 = r.int(1, 6), J = F * t1 + (F * t2) / 2;
    return { prompt: `A force-vs-time graph shows a constant ${F} N from t = 0 to t = ${t1} s, then a straight-line drop to 0 N at t = ${t1 + t2} s. What impulse does the force give?`,
      answer: sig4(J), units: 'N·s',
      explanation: `Impulse is the area under F-t: rectangle ${F} × ${t1} = ${F * t1} plus triangle ½ × ${F} × ${t2} = ${(F * t2) / 2}, total ${J} N·s. FΔt with the peak force over the whole ${t1 + t2} s would overcount.` };
  } },
];
