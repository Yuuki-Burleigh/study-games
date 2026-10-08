// Physics 121 templates: vector components, adding vectors, and stating the resultant's magnitude and direction
// (polar angle or "θ° North of West" style), from Quiz 1 problem 1, extended. East = +x, North = +y.
// Scope: courses/phys121.md.
import { choices } from '../../gen-kit.js';
import { sig4, show, randomVector, addVectors, components, polarToCompass, norm360 } from './kit.js';

const COMP = 'Components', ADD = 'Adding vectors', POLAR = 'Direction (polar angle)', COMPASS = 'Direction (compass)',
  SUB = 'Vector subtraction', MAG = 'Magnitude of a sum';
const NOUN = ['displacement', 'hike', 'flight leg', 'boat trip', 'walk', 'drive'];
// Far enough from an axis that the quadrant (and the 0°/360° wrap) is never in doubt.
const offAxis = (p) => Math.min(...[0, 90, 180, 270, 360].map((a) => Math.abs(p - a))) > 3;
const list = (vs) => vs.map((v, k) => `${String.fromCharCode(65 + k)} = ${v.mag} m, ${v.dir}`).join('; ');

// 2 or 3 vectors whose sum is a decent size and clearly inside one quadrant.
function sum(r, n = r.int(2, 3)) {
  for (;;) {
    const vs = Array.from({ length: n }, () => randomVector(r));
    const R = addVectors(vs);
    if (R.mag >= 5 && offAxis(R.polar)) return { vs, R };
  }
}
const thetaX = (p) => { p = norm360(p); return p < 90 ? p : p < 180 ? 180 - p : p < 270 ? p - 180 : 360 - p; };

