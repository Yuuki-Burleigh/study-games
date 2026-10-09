// Physics 121 templates: F = ma, static vs kinetic friction, inclines (Blueprint p32-38).
// g = 9.8 m/s². Scope: courses/phys121.md.
import { choices } from '../../gen-kit.js';
import { sig4, show } from './kit.js';

const ST = 'Static friction', KIN = 'Kinetic friction', INC = 'Inclines', g = 9.8;
const rad = (d) => (d * Math.PI) / 180;
const MU = () => [0.2, 0.3, 0.4, 0.5, 0.6, 0.7];
// μs > μk, as on every real surface.
function mus(r) {
  const s = r.pick(MU()), k = Number((s - r.pick([0.05, 0.1, 0.15])).toFixed(2));
  return { s, k };
}

export default [
  { id: 'g-p-f-static', type: 'num', topic: ST, make(r) {
    const m = r.int(5, 120), { s, k } = mus(r), F = s * m * g;
    return { prompt: `A ${m} kg box sits on a level floor with μs = ${s} and μk = ${k}. What is the smallest horizontal push that starts it moving? (g = 9.8 m/s²)`,
      answer: sig4(F), units: 'N',
      explanation: `It starts moving once the push beats the MAX static friction: μs·mg = ${s} × ${m} × 9.8 = ${show(F)} N. μk only matters once it's already sliding.` };
  } },
  { id: 'g-p-f-moves', type: 'mc', topic: ST, make(r) {
    for (;;) {
      const m = r.int(10, 80), { s, k } = mus(r), max = s * m * g, P = r.int(2, 60) * 10;
      if (Math.abs(P - max) < 0.05 * max) continue;
      const a = (P - k * m * g) / m;
      const stay = `It stays put (friction = ${show(P, 1)} N)`, slide = `It slides (a = ${show(a)} m/s²)`;
      const moves = P > max, ans = moves ? slide : stay;
      const pool = [moves ? stay : slide, `It stays put (friction = ${show(max, 1)} N)`, `It slides (a = ${show(P / m)} m/s²)`];
      if (!moves) pool[0] = `It slides (a = ${show(Math.abs(a))} m/s²)`;
      return { prompt: `A ${m} kg box rests on a level floor (μs = ${s}, μk = ${k}). You push it horizontally with ${P} N. What happens? (g = 9.8 m/s²)`,
        answer: ans, choices: choices(r, ans, pool),
        explanation: moves ? `${P} N beats the max static friction μs·mg = ${show(max, 1)} N, so it slides, and then KINETIC friction μk·mg = ${show(k * m * g, 1)} N acts: a = (${P} − ${show(k * m * g, 1)})/${m} = ${show(a)} m/s².`
          : `${P} N is less than the max static friction μs·mg = ${show(max, 1)} N, so it doesn't move. Static friction only matches the push (${P} N); ${show(max, 1)} N is its limit, not its value.` };
    }
  } },
  { id: 'g-p-f-kin-accel', type: 'num', topic: KIN, make(r) {
    for (;;) {
      const m = r.int(5, 80), { s, k } = mus(r), P = r.int(2, 80) * 10;
      if (P <= s * m * g * 1.05) continue;
      const fk = k * m * g, a = (P - fk) / m;
      return { prompt: `A ${m} kg box on a level floor (μs = ${s}, μk = ${k}) is pushed horizontally with ${P} N, enough to make it slide. What is its acceleration? (g = 9.8 m/s²)`,
        answer: sig4(a), units: 'm/s²',
        explanation: `Sliding means kinetic friction: f = μk·mg = ${show(fk)} N. F_net = ${P} − ${show(fk)} = ${show(P - fk)} N, so a = F_net/m = ${show(a)} m/s².` };
    }
  } },
  { id: 'g-p-f-slide-stop', type: 'num', topic: KIN, make(r) {
    const m = r.int(5, 900), v = r.int(2, 25), k = r.pick([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.8]), a = k * g, d = (v * v) / (2 * a);
    return { prompt: `A ${m} kg sled slides at ${v} m/s onto a rough patch with μk = ${k}. How far does it slide before stopping? (g = 9.8 m/s²)`,
      answer: sig4(d), units: 'm',
      explanation: `a = −μk·mg/m = −${show(a)} m/s² (the mass cancels). 0 = ${v}² + 2(−${show(a)})Δx → Δx = ${show(d)} m.` };
  } },
  { id: 'g-p-f-incline-normal', type: 'num', topic: INC, make(r) {
    const m = r.int(5, 120), th = r.int(10, 60), N = m * g * Math.cos(rad(th));
    return { prompt: `A ${m} kg crate rests on a ramp tilted ${th}° above horizontal. What is the normal force on it? (g = 9.8 m/s²)`,
      answer: sig4(N), units: 'N',
      explanation: `Tilt the axes to the ramp: the normal force balances the part of the weight into the ramp, mg cos ${th}° = ${show(N)} N. It's less than mg = ${show(m * g)} N; mg sin ${th}° is the part along the ramp.` };
  } },
  { id: 'g-p-f-incline-accel', type: 'num', topic: INC, make(r) {
    for (;;) {
      const m = r.int(5, 120), th = r.int(15, 65), { s, k } = mus(r);
      if (Math.tan(rad(th)) <= s * 1.05) continue;
      const a = g * (Math.sin(rad(th)) - k * Math.cos(rad(th)));
      return { prompt: `A ${m} kg block on a ${th}° ramp has μs = ${s} and μk = ${k}, and it slides down. What is its acceleration down the ramp? (g = 9.8 m/s²)`,
        answer: sig4(a), units: 'm/s²',
        explanation: `Along the ramp: mg sin ${th}° pulls down, kinetic friction μk·mg cos ${th}° pushes back. a = 9.8(sin ${th}° − ${k} cos ${th}°) = ${show(a)} m/s². The mass cancels.` };
    }
  } },
];
