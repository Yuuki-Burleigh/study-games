#!/usr/bin/env python3
"""Physics 121's answer check (the Java checker can't run physics). Every template is sampled, and each instance is
solved again HERE, independently, by reading the numbers out of the prompt the student sees: a template whose JS
formula, or whose prompt, disagrees with the physics fails. Hand-written num problems are re-derived below too.
Usage: python3 tools/check_physics.py [deck.json]     SAMPLES=200 FIRST_SEED=1 to sample more / other seeds.
"""
import json, math, os, re, subprocess, sys
from decimal import Decimal, ROUND_HALF_UP

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
F = r'(-?\d+(?:\.\d+)?)'  # a number in a prompt
CARD = {'East': 0, 'North': 90, 'West': 180, 'South': 270}

def nums(s):
    return [float(x) for x in re.findall(r'-?\d+(?:\.\d+)?', s.replace(',', ''))]

def find(pat, s, n=1):
    m = re.search(pat, s)
    if not m:
        raise ValueError(f'no match for {pat!r} in {s!r}')
    return m.group(n)

# ---- independent physics ----
def sig_figs(s):
    s = s.lstrip('+-')
    d = s.replace('.', '').lstrip('0')
    return len(d if '.' in s else d.rstrip('0'))

def sci_exp(s):
    return Decimal(s.rstrip('.')).adjusted()

def polar(text):
    """'30° North of West' or 'due South' -> polar degrees."""
    m = re.match(r'due (\w+)', text)
    if m:
        return CARD[m.group(1)]
    a, toward, frm = re.match(r'([\d.]+)° (\w+) of (\w+)', text).groups()
    a = float(a)
    turn = (CARD[toward] - CARD[frm]) % 360
    return (CARD[frm] + (a if turn == 90 else -a)) % 360

def vectors(prompt):
    return [(float(m), polar(d)) for m, d in re.findall(r'[A-C] = (\d+) m, ((?:due \w+)|(?:[\d.]+° \w+ of \w+))', prompt)]

def vsum(vs):
    x = sum(m * math.cos(math.radians(p)) for m, p in vs)
    y = sum(m * math.sin(math.radians(p)) for m, p in vs)
    return x, y

def compass(p):
    p %= 360
    g = lambda a: f'{round(a, 1):g}'
    if p < 90: return f'{g(p)}° North of East'
    if p < 180: return f'{g(180 - p)}° North of West'
    if p < 270: return f'{g(p - 180)}° South of West'
    return f'{g(360 - p)}° South of East'

def sign_of(prompt, moving):
    """+1 if the word the object moves toward is the stated positive direction."""
    pos = find(r'Take (.+?) as positive', prompt)
    return 1 if moving == pos else -1

def legs(prompt):
    pos = find(r'^(\w[\w ]*?) is positive', prompt).lower()
    out = []
    for d, w, t in re.findall(r'(\d+) m ([\w ]+?) in (\d+) s', prompt):
        out.append((float(d) * (1 if w.lower() == pos else -1), float(d), float(t)))
    return out

def trip(prompt):
    """[(dx, t)] for the quiz-style trip."""
    segs = []
    m = re.search(rf'starts at {F} m/s and speeds up to {F} m/s in (\d+) s', prompt.replace('+', ''))
    v0, v1, t = map(float, m.groups())
    segs.append(((v0 + v1) / 2 * t, t))
    d = float(find(rf'holds that speed for {F} m', prompt.replace('+', '')))
    segs.append((d, d / v1))
    t = float(find(r'brakes to a stop in (\d+) s', prompt))
    segs.append((v1 / 2 * t, t))
    m = re.search(rf'speeds back up to {F} m/s, which takes {F} m', prompt.replace('+', ''))
    if m:
        v2, d = map(float, m.groups())
        segs.append((d, 2 * d / v2))
    return segs