export default [
  // ---------- components ----------
  { id: 'g-p-comp-x', type: 'num', topic: COMP, make(r) {
    let v; do { v = randomVector(r); } while (!offAxis(v.polar));
    const [x] = components(v.mag, v.polar);
    return { prompt: `A ${r.pick(NOUN)} is ${v.mag} m, ${v.dir}. What is its x-component? (East = +x)`, answer: sig4(x), units: 'm', abs: 0.05,
      explanation: `It points ${thetaX(v.polar).toFixed(0)}° from the East-West axis, so |x| = ${v.mag} cos ${thetaX(v.polar).toFixed(0)}° = ${show(Math.abs(x))} m, and it's ${x < 0 ? 'negative (it points West)' : 'positive (it points East)'}. When the angle is measured from North or South, the x-part uses sin, not cos.` };
  } },
  { id: 'g-p-comp-y', type: 'num', topic: COMP, make(r) {
    let v; do { v = randomVector(r); } while (!offAxis(v.polar));
    const [, y] = components(v.mag, v.polar);
    return { prompt: `A ${r.pick(NOUN)} is ${v.mag} m, ${v.dir}. What is its y-component? (North = +y)`, answer: sig4(y), units: 'm', abs: 0.05,
      explanation: `It points ${thetaX(v.polar).toFixed(0)}° from the East-West axis, so |y| = ${v.mag} sin ${thetaX(v.polar).toFixed(0)}° = ${show(Math.abs(y))} m, and it's ${y < 0 ? 'negative (it points South)' : 'positive (it points North)'}.` };
  } },
  { id: 'g-p-comp-signs', type: 'mc', topic: COMP, make(r) {
    let v; do { v = randomVector(r); } while (!offAxis(v.polar));
    const [x, y] = components(v.mag, v.polar), sx = x < 0 ? '−' : '+', sy = y < 0 ? '−' : '+';
    const ans = `x ${sx}, y ${sy}`, f = (s) => (s === '+' ? '−' : '+');
    return { prompt: `A vector is ${v.mag} m, ${v.dir}. What are the signs of its components? (East = +x, North = +y)`, answer: ans,
      choices: choices(r, ans, [`x ${f(sx)}, y ${sy}`, `x ${sx}, y ${f(sy)}`, `x ${f(sx)}, y ${f(sy)}`]),
      explanation: `${v.dir} points ${y < 0 ? 'South' : 'North'}-${x < 0 ? 'West' : 'East'}: West and South components are negative, whichever axis the angle is measured from.` };
  } },

  // ---------- adding vectors ----------
  { id: 'g-p-res-mag', type: 'num', topic: ADD, make(r) {
    const { vs, R } = sum(r);
    return { prompt: `Add the vectors ${list(vs)}. What is the magnitude of the resultant?`, answer: sig4(R.mag), units: 'm',
      explanation: `Add components: Rx = ${show(R.x)} m, Ry = ${show(R.y)} m, so R = √(Rx² + Ry²) = ${show(R.mag)} m. Adding the magnitudes (${vs.reduce((a, v) => a + v.mag, 0)}) only works if they all point the same way.` };
  } },
  { id: 'g-p-res-polar', type: 'num', topic: POLAR, make(r) {
    const { vs, R } = sum(r);
    const naive = norm360((Math.atan(R.y / R.x) * 180) / Math.PI);
    return { prompt: `Add the vectors ${list(vs)}. What is the resultant's direction as a polar angle (degrees counterclockwise from East, 0 to 360)?`,
      answer: sig4(R.polar), units: 'degrees', abs: 1,
      explanation: `Rx = ${show(R.x)}, Ry = ${show(R.y)} puts R in the ${R.x > 0 ? (R.y > 0 ? '1st' : '4th') : R.y > 0 ? '2nd' : '3rd'} quadrant: ${show(R.polar, 1)}°.${R.x < 0 ? ` tan⁻¹(Ry/Rx) alone gives ${show(naive, 1)}°, pointing the opposite way: add 180°.` : ''}` };
  } },
  { id: 'g-p-res-compass', type: 'mc', topic: COMPASS, make(r) {
    const { vs, R } = sum(r), p = R.polar, ans = polarToCompass(p);
    const comp = ans.replace(/^[\d.]+/, show(90 - thetaX(p), 1));
    return { prompt: `Add the vectors ${list(vs)}. Which describes the resultant's direction?`, answer: ans,
      choices: choices(r, ans, [polarToCompass(p + 180), comp, polarToCompass(360 - p), polarToCompass(180 - p)]),
      explanation: `Rx = ${show(R.x)}, Ry = ${show(R.y)}: it points ${R.y > 0 ? 'North' : 'South'} and ${R.x > 0 ? 'East' : 'West'}, at tan⁻¹(|Ry|/|Rx|) = ${show(thetaX(p), 1)}° from the East-West axis: ${ans}. ${show(90 - thetaX(p), 1)}° is the angle from the North-South axis.` };
  } },
  { id: 'g-p-comp-dir', type: 'num', topic: POLAR, make(r) {
    let x, y;
    do { x = r.int(-40, 40); y = r.int(-40, 40); } while (!x || !y || !offAxis(norm360((Math.atan2(y, x) * 180) / Math.PI)));
    const p = norm360((Math.atan2(y, x) * 180) / Math.PI);
    return { prompt: `A vector has Rx = ${x} m and Ry = ${y} m. What is its polar angle (degrees counterclockwise from +x, 0 to 360)?`,
      answer: sig4(p), units: 'degrees', abs: 1,
      explanation: `tan⁻¹(|${y}|/|${x}|) = ${show(thetaX(p), 1)}° from the x-axis; with x ${x < 0 ? '−' : '+'} and y ${y < 0 ? '−' : '+'} it's in the ${x > 0 ? (y > 0 ? '1st' : '4th') : y > 0 ? '2nd' : '3rd'} quadrant, so ${show(p, 1)}°. Always sketch it: the calculator can't tell (−,−) from (+,+).` };
  } },
  { id: 'g-p-sub', type: 'num', topic: SUB, make(r) {
    const a = randomVector(r), b = randomVector(r);
    const D = addVectors([a, { mag: b.mag, polar: b.polar + 180 }]), S = addVectors([a, b]);
    if (D.mag < 1) return this.make(r);
    return { prompt: `A = ${a.mag} m, ${a.dir}; B = ${b.mag} m, ${b.dir}. What is the magnitude of A − B?`, answer: sig4(D.mag), units: 'm',
      explanation: `A − B = A + (−B), and −B is B flipped to point the opposite way. Components: (${show(D.x)}, ${show(D.y)}) → ${show(D.mag)} m. |A + B| would be ${show(S.mag)} m.` };
  } },
  { id: 'g-p-bounds', type: 'mc', topic: MAG, make(r) {
    let a, b; do { a = r.int(3, 40); b = r.int(3, 40); } while (a === b);
    const lo = Math.abs(a - b), hi = a + b;
    const ok = () => r.int(lo + 1, hi - 1);
    const bad = r.chance(0.5) ? hi + r.int(1, 15) : Math.max(0, lo - r.int(1, Math.min(lo, 10)));
    const picks = new Set([String(bad)]);
    while (picks.size < 4) picks.add(String(ok()));
    const ans = String(bad);
    return { prompt: `Vector A is ${a} m long and B is ${b} m long, pointing any directions you like. Which of these can NOT be the magnitude of A + B (in meters)?`,
      answer: ans, choices: r.shuffle([...picks]),
      explanation: `|A + B| ranges from ${lo} m (opposite directions) to ${hi} m (same direction). ${bad} is outside that range.` };
  } },
];
