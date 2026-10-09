// Physics 121 templates: projectile motion, x and y as two 1D problems that share only time (Blueprint p16-21).
// Up = +y, a_y = −9.8 m/s², a_x = 0, no air resistance. Scope: courses/phys121.md.
import { sig4, show } from './kit.js';

const H = 'Horizontal launch', ANG = 'Angled launch', g = 9.8;
const PLACE = ['cliff', 'roof', 'bridge', 'ledge'], THING = ['ball', 'stone', 'package', 'marble'];
const rad = (d) => (d * Math.PI) / 180;
const G = '(g = 9.8 m/s², no air resistance)';
function ledge(r) {
  const h = r.int(5, 120), v = r.int(4, 30);
  return { h, v, t: Math.sqrt((2 * h) / g), text: `A ${r.pick(THING)} leaves a ${h} m high ${r.pick(PLACE)} at ${v} m/s horizontally.` };
}
function launch(r) {
  const v = r.int(10, 40), th = r.int(15, 75);
  return { v, th, vx: v * Math.cos(rad(th)), vy: v * Math.sin(rad(th)), text: `A ball is launched from level ground at ${v} m/s, ${th}° above the horizontal.` };
}

export default [
  { id: 'g-p-proj-time', type: 'num', topic: H, make(r) {
    const L = ledge(r);
    return { prompt: `${L.text} How long until it hits the ground? ${G}`, answer: sig4(L.t), units: 's',
      explanation: `The fall is the limiting factor: Δy = −${L.h} m, v₀y = 0, so −${L.h} = ½(−9.8)t² → t = ${show(L.t)} s. The ${L.v} m/s is horizontal and has no effect on the fall time.` };
  } },
  { id: 'g-p-proj-range', type: 'num', topic: H, make(r) {
    const L = ledge(r);
    return { prompt: `${L.text} How far from the base does it land? ${G}`, answer: sig4(L.v * L.t), units: 'm',
      explanation: `Find time from the fall first: t = √(2·${L.h}/9.8) = ${show(L.t)} s. Then x has no acceleration: Δx = ${L.v} × ${show(L.t)} = ${show(L.v * L.t)} m.` };
  } },
  { id: 'g-p-proj-vy', type: 'num', topic: H, make(r) {
    const L = ledge(r), vy = -g * L.t;
    return { prompt: `${L.text} What is its vertical velocity just before it lands? (up = +) ${G}`, answer: sig4(vy), units: 'm/s',
      explanation: `v_y = v₀y + a_y t = 0 + (−9.8)(${show(L.t)}) = ${show(vy)} m/s, negative because it's moving down. The horizontal ${L.v} m/s never changes and isn't part of v_y.` };
  } },
  { id: 'g-p-proj-maxh', type: 'num', topic: ANG, make(r) {
    const L = launch(r), h = L.vy ** 2 / (2 * g);
    return { prompt: `${L.text} How high does it rise? ${G}`, answer: sig4(h), units: 'm',
      explanation: `Only v₀y = ${L.v} sin ${L.th}° = ${show(L.vy)} m/s matters. At the top v_y = 0: 0 = v₀y² + 2(−9.8)Δy → Δy = ${show(h)} m. Using all ${L.v} m/s overestimates it.` };
  } },
  { id: 'g-p-proj-range-level', type: 'num', topic: ANG, make(r) {
    const L = launch(r), t = (2 * L.vy) / g;
    return { prompt: `${L.text} How far away does it land on the level ground? ${G}`, answer: sig4(L.vx * t), units: 'm',
      explanation: `Time from y: it lands when Δy = 0, so t = 2v₀y/9.8 = ${show(t)} s (v₀y = ${show(L.vy)} m/s). Then Δx = v₀x t = ${show(L.vx)} × ${show(t)} = ${show(L.vx * t)} m.` };
  } },
  { id: 'g-p-proj-wall', type: 'num', topic: ANG, make(r) {
    for (;;) {
      const L = launch(r), d = r.int(5, 40), t = d / L.vx, y = L.vy * t - (g / 2) * t * t;
      if (y < 0.5) continue;
      return { prompt: `A ball is launched from the ground at ${L.v} m/s, ${L.th}° above the horizontal, toward a wall ${d} m away. How high up the wall does it hit? ${G}`,
        answer: sig4(y), units: 'm',
        explanation: `Here Δx is the limiting factor: t = ${d} / (${L.v} cos ${L.th}°) = ${show(t, 3)} s. Then Δy = (${show(L.vy)})(${show(t, 3)}) − 4.9(${show(t, 3)})² = ${show(y)} m.` };
    }
  } },
];