def solve(q):
    """The answer worked out from the prompt alone, or None if this id has no solver."""
    tid, p = q['id'].split('#')[0], q['prompt']
    if tid == 'g-p-sf-count':
        return sig_figs(find(r'does (\S+) have', p))
    if tid == 'g-p-sf-which':
        k = int(find(r'exactly (\d+)', p))
        hits = [c for c in q['choices'] if sig_figs(c) == k]
        return hits[0] if len(hits) == 1 else f'{len(hits)} choices have {k}'
    if tid == 'g-p-sci-exp':
        return sci_exp(find(r'When (\S+) is written', p))
    if tid == 'g-p-sci-write':
        n = find(r'Write (\S+) in', p)
        digits = n.lstrip('0.').replace('.', '').lstrip('0')
        digits = digits[:sig_figs(n)]
        return f'{digits[0]}{"." + digits[1:] if len(digits) > 1 else ""} × 10' + str(sci_exp(n)).translate(str.maketrans('-0123456789', '⁻⁰¹²³⁴⁵⁶⁷⁸⁹'))
    if tid == 'g-p-sci-back':
        m = re.search(r'Write ([\d.]+) × 10([⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+)', p)
        e = int(m.group(2).translate(str.maketrans('⁻⁰¹²³⁴⁵⁶⁷⁸⁹', '-0123456789')))
        return format(Decimal(m.group(1)).scaleb(e), 'f')
    if tid == 'g-p-round':
        x, n = find(r'Round (\S+) to', p), int(find(r'to (\d+) sig', p))
        d = Decimal(x)
        return str(d.quantize(Decimal(1).scaleb(d.adjusted() - n + 1), rounding=ROUND_HALF_UP))
    if tid == 'g-p-kmh':
        if 'km/h. What is that in m/s' in p:
            return nums(p)[0] / 3.6
        return nums(p)[0] * 3.6
    if tid == 'g-p-time-chain':
        if 'flight' in p:
            h, m = nums(p)[:2]; return (h * 60 + m) * 60
        if 'minutes are in' in p:
            return nums(p)[0] * 1440
        return nums(p)[0] * 168
    if tid == 'g-p-factor':
        x, frm, to = re.search(r'turn (\d+) (\w+) into (\w+)', p).groups()
        # the right factor has the target unit on top and the starting unit (singular or plural) on the bottom
        good = [c for c in q['choices'] if c.startswith('×') and re.search(rf'\(\d+ {to.rstrip("s")}s? / \d+ {frm.rstrip("s")}s?\)', c)]
        return good[0] if len(good) == 1 else f'{len(good)} good factors'
    if tid == 'g-p-bars':
        c, e = nums(p)[:2]; return math.ceil(c / e)
    if tid == 'g-p-afford-years':
        c, e, m = nums(p)[:3]; return math.ceil(c / e) * m / 12
    if tid == 'g-p-profit':
        days = float(find(r'\((182\.5) days\)', p)) if 'half a year' in p else float(find(r'takes (\d+) days', p))
        per = float(find(r'\$(\d+) per day', p)); price = float(find(r'sells for \$([\d,]+)', p).replace(',', ''))
        n = float(find(r'selling (\d+) gem', p))
        return (price - per * days) * n
    if tid == 'g-p-rate':
        if 'weeks' in p:
            c, w = nums(p)[:2]; return c * 7 * w
        if 'one year' in p:
            return nums(p)[0] * 365
        c, h, d = nums(p)[:3]; return c * h * d
    if tid == 'g-p-accel':
        w, v0, v1, t = re.search(r'moving (.+?) at (\d+) m/s .*? to (\d+) m/s .*? in (\d+) s', p).groups()
        s = sign_of(p, w); return (s * float(v1) - s * float(v0)) / float(t)
    if tid == 'g-p-vfinal':
        v0, a, t = float(find(rf'v₀ = {F}', p)), float(find(rf'acceleration of {F}', p)), float(find(r'after (\d+) s', p))
        return v0 + a * t
    if tid == 'g-p-dx-at2':
        v0, a, t = float(find(rf'v₀ = {F}', p)), float(find(rf'accelerates at {F}', p)), float(find(r'for (\d+) s', p))
        return v0 * t + a * t * t / 2
    if tid == 'g-p-seg-dx':
        w, v0, v1, t = re.search(r'going (.+?) changes speed steadily from (\d+) m/s to (\d+) m/s over (\d+) s', p).groups()
        return sign_of(p, w) * (float(v0) + float(v1)) / 2 * float(t)
    if tid == 'g-p-v2-a':
        v0, v1 = map(float, re.search(r'from (\d+) m/s to (\d+) m/s', p).groups())
        dx = float(find(rf'displacement is {F} m', p.replace('+', '')))
        return (v1 ** 2 - v0 ** 2) / (2 * dx)
    if tid == 'g-p-v2-time':
        v0, v1, d = map(float, re.search(rf'from {F} m/s to {F} m/s, covering {F} m', p.replace('+', '')).groups())
        return d / ((v0 + v1) / 2)
    if tid == 'g-p-stop':
        v0, a = float(find(r'at (\d+) m/s', p)), float(find(r'magnitude (\d+)', p)); return v0 ** 2 / (2 * a)
    if tid == 'g-p-cruise-time':
        v, d = map(float, re.search(rf'steady {F} m/s for a displacement of {F} m', p.replace('+', '')).groups())
        return d / v
    if tid == 'g-p-trip-time':
        return sum(t for _, t in trip(p))
    if tid == 'g-p-trip-dx':
        return sum(dx for dx, _ in trip(p))
    if tid in ('g-p-trip-disp', 'g-p-trip-dist', 'g-p-avg-speed'):
        L = legs(p)
        if tid == 'g-p-trip-disp': return sum(l[0] for l in L)
        if tid == 'g-p-trip-dist': return sum(l[1] for l in L)
        tt = sum(l[2] for l in L)
        return (sum(l[1] for l in L) if 'average speed' in p else sum(l[0] for l in L)) / tt
    if tid == 'g-p-avg-vel':
        if 'another' in p:
            d1, v1, d2, v2 = nums(p)[:4]; return (d1 + d2) / (d1 / v1 + d2 / v2)
        v1, t1, v2, t2 = nums(p)[:4]; return (v1 * t1 + v2 * t2) / (t1 + t2)
    if tid in ('g-p-at-graph', 'g-p-vt-area'):
        t1, v0, t2, v1 = map(float, re.search(rf'\((\d+) s, {F} m/s\) to \((\d+) s, {F} m/s\)', p).groups())
        return (v1 - v0) / (t2 - t1) if tid == 'g-p-at-graph' else (v0 + v1) / 2 * (t2 - t1)
    if tid == 'g-p-speeding':
        v, a = float(find(rf'velocity {F}', p)), float(find(rf'acceleration {F}', p))
        return 'Constant speed' if a == 0 else 'Speeding up' if v * a > 0 else 'Slowing down'
    if tid == 'g-p-signs':
        w, v0, v1 = re.search(r'heading (.+?) at (\d+) m/s \w+ (?:up )?to (\d+) m/s', p).groups()
        s = sign_of(p, w); a = s * (float(v1) - float(v0))
        return f'v {">" if s > 0 else "<"} 0, a {">" if a > 0 else "<"} 0'
    if tid == 'g-p-xt-shape':
        if 'parked' in p: return 'A horizontal line'
        w = find(r'(?:moves|moving) (.+?) (?:at|speeds|brakes)', p)
        d = 'upward' if sign_of(p, w) > 0 else 'downward'
        if 'steady' in p: return f'A straight line sloping {d}'
        return f'A curve sloping {d}, getting steeper' if 'speeds up' in p else f'A curve sloping {d}, flattening out'
    if tid in ('g-p-comp-x', 'g-p-comp-y', 'g-p-comp-signs'):
        m, d = re.search(r'(\d+) m, ((?:due \w+)|(?:[\d.]+° \w+ of \w+))', p).groups()
        x, y = vsum([(float(m), polar(d))])
        if tid == 'g-p-comp-x': return x
        if tid == 'g-p-comp-y': return y
        return f'x {"−" if x < 0 else "+"}, y {"−" if y < 0 else "+"}'
    if tid in ('g-p-res-mag', 'g-p-res-polar', 'g-p-res-compass'):
        x, y = vsum(vectors(p))
        if tid == 'g-p-res-mag': return math.hypot(x, y)
        pol = math.degrees(math.atan2(y, x)) % 360
        return pol if tid == 'g-p-res-polar' else compass(pol)
    if tid == 'g-p-comp-dir':
        x, y = float(find(rf'Rx = {F}', p)), float(find(rf'Ry = {F}', p)); return math.degrees(math.atan2(y, x)) % 360
    if tid == 'g-p-sub':
        (a, pa), (b, pb) = vectors(p)
        x, y = vsum([(a, pa), (b, pb + 180)]); return math.hypot(x, y)
    if tid == 'g-p-bounds':
        a, b = float(find(r'A is (\d+)', p)), float(find(r'B is (\d+)', p))
        bad = [c for c in q['choices'] if not abs(a - b) <= float(c) <= a + b]
        return bad[0] if len(bad) == 1 else f'{len(bad)} impossible choices'
    # ---- Mechanics Blueprint units ----
    g = 9.8
    if tid in ('g-p-calc-v', 'g-p-calc-a'):
        m = re.search(r'x\(t\) = (\d*)t³ ([+−]) (\d*)t² ([+−]) (\d*)t ([+−]) (\d+)', p)
        co = lambda c, sgn='+': (1 if c == '' else int(c)) * (-1 if sgn == '−' else 1)
        A, B, C = co(m.group(1)), co(m.group(3), m.group(2)), co(m.group(5), m.group(4))
        T = float(find(r'at t = (\d+) s', p))
        return 3 * A * T * T + 2 * B * T + C if tid == 'g-p-calc-v' else 6 * A * T + 2 * B
    if tid == 'g-p-calc-int':
        A, sb, B, C = re.search(r'v\(t\) = (\d+)t² ([+−]) (\d+)t \+ (\d+)', p).groups()
        A, B, C = float(A), float(B) * (-1 if sb == '−' else 1), float(C)
        T = float(find(r'at t = (\d+) s\?', p))
        return A * T ** 3 / 3 + B * T ** 2 / 2 + C * T
    if tid == 'g-p-calc-power':
        sup = str.maketrans('⁰¹²³⁴⁵⁶⁷⁸⁹', '0123456789')
        A, n = re.search(r'x\(t\) = (\d+)t([⁰¹²³⁴⁵⁶⁷⁸⁹]+)', p).groups()
        A, n = int(A), int(n.translate(sup))
        pw = 't' if n - 1 == 1 else 't' + str(n - 1).translate(str.maketrans('0123456789', '⁰¹²³⁴⁵⁶⁷⁸⁹'))
        return f'v(t) = {A * n}{pw}'
    if tid.startswith('g-p-proj-') and 'horizontally' in p:
        h, v = float(find(r'leaves a (\d+) m high', p)), float(find(r'at (\d+) m/s horizontally', p))
        t = math.sqrt(2 * h / g)
        return {'g-p-proj-time': t, 'g-p-proj-range': v * t, 'g-p-proj-vy': -g * t}[tid]
    if tid in ('g-p-proj-maxh', 'g-p-proj-range-level', 'g-p-proj-wall'):
        v, th = map(float, re.search(r'at (\d+) m/s, (\d+)° above the horizontal', p).groups())
        vx, vy = v * math.cos(math.radians(th)), v * math.sin(math.radians(th))
        if tid == 'g-p-proj-maxh': return vy ** 2 / (2 * g)
        if tid == 'g-p-proj-range-level': return v * v * math.sin(math.radians(2 * th)) / g
        d = float(find(r'wall (\d+) m away', p)); t = d / vx
        return vy * t - g / 2 * t * t
    if tid == 'g-p-mom-stick':
        m1, v1, m2 = map(float, re.search(r'A (\d+) kg \w+ moving right at (\d+) m/s hits a (\d+) kg', p).groups())
        m = re.search(r'hits a \d+ kg \w+ moving (left|right) at (\d+) m/s', p)
        v2 = 0 if not m else float(m.group(2)) * (-1 if m.group(1) == 'left' else 1)
        return (m1 * v1 + m2 * v2) / (m1 + m2)
    if tid in ('g-p-elastic-1', 'g-p-elastic-2'):
        m1, v, m2 = map(float, re.search(r'A (\d+) kg ball moving right at (\d+) m/s hits a (\d+) kg ball', p).groups())
        asked = float(find(r'What is the (\d+) kg ball', p))
        # momentum + kinetic energy conservation, solved directly (target at rest)
        v1f, v2f = (m1 - m2) / (m1 + m2) * v, 2 * m1 / (m1 + m2) * v
        assert abs(m1 * v1f + m2 * v2f - m1 * v) < 1e-9 and abs(m1 * v1f ** 2 + m2 * v2f ** 2 - m1 * v * v) < 1e-6
        return v1f if asked == m1 else v2f
    if tid == 'g-p-impulse-v':
        m, v0, Fz, d, t = re.search(r'A (\d+) kg \w+ moving right at (\d+) m/s is pushed by a constant (\d+) N force pointing (\w+) for (\d+) s', p).groups()
        return float(v0) + (1 if d == 'right' else -1) * float(Fz) * float(t) / float(m)
    if tid == 'g-p-impulse-area':
        Fz, t1, t2 = map(float, re.search(r'constant (\d+) N from t = 0 to t = (\d+) s, then a straight-line drop to 0 N at t = (\d+) s', p).groups())
        return Fz * t1 + Fz * (t2 - t1) / 2
    mus = lambda: (float(find(r'μs = (\d+(?:\.\d+)?)', p)), float(find(r'μk = (\d+(?:\.\d+)?)', p)))
    if tid == 'g-p-f-static':
        m = float(find(r'A (\d+) kg box', p)); return mus()[0] * m * g
    if tid == 'g-p-f-moves':
        m, P = float(find(r'A (\d+) kg box', p)), float(find(r'with (\d+) N', p)); s_, k_ = mus()
        if P > s_ * m * g:
            want, word = (P - k_ * m * g) / m, 'slides'
        else:
            want, word = P, 'stays put'
        hits = [c for c in q['choices'] if word in c and abs(nums(c)[0] - want) <= 0.01 + abs(want) * 1e-3]
        return hits[0] if len(hits) == 1 else f'{len(hits)} matching choices'
    if tid == 'g-p-f-kin-accel':
        m, P = float(find(r'A (\d+) kg box', p)), float(find(r'with (\d+) N', p)); s_, k_ = mus()
        assert P > s_ * m * g, 'push too weak to slide'
        return (P - k_ * m * g) / m
    if tid == 'g-p-f-slide-stop':
        v, k_ = float(find(r'slides at (\d+) m/s', p)), float(find(r'μk = (\d+(?:\.\d+)?)', p)); return v * v / (2 * k_ * g)
    if tid == 'g-p-f-incline-normal':
        m, th = float(find(r'A (\d+) kg crate', p)), float(find(r'tilted (\d+)°', p)); return m * g * math.cos(math.radians(th))
    if tid == 'g-p-f-incline-accel':
        th = math.radians(float(find(r'on a (\d+)° ramp', p))); s_, k_ = mus()
        assert math.tan(th) > s_, 'it would not slide'
        return g * (math.sin(th) - k_ * math.cos(th))
    def sci(txt):
        m, e = re.match(r'(\d+(?:\.\d+)?) × 10([⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+)', txt).groups()
        return float(m) * 10 ** int(e.translate(str.maketrans('⁻⁰¹²³⁴⁵⁶⁷⁸⁹', '-0123456789')))
    SCI = r'([\d.]+ × 10[⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+)'
    Gc = 6.67e-11
    if tid == 'g-p-circ-ac':
        rr, v = map(float, re.search(r'radius (\d+) m at a steady (\d+) m/s', p).groups()); return v * v / rr
    if tid == 'g-p-circ-force':
        m, rr, v = map(float, re.search(r'A (\d+(?:\.\d+)?) kg ball .* radius (\d+(?:\.\d+)?) m at (\d+) m/s', p).groups()); return m * v * v / rr
    if tid == 'g-p-circ-speed':
        m, Fz, rr = map(float, re.search(r'A (\d+) kg car can get at most (\d+) N .* radius (\d+) m', p).groups()); return math.sqrt(Fz * rr / m)
    if tid == 'g-p-grav-F':
        m1, m2, d = [sci(x) for x in re.findall(SCI, p)[:3]]; return Gc * m1 * m2 / d ** 2
    if tid == 'g-p-orbit-v':
        M, rr = [sci(x) for x in re.findall(SCI, p)[:2]]; return math.sqrt(Gc * M / rr)
    if tid == 'g-p-rot-alpha':
        w0, w1, t = map(float, re.search(r'from (\d+) rad/s to (\d+) rad/s in (\d+) s', p).groups()); return (w1 - w0) / t
    if tid == 'g-p-rot-angle':
        w0, a, t = map(float, re.search(r'at (\d+) rad/s .* of (\d+) rad/s² for (\d+) s', p).groups()); return w0 * t + a * t * t / 2
    if tid == 'g-p-rot-revs':
        w, t = map(float, re.search(r'steady (\d+) rad/s for (\d+) s', p).groups()); return w * t / (2 * math.pi)
    if tid == 'g-p-torque':
        L, Fz, th = map(float, re.search(r'A (\d+(?:\.\d+)?) m long wrench gets a (\d+) N push at its end, at (\d+)°', p).groups())
        return L * Fz * math.sin(math.radians(th))
    if tid == 'g-p-rod-alpha':
        m, L, Fz = map(float, re.search(r'uniform (\d+) kg rod, (\d+) m long.* A (\d+) N force', p).groups())
        return Fz * (L / 2) / (m * L * L / 12)
    if tid == 'g-p-e-drop':
        return math.sqrt(2 * g * float(find(r'from rest (\d+) m above', p)))
    if tid == 'g-p-e-ramp':
        v0, h = map(float, re.search(r'moving at (\d+) m/s slides down a frictionless ramp that drops (\d+) m', p).groups()); return math.sqrt(v0 * v0 + 2 * g * h)
    if tid == 'g-p-e-hill':
        v0, h = map(float, re.search(r'rolling at (\d+) m/s coasts up a frictionless hill (\d+) m high', p).groups()); return math.sqrt(v0 * v0 - 2 * g * h)
    if tid == 'g-p-e-friction':
        m, v0, d = map(float, re.search(r'A (\d+) kg box slides at (\d+) m/s across (\d+) m', p).groups()); k_ = float(find(r'μk = (\d+(?:\.\d+)?)', p))
        return math.sqrt(v0 * v0 - 2 * k_ * g * d)
    if tid == 'g-p-e-spring':
        k_, x, m = map(float, re.search(r'k = (\d+) N/m\) is compressed (\d+(?:\.\d+)?) m and then launches a (\d+(?:\.\d+)?) kg', p).groups()); return x * math.sqrt(k_ / m)
    if tid == 'g-p-eq-seesaw':
        m1, d1, m2 = map(float, re.search(r'a (\d+) kg person sits (\d+(?:\.\d+)?) m left .* a (\d+) kg person', p).groups()); return m1 * d1 / m2
    if tid == 'g-p-eq-mass':
        m1, d1, d2 = map(float, re.search(r'A (\d+(?:\.\d+)?) kg weight hangs (\d+(?:\.\d+)?) m left .* hung (\d+(?:\.\d+)?) m right', p).groups()); return m1 * d1 / d2
    if tid == 'g-p-eq-support':
        mb, m1, m2 = map(float, re.search(r'A (\d+) kg board .* a (\d+) kg person and a (\d+) kg person', p).groups()); return (mb + m1 + m2) * g
    return None

