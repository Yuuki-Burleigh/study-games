// Physics 121 templates: rotational kinematics, torque, τ = Iα (Blueprint p42-46). Angles in radians.
// Scope: courses/phys121.md.
import { sig4, show } from './kit.js';

const RK = 'Rotational kinematics', TQ = 'Torque', IA = 'Moment of inertia';
const rad = (d) => (d * Math.PI) / 180;
const THING = ['wheel', 'fan', 'grinding disk', 'merry-go-round'];

export default [
  { id: 'g-p-rot-alpha', type: 'num', topic: RK, make(r) {
    let w0, w1; do { w0 = r.int(0, 40); w1 = r.int(0, 60); } while (w0 === w1);
    const t = r.int(2, 12), a = (w1 - w0) / t;
    return { prompt: `A ${r.pick(THING)} goes from ${w0} rad/s to ${w1} rad/s in ${t} s. What is its angular acceleration?`, answer: sig4(a), units: 'rad/s²',
      explanation: `Same as a = Δv/Δt: α = (${w1} − ${w0})/${t} = ${show(a)} rad/s²${a < 0 ? ', negative because it is slowing down' : ''}.` };
  } },
  { id: 'g-p-rot-angle', type: 'num', topic: RK, make(r) {
    const w0 = r.int(0, 20), a = r.int(1, 8), t = r.int(2, 10), th = w0 * t + (a * t * t) / 2;
    return { prompt: `A ${r.pick(THING)} spinning at ${w0} rad/s speeds up with a constant angular acceleration of ${a} rad/s² for ${t} s. Through what angle does it turn?`,
      answer: sig4(th), units: 'rad',
      explanation: `Δθ = ω₀t + ½αt² (the Δx equation with rotational symbols) = ${w0}(${t}) + ½(${a})(${t})² = ${th} rad.` };
  } },
  { id: 'g-p-rot-revs', type: 'num', topic: RK, make(r) {
    const w = r.int(3, 60), t = r.int(5, 120), n = (w * t) / (2 * Math.PI);
    return { prompt: `A ${r.pick(THING)} turns at a steady ${w} rad/s for ${t} s. How many rotations (revolutions) is that?`, answer: sig4(n), units: 'rotations',
      explanation: `Δθ = ωt = ${w * t} rad, and one rotation is 2π rad: ${w * t} / 2π = ${show(n)} rotations.` };
  } },
  { id: 'g-p-torque', type: 'num', topic: TQ, make(r) {
    const L = r.int(10, 60) / 100, F = r.int(5, 100) * 2, th = r.int(15, 165), tau = L * F * Math.sin(rad(th));
    return { prompt: `A ${L} m long wrench gets a ${F} N push at its end, at ${th}° to the handle. What is the magnitude of the torque?`, answer: sig4(tau), units: 'N·m',
      explanation: `|τ| = rF sin θ = (${L})(${F}) sin ${th}° = ${show(tau)} N·m. Only the part of the force perpendicular to the wrench turns it; at 90° you'd get the most (${show(L * F)} N·m).` };
  } },
  { id: 'g-p-rod-alpha', type: 'num', topic: IA, make(r) {
    const m = r.int(1, 40), L = r.int(1, 12), F = r.int(2, 60), I = (m * L * L) / 12, a = (F * (L / 2)) / I;
    return { prompt: `A uniform ${m} kg rod, ${L} m long, pivots about its center (I = mL²/12). A ${F} N force pushes perpendicular to it at one end. What is its angular acceleration?`,
      answer: sig4(a), units: 'rad/s²',
      explanation: `τ = rF with r = L/2 = ${L / 2} m: τ = ${show(F * L / 2)} N·m. I = ${show(I)} kg·m². α = τ/I = ${show(a)} rad/s². Using r = L (the whole rod) is the usual slip.` };
  } },
];
