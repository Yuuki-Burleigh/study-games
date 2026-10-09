// Physics 121 templates: static equilibrium, net torque = 0 and net force = 0 (Blueprint p50).
// Scope: courses/phys121.md.
import { sig4, show } from './kit.js';

const TQ = 'Balancing torques', FN = 'Balancing forces', g = 9.8;

export default [
  { id: 'g-p-eq-seesaw', type: 'num', topic: TQ, make(r) {
    let m1, m2; do { m1 = r.int(15, 90); m2 = r.int(15, 90); } while (m1 === m2);
    const d1 = r.int(5, 30) / 10, d2 = (m1 * d1) / m2;
    return { prompt: `On a seesaw, a ${m1} kg person sits ${d1} m left of the pivot. How far right of the pivot must a ${m2} kg person sit to balance it? (ignore the board's weight)`,
      answer: sig4(d2), units: 'm',
      explanation: `Net torque = 0: (${m1}g)(${d1}) = (${m2}g)(d), and g cancels: d = ${m1} × ${d1} / ${m2} = ${show(d2)} m. ${m2 > m1 ? 'The heavier person sits closer.' : 'The lighter person sits farther out.'}` };
  } },
  { id: 'g-p-eq-mass', type: 'num', topic: TQ, make(r) {
    const m1 = r.int(1, 40) / 2, d1 = r.int(5, 50) / 10, d2 = r.int(5, 50) / 10, m2 = (m1 * d1) / d2;
    return { prompt: `A ${m1} kg weight hangs ${d1} m left of a balance beam's pivot. What mass hung ${d2} m right of the pivot keeps it level? (ignore the beam's weight)`,
      answer: sig4(m2), units: 'kg',
      explanation: `Torques cancel: ${m1} × ${d1} = m × ${d2}, so m = ${show(m2)} kg. Mass alone doesn't balance; mass × distance does.` };
  } },
  { id: 'g-p-eq-support', type: 'num', topic: FN, make(r) {
    const mb = r.int(5, 60), m1 = r.int(15, 90), m2 = r.int(15, 90), N = (mb + m1 + m2) * g;
    return { prompt: `A ${mb} kg board rests on a single pivot, balanced with a ${m1} kg person and a ${m2} kg person sitting on it. How hard must the pivot push up on the board? (g = 9.8 m/s²)`,
      answer: sig4(N), units: 'N',
      explanation: `Net force = 0 too: the pivot holds up every weight, (${mb} + ${m1} + ${m2}) × 9.8 = ${show(N)} N. Leaving out the board's own weight is the classic miss.` };
  } },
];