# Hand-written num problems, worked again from their prompts.
HAND = {
    'n-sf-1': 3, 'n-sf-2': 4, 'n-sf-3': 1, 'n-sf-4': 3, 'n-sci-exp': -4,
    'n-conv-snail': 1.5 / 1000 * 3600, 'n-conv-heart': 72 * 60 * 24, 'n-conv-kmh': 13 * 3600 / 1000,
    'n-money-hours': math.ceil(1360 / (12 - 3)), 'n-money-sapphire': 2500 - 6 * 120, 'n-money-boat': math.ceil(27000 / 1780) * 4 / 12,
    'n-rate-year': 0.35 * 365, 'n-acc-east': (10 - 25) / 6, 'n-acc-turn': (8 - -12) / 0.5,
    'n-trip-time': 4 + 240 / 20 + 6, 'n-trip-disp': 14 * 4 + 240 + 10 * 6, 'n-trip-avg': (56 + 240 + 60) / 22,
    'n-rest-time': -90 / (-30 / 2), 'n-rest-acc': (30 ** 2) / (2 * -90), 'n-ramp-disp': 6 * 5 - 0.5 * 2 * 5 ** 2,
    'n-ramp-dist': 6 ** 2 / 4 + 0.5 * 2 * 2 ** 2, 'n-graph-area': -15 * 4 - 0.5 * 15 * 6, 'n-stop-time': 70 / 14,
    'n-cruise-west': 33000 / 220, 'n-v-walk': 13, 'n-v-walk-angle': 180 - math.degrees(math.atan(12 / 5)),
    'n-v3-mag': math.hypot(20 - 30 * math.cos(math.radians(40)), 30 * math.sin(math.radians(40)) - 15),
    'n-v3-angle': math.degrees(math.atan((30 * math.sin(math.radians(40)) - 15) / (30 * math.cos(math.radians(40)) - 20))),
    'n-conv-marathon': 42.16285806243965,
    'n-troy': 32.154340836012864,
    'n-trip-graph': 80.0,
    'c-v': 88,
    'c-a': 32,
    'c-int-x': 66,
    'c-int-v': 29,
    'c-zero': 2,
    'pj-t': 2.531435020952764,
    'pj-x': 1.2371791482634835,
    'pj-max': 9.700561468471566,
    'pj-hang': 2.81404081145747,
    'pj-wall': 2.9283681454033283,
    'mo-stick': 7.5,
    'mo-head': 0.0,
    'mo-imp': 13.049999999999999,
    'mo-force': 8700.0,
    'mo-2d': 5.0,
    'mo-elastic': -3.0,
    'fo-fma': 3.0,
    'fo-static': 176.4,
    'fo-kin': 3.3099999999999996,
    'fo-incline': 4.141658965058855,
    'fo-2d': 6.25,
    'fo-strip': 3.8775510204081627,
    'ci-a': 3.6,
    'ci-F': 9375.0,
    'ci-v': 9.797958971132712,
    'gr-F': 1.9848379516601562e+20,
    'gr-v': 7663.642471384188,
    'ro-alpha': -5,
    'ro-theta': 250,
    'ro-rev': 71.6197243913529,
    'ro-tau': 20.784609690826528,
    'ro-ring': 6.0,
    'en-ke': 135000.0,
    'en-pe': 64680.0,
    'en-drop': 19.79898987322333,
    'en-spring': 4.0,
    'en-friction': 9.183673469387754,
    'eq-seesaw': 1.5,
    'eq-support': 882.0000000000001,
    'eq-mass': 2.0000000000000004,
    'eq-beam': 10.0,
    'n-v-ycomp': -50 * math.cos(math.radians(35)), 'n-v-sub': math.sqrt(200), 'n-v-theta-west': math.degrees(math.atan(14 / 9)),
}

