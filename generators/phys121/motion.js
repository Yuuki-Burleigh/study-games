// Physics 121 templates: 1D motion with signs (Quiz 1 problem 3, extended): acceleration, the constant-acceleration
// equations, multi-part trips, displacement vs distance, average velocity vs speed, and motion graphs.
// Convention in every prompt: the + direction is stated (usually East); West is negative. Scope: courses/phys121.md.
import { choices } from '../../gen-kit.js';
import { sig4, show, signed, par } from './kit.js';

const ACC = 'Acceleration', CA = 'Constant acceleration', CV = 'Constant velocity', TRIP = 'Multi-part trips',
  DD = 'Displacement vs distance', AVG = 'Average velocity vs speed', GR = 'Motion graphs', SU = 'Speeding up vs slowing down';
const AXES = [['East', 'West'], ['North', 'South'], ['right', 'left'], ['up the ramp', 'down the ramp']];
const WHO = ['car', 'truck', 'cyclist', 'train', 'skateboarder', 'bus', 'motorcycle', 'drone', 'runner', 'scooter'];
// A direction for the motion: sign s = +1 / -1, and its words.
function heading(r) {
  const [pos, neg] = r.pick(AXES), s = r.chance(0.6) ? -1 : 1;
  return { s, word: s > 0 ? pos : neg, pos, neg, conv: `Take ${pos} as positive.` };
}

// Quiz-style trip in one direction: speed up, cruise a distance, brake to a stop, then (sometimes) speed back up.
function trip(r) {
  const h = heading(r), who = r.pick(WHO), u = h.s;
  const v0 = r.int(2, 6) * 5, v1 = v0 + r.int(1, 5) * 5, tA = r.int(2, 8), dB = r.int(2, 12) * 50, tC = r.int(2, 8);
  const segs = [
    { text: `starts at ${signed(u * v0, 'm/s')} and speeds up to ${signed(u * v1, 'm/s')} in ${tA} s`, dx: (u * (v0 + v1) / 2) * tA, t: tA },
    { text: `holds that speed for ${signed(u * dB, 'm')}`, dx: u * dB, t: dB / v1 },
    { text: `brakes to a stop in ${tC} s`, dx: (u * v1 / 2) * tC, t: tC },
  ];
  if (r.chance(0.6)) {
    const v2 = r.int(2, 6) * 5, dD = r.int(2, 20) * 10;
    segs.push({ text: `speeds back up to ${signed(u * v2, 'm/s')}, which takes ${signed(u * dD, 'm')}`, dx: u * dD, t: (2 * dD) / v2 });
  }
  const story = `${h.conv} A ${who} moving ${h.word} ${segs.map((s) => s.text).join(', then ')}.`;
  return { story, segs, h };
}

// A walk with at least one turnaround: legs at constant speed, each a distance and a time.
function outAndBack(r) {
  const [pos, neg] = r.pick(AXES), who = r.pick(['A hiker', 'A delivery robot', 'A dog', 'A swimmer', 'An ant', 'A shopper']);
  for (;;) {
    const n = r.int(2, 3), legs = [];
    for (let k = 0; k < n; k++) legs.push({ s: k === 0 ? (r.chance(0.5) ? 1 : -1) : -legs[k - 1].s * (r.chance(0.8) ? 1 : -1), d: r.int(2, 40) * 5, t: r.int(2, 30) * 2 });
    const disp = legs.reduce((a, l) => a + l.s * l.d, 0), dist = legs.reduce((a, l) => a + l.d, 0);
    if (!disp || Math.abs(disp) === dist) continue;
    const text = `${pos[0].toUpperCase() + pos.slice(1)} is positive. ${who} goes ${legs.map((l) => `${l.d} m ${l.s > 0 ? pos : neg} in ${l.t} s`).join(', then ')}.`;
    return { text, legs, disp, dist, time: legs.reduce((a, l) => a + l.t, 0) };
  }
}

