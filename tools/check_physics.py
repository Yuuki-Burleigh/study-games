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