def agrees(q, want):
    if q['type'] == 'num':
        if isinstance(want, str): return False
        # The same slack the app gives the student; a correct template must sit well inside it.
        return abs(float(want) - q['answer']) <= max(abs(q['answer']) * 0.002, 0.006)
    return str(want) == q['answer']

def check(path):
    deck = json.load(open(path))
    bad = checked = 0
    for q in deck['questions']:
        if q['type'] == 'num':
            if q['id'] not in HAND:
                print(f'  NO CHECK for hand-written {q["id"]}: add it to HAND'); bad += 1; continue
            checked += 1
            if not agrees(q, HAND[q['id']]):
                bad += 1; print(f'  WRONG {q["id"]}: deck says {q["answer"]!r}, worked answer {HAND[q["id"]]!r}')
    n, first = os.environ.get('SAMPLES', '50'), os.environ.get('FIRST_SEED', '1')
    inst = json.loads(subprocess.run(['node', os.path.join(ROOT, 'tools/sample.mjs'), path, n, first], capture_output=True, text=True, check=True).stdout)
    unsolved = set()
    for q in inst:
        try:
            want = solve(q)
        except Exception as e:  # a prompt the solver can't read is a failure too: the student has to read it
            bad += 1; print(f'  UNREADABLE {q["id"]}: {e}'); continue
        if want is None:
            unsolved.add(q['id'].split('#')[0]); continue
        checked += 1
        if not agrees(q, want):
            bad += 1; print(f'  WRONG {q["id"]}: template says {q["answer"]!r}, worked answer {want!r}\n    {q["prompt"]}')
    for t in sorted(unsolved):
        print(f'  NO SOLVER for template {t}'); bad += 1
    print(f'{os.path.relpath(path, ROOT)}: {checked} checked ({len(inst)} generated from templates), {bad} wrong')
    return bad

if __name__ == '__main__':
    paths = sys.argv[1:] or [os.path.join(ROOT, 'decks/phys121.json')]
    sys.exit(1 if sum(check(p) for p in paths) else 0)
