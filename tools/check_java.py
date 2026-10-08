#!/usr/bin/env python3
"""Run every Java problem in the decks and fail if a stored answer disagrees with real Java.

Checks: output (exact stdout), trace (prints `var` after the code), bug (the line javac or the JVM blames),
mc marked "run": true (stdout must equal the answer) and mc marked "check": "compiles" (only the answer compiles;
an optional "wrap" like "%s { }" turns each choice into a full statement first).
If a deck has "generators", every template is sampled (SAMPLES seeds each, default 20) and checked the same way,
so a template whose answer formula disagrees with Java for some random values fails here.
Needs javac, java and node on PATH.
Usage: python3 tools/check_java.py [deck.json ...]   (default: every deck in decks/index.json)
       SAMPLES=100 FIRST_SEED=5000 python3 tools/check_java.py   (sample more / different seeds)
"""
import json, os, re, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def java(body):
    d = tempfile.mkdtemp()
    with open(os.path.join(d, "T.java"), "w") as f:
        f.write("public class T { public static void main(String[] args) {\n" + body + "\n} }\n")
    c = subprocess.run(["javac", "-Xmaxerrs", "1", "T.java"], cwd=d, capture_output=True, text=True)
    if c.returncode:
        m = re.search(r"T\.java:(\d+):", c.stderr)
        return "compile", (int(m.group(1)) - 1 if m else None), c.stderr.strip()
    r = subprocess.run(["java", "T"], cwd=d, capture_output=True, text=True, timeout=20)
    if r.returncode:
        m = re.search(r"T\.java:(\d+)\)", r.stderr)
        return "runtime", (int(m.group(1)) - 1 if m else None), r.stdout
    return "ok", None, r.stdout

def norm(text):
    """Same rule as normalizeOutput in game.js: ignore trailing spaces on a line and trailing newlines."""
    return "\n".join(l.rstrip(" ") for l in text.replace("\r\n", "\n").split("\n")).rstrip("\n")

def verdict(q):
    """None if q isn't machine-checkable, else (ok, what_java_said)."""
    t = q.get("type", "mc")
    if t == "mc" and q.get("check") == "compiles":
        wrap = q.get("wrap", "%s")  # e.g. "%s { }" when each choice is a loop header
        compiles = [c for c in q["choices"] if java(wrap.replace("%s", c))[0] == "ok"]
        ok, got = compiles == [q["answer"]], f"compiling choices: {compiles}"
    elif t == "output" or (t == "mc" and q.get("run")):
        kind, _, out = java(q["code"])
        ok, got = kind == "ok" and norm(out) == norm(q["answer"]), norm(out)
    elif t == "trace":
        kind, _, out = java(q["code"] + f"\nSystem.out.print({q['var']});")
        ok, got = kind == "ok" and out == q["answer"], out
    elif t == "bug":
        kind, line, _ = java(q["code"])
        runtime = "crash" in q["prompt"].lower() or "runs" in q["prompt"].lower()
        ok, got = kind == ("runtime" if runtime else "compile") and line == q["answer"], f"{kind} at line {line}"
    else:
        return None
    return ok, got

def check(path):
    deck = json.load(open(path))
    if not set(deck.get("formats", ["output"])) & {"output", "trace", "bug"}:
        print(f"{os.path.relpath(path, ROOT)}: no Java in this deck, skipped")
        return 0
    qs = list(deck["questions"])
    generated = 0
    if deck.get("generators"):
        n, first = os.environ.get("SAMPLES", "20"), os.environ.get("FIRST_SEED", "1")
        inst = json.loads(subprocess.run(["node", os.path.join(ROOT, "tools/sample.mjs"), path, n, first],
                                         capture_output=True, text=True, check=True).stdout)
        generated = len(inst)
        qs += inst
    bad = checked = 0
    with ThreadPoolExecutor(max_workers=os.cpu_count() or 4) as pool:
        for q, v in zip(qs, pool.map(verdict, qs)):
            if v is None:
                continue
            checked += 1
            if not v[0]:
                bad += 1
                print(f"  WRONG {q['id']}: deck says {q['answer']!r}, Java says {v[1]!r}")
    print(f"{os.path.relpath(path, ROOT)}: {checked} checked ({generated} generated from templates), {bad} wrong")
    return bad

if __name__ == "__main__":
    paths = sys.argv[1:] or [os.path.join(ROOT, d["file"]) for d in json.load(open(os.path.join(ROOT, "decks/index.json")))["decks"]]
    sys.exit(1 if sum(check(p) for p in paths) else 0)