export default [
  // ---------- acceleration and the constant-acceleration equations ----------
  { id: 'g-p-accel', type: 'num', topic: ACC, make(r) {
    const h = heading(r), who = r.pick(WHO), up = r.chance(0.5);
    let a = r.int(2, 12) * 2, b = r.int(1, 10) * 2;
    if (a === b) a += 4;
    const [v0, v1] = up ? [Math.min(a, b), Math.max(a, b)] : [Math.max(a, b), Math.min(a, b)], t = r.int(2, 8);
    const acc = (h.s * (v1 - v0)) / t;
    return { prompt: `${h.conv} A ${who} moving ${h.word} at ${v0} m/s ${up ? 'speeds up' : 'slows down'} to ${v1} m/s (still moving ${h.word}) in ${t} s. What is its acceleration?`,
      answer: sig4(acc), units: 'm/s²',
      explanation: `v₀ = ${signed(h.s * v0, 'm/s')}, v = ${signed(h.s * v1, 'm/s')}: a = (v − v₀)/t = ${show(acc)} m/s². ${up ? 'Speeding up' : 'Slowing down'} while moving ${h.s > 0 ? h.pos : h.neg} means a points ${acc > 0 ? '+' : '−'}: the sign is direction, not "faster" or "slower".` };
  } },
  { id: 'g-p-vfinal', type: 'num', topic: CA, make(r) {
    const v0 = r.int(-30, 30), a = r.pick([-1, 1]) * r.int(1, 8) * (r.chance(0.5) ? 1 : 0.5), t = r.int(2, 10);
    const v = v0 + a * t;
    return { prompt: `An object has v₀ = ${show(v0)} m/s and a constant acceleration of ${show(a)} m/s². What is its velocity after ${t} s?`,
      answer: sig4(v), units: 'm/s', abs: 0.05,
      explanation: `v = v₀ + at = ${show(v0)} + ${par(a)}(${t}) = ${show(v)} m/s. Keep both signs: a negative a lowers v even when v is already negative.` };
  } },
  { id: 'g-p-dx-at2', type: 'num', topic: CA, make(r) {
    const v0 = r.int(-20, 20), a = r.pick([-1, 1]) * r.int(1, 6), t = r.int(2, 8);
    const dx = v0 * t + 0.5 * a * t * t;
    return { prompt: `Starting with v₀ = ${show(v0)} m/s, an object accelerates at ${show(a)} m/s² for ${t} s. What is its displacement?`,
      answer: sig4(dx), units: 'm', abs: 0.05,
      explanation: `Δx = v₀t + ½at² = (${show(v0)})(${t}) + ½${par(a)}(${t})² = ${show(v0 * t)} + ${par(0.5 * a * t * t)} = ${show(dx)} m. Forgetting the ½ gives ${show(v0 * t + a * t * t)}.` };
  } },
  { id: 'g-p-seg-dx', type: 'num', topic: CA, make(r) {
    const h = heading(r), who = r.pick(WHO), t = r.int(2, 9);
    let v0, w1;
    do { v0 = r.int(0, 8) * 5; w1 = r.int(0, 8) * 5; } while (v0 === w1);
    const dx = (h.s * (v0 + w1) / 2) * t;
    return { prompt: `${h.conv} A ${who} going ${h.word} changes speed steadily from ${v0} m/s to ${w1} m/s over ${t} s. What is its displacement during that time?`,
      answer: sig4(dx), units: 'm', abs: 0.05,
      explanation: `With constant acceleration, the average velocity is the midpoint: (${show(h.s * v0)} + ${par(h.s * w1)})/2 = ${signed(h.s * (v0 + w1) / 2, 'm/s')}; × ${t} s = ${show(dx)} m. Using only the final speed gives ${show(h.s * w1 * t)}.` };
  } },
  { id: 'g-p-v2-a', type: 'num', topic: CA, make(r) {
    const h = heading(r);
    let v0, v1;
    do { v0 = r.int(0, 8) * 5; v1 = r.int(0, 8) * 5; } while (v0 === v1);
    const dx = h.s * r.int(2, 30) * 10, a = ((v1 * v1 - v0 * v0) / (2 * dx));
    return { prompt: `${h.conv} A cart moving ${h.word} goes from ${v0} m/s to ${v1} m/s while its displacement is ${signed(dx, 'm')}. What is its acceleration?`,
      answer: sig4(a), units: 'm/s²',
      explanation: `v² = v₀² + 2aΔx → a = (v² − v₀²)/(2Δx) = (${v1 * v1} − ${v0 * v0})/(2 × ${show(dx)}) = ${show(a, 3)} m/s². The squares lose the sign, so the direction comes from Δx${v1 < v0 ? ' and from slowing down' : ''}.` };
  } },
  { id: 'g-p-v2-time', type: 'num', topic: CA, make(r) {
    const h = heading(r), v0 = r.int(0, 5) * 5, v1 = v0 + r.int(1, 6) * 5, d = r.int(2, 30) * 10;
    const t = (2 * d) / (v0 + v1);
    return { prompt: `${h.conv} A car going ${h.word} speeds up steadily from ${signed(h.s * v0, 'm/s')} to ${signed(h.s * v1, 'm/s')}, covering ${signed(h.s * d, 'm')}. How long does that take?`,
      answer: sig4(t), units: 's',
      explanation: `Average velocity = (${show(h.s * v0)} + ${par(h.s * v1)})/2 = ${show(h.s * (v0 + v1) / 2)} m/s; t = Δx / v_avg = ${show(h.s * d)} / ${show(h.s * (v0 + v1) / 2)} = ${show(t)} s. Time is never negative: the signs cancel. Dividing by the final speed gives ${show(d / v1)} s.` };
  } },
  { id: 'g-p-stop', type: 'num', topic: CA, make(r) {
    const v0 = r.int(4, 30), a = r.int(2, 9), who = r.pick(WHO);
    const d = (v0 * v0) / (2 * a);
    return { prompt: `A ${who} moving at ${v0} m/s brakes with an acceleration of magnitude ${a} m/s² until it stops. How far does it travel while braking?`,
      answer: sig4(d), units: 'm',
      explanation: `0 = v₀² + 2aΔx → Δx = v₀²/(2|a|) = ${v0 * v0}/${2 * a} = ${show(d)} m. Forgetting the 2 doubles it (${show(2 * d)}).` };
  } },
  { id: 'g-p-cruise-time', type: 'num', topic: CV, make(r) {
    const h = heading(r), v = r.int(3, 40), d = r.int(5, 80) * 10;
    return { prompt: `${h.conv} A ${r.pick(WHO)} holds a steady ${signed(h.s * v, 'm/s')} for a displacement of ${signed(h.s * d, 'm')}. How long does that take?`,
      answer: sig4(d / v), units: 's',
      explanation: `t = Δx / v = (${show(h.s * d)} m)/(${show(h.s * v)} m/s) = ${show(d / v)} s. The two ${h.s < 0 ? 'negatives cancel' : 'signs match'}; a time is never negative.` };
  } },

  // ---------- multi-part trips ----------
  { id: 'g-p-trip-time', type: 'num', topic: TRIP, make(r) {
    const { story, segs } = trip(r), total = segs.reduce((a, s) => a + s.t, 0);
    return { prompt: `${story} How long did the whole trip take?`, answer: sig4(total), units: 's',
      explanation: `Find each part's time, then add: ${segs.map((s) => show(s.t)).join(' + ')} = ${show(total)} s. Distance-only parts need t = Δx / v (average v while speeding up).` };
  } },
  { id: 'g-p-trip-dx', type: 'num', topic: TRIP, make(r) {
    const { story, segs, h } = trip(r), dx = segs.reduce((a, s) => a + s.dx, 0);
    return { prompt: `${story} What was its total displacement?`, answer: sig4(dx), units: 'm',
      explanation: `Each part's Δx (average velocity × time when the speed changes): ${segs.map((s, k) => (k ? par(s.dx) : show(s.dx))).join(' + ')} = ${show(dx)} m. Moving ${h.word} the whole time, so it's ${dx < 0 ? 'negative' : 'positive'}.` };
  } },
  { id: 'g-p-trip-disp', type: 'num', topic: DD, make(r) {
    const w = outAndBack(r);
    return { prompt: `${w.text} What is the total displacement?`, answer: w.disp, units: 'm', abs: 0.01,
      explanation: `Displacement adds the legs WITH signs: ${w.legs.map((l) => (l.s > 0 ? '+' : '−') + l.d).join(' ')} = ${w.disp} m. Adding the sizes (${w.dist} m) gives the distance instead.` };
  } },
  { id: 'g-p-trip-dist', type: 'num', topic: DD, make(r) {
    const w = outAndBack(r);
    return { prompt: `${w.text} What total distance did it travel?`, answer: w.dist, units: 'm', abs: 0.01,
      explanation: `Distance ignores direction: ${w.legs.map((l) => l.d).join(' + ')} = ${w.dist} m. The displacement is only ${w.disp} m because the legs partly cancel.` };
  } },
  { id: 'g-p-avg-speed', type: 'num', topic: AVG, make(r) {
    const w = outAndBack(r), speed = r.chance(0.5);
    const val = speed ? w.dist / w.time : w.disp / w.time;
    return { prompt: `${w.text} What is its average ${speed ? 'speed' : 'velocity'} for the whole trip?`, answer: sig4(val), units: 'm/s', abs: 0.005,
      explanation: speed
        ? `Average speed = total distance / total time = ${w.dist} / ${w.time} = ${show(val, 3)} m/s (never negative).`
        : `Average velocity = displacement / total time = ${w.disp} / ${w.time} = ${show(val, 3)} m/s. Using the distance (${w.dist} m) gives the average speed instead.` };
  } },
  { id: 'g-p-avg-vel', type: 'num', topic: AVG, make(r) {
    let v1, w2;
    do { v1 = r.int(2, 12) * 5; w2 = r.int(2, 12) * 5; } while (v1 === w2);
    const sameDist = r.chance(0.5), who = r.pick(WHO);
    let d1, d2, t1, t2;
    if (sameDist) { d1 = d2 = r.int(2, 20) * 60; t1 = d1 / v1; t2 = d2 / w2; } else { t1 = r.int(2, 20); t2 = r.int(2, 20); d1 = v1 * t1; d2 = w2 * t2; }
    const avg = (d1 + d2) / (t1 + t2);
    return { prompt: sameDist
      ? `A ${who} goes ${d1} m East at ${v1} m/s, then another ${d2} m East at ${w2} m/s. What is its average velocity for the whole trip? (East is +)`
      : `A ${who} goes East at ${v1} m/s for ${t1} s, then East at ${w2} m/s for ${t2} s. What is its average velocity for the whole trip? (East is +)`,
      answer: sig4(avg), units: 'm/s',
      explanation: `Average velocity = total displacement / total time = ${show(d1 + d2)} m / ${show(t1 + t2)} s = ${show(avg)} m/s, not the plain average of the speeds (${show((v1 + w2) / 2)}) unless the times are equal.` };
  } },

  // ---------- reading motion ----------
  { id: 'g-p-speeding', type: 'mc', topic: SU, make(r) {
    const v = r.pick([-1, 1]) * r.int(1, 40), a = r.chance(0.12) ? 0 : r.pick([-1, 1]) * r.int(1, 9);
    const ans = a === 0 ? 'Constant speed' : Math.sign(a) === Math.sign(v) ? 'Speeding up' : 'Slowing down';
    return { prompt: `At one instant, a ${r.pick(WHO)} has velocity ${show(v)} m/s and acceleration ${show(a)} m/s². Right now it is…`, answer: ans,
      choices: ['Speeding up', 'Slowing down', 'Constant speed', 'Moving backward'],
      explanation: a === 0 ? 'No acceleration means the velocity isn\'t changing.' : `v and a have ${Math.sign(a) === Math.sign(v) ? 'the SAME sign, so it speeds up' : 'OPPOSITE signs, so it slows down'}. A negative a alone doesn't mean slowing down.` };
  } },
  { id: 'g-p-signs', type: 'mc', topic: SU, make(r) {
    const h = heading(r), up = r.chance(0.5), who = r.pick(WHO), v0 = r.int(3, 20), dv = r.int(1, Math.min(v0 - 1, 10) || 1);
    const sv = h.s > 0 ? 'v > 0' : 'v < 0', sa = (up ? h.s : -h.s) > 0 ? 'a > 0' : 'a < 0';
    const flip = (x) => (x.includes('>') ? x.replace('>', '<') : x.replace('<', '>'));
    const ans = `${sv}, ${sa}`;
    return { prompt: `${h.conv} A ${who} heading ${h.word} at ${v0} m/s ${up ? 'speeds up' : 'slows'} to ${up ? v0 + dv : v0 - dv} m/s. What are the signs of its velocity and acceleration?`,
      answer: ans, choices: [ans, `${sv}, ${flip(sa)}`, `${flip(sv)}, ${sa}`, `${flip(sv)}, ${flip(sa)}`],
      explanation: `Moving ${h.word} makes v ${sv.slice(2)}. ${up ? 'Speeding up: a points the same way as v' : 'Slowing down: a points opposite to v'}, so ${sa}.` };
  } },
  { id: 'g-p-xt-shape', type: 'mc', topic: GR, make(r) {
    const h = heading(r), who = r.pick(WHO), kind = r.pick(['cruise', 'up', 'down', 'rest']);
    const v0 = r.int(2, 9) * 5, v1 = kind === 'up' ? v0 + r.int(1, 5) * 5 : kind === 'down' ? 0 : v0, t = r.int(2, 9);
    const dir = h.s > 0 ? 'upward' : 'downward';
    const SHAPES = { cruise: `A straight line sloping ${dir}`, up: `A curve sloping ${dir}, getting steeper`, down: `A curve sloping ${dir}, flattening out`, rest: 'A horizontal line' };
    const story = kind === 'rest' ? `sits parked for ${t} s` : kind === 'cruise' ? `moves ${h.word} at a steady ${v0} m/s for ${t} s` : kind === 'up' ? `moving ${h.word} speeds up from ${v0} to ${v1} m/s over ${t} s` : `moving ${h.word} brakes from ${v0} m/s to a stop over ${t} s`;
    const ans = SHAPES[kind], other = h.s > 0 ? 'downward' : 'upward';
    return { prompt: `${h.conv} A ${who} ${story}. What does its position-vs-time graph look like during that time?`, answer: ans,
      choices: choices(r, ans, Object.values(SHAPES).filter((s) => s !== ans), [`A straight line sloping ${other}`]),
      explanation: `The slope of x-vs-t is the velocity. ${kind === 'rest' ? 'v = 0, so the slope is zero.' : kind === 'cruise' ? 'Constant v gives a constant slope: a straight line.' : kind === 'up' ? 'The speed grows, so the slope gets steeper.' : 'The speed drops to 0, so the slope flattens to horizontal.'} ${h.s < 0 && kind !== 'rest' ? `Moving ${h.word} (negative) makes x decrease.` : ''}`.trim() };
  } },
  { id: 'g-p-at-graph', type: 'num', topic: GR, make(r) {
    const t1 = r.int(1, 10), t2 = t1 + r.int(2, 8), v0 = r.int(-6, 6) * 5;
    let v1 = r.int(-6, 6) * 5;
    if (v1 === v0) v1 += 10;
    const a = (v1 - v0) / (t2 - t1);
    return { prompt: `On a velocity-vs-time graph, the line goes straight from (${t1} s, ${v0} m/s) to (${t2} s, ${v1} m/s). What value does the acceleration-vs-time graph show during that interval?`,
      answer: sig4(a), units: 'm/s²', abs: 0.005,
      explanation: `Acceleration is the slope of v-vs-t: (${v1} − ${par(v0)}) / (${t2} − ${t1}) = ${show(a, 3)} m/s². Dividing by ${t2} s instead of the ${t2 - t1} s interval is the classic slip.` };
  } },
  { id: 'g-p-vt-area', type: 'num', topic: GR, make(r) {
    const t1 = r.int(0, 10), t2 = t1 + r.int(2, 8), v0 = r.int(-6, 6) * 5;
    let v1 = r.int(-6, 6) * 5;
    if (v0 * v1 < 0) v1 = -v1; // stay on one side of the axis: the area is the displacement
    if (v1 === v0) v1 = v0 + (v0 < 0 ? -10 : 10);
    const dx = ((v0 + v1) / 2) * (t2 - t1);
    return { prompt: `A velocity-vs-time graph is a straight line from (${t1} s, ${v0} m/s) to (${t2} s, ${v1} m/s). How much does the position change over that interval?`,
      answer: sig4(dx), units: 'm', abs: 0.05,
      explanation: `Δx is the area under v-vs-t (a trapezoid): (${v0} + ${par(v1)})/2 × ${t2 - t1} s = ${show(dx)} m. Area below the axis counts as negative.` };
  } },
];
