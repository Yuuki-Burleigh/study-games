#!/usr/bin/env python3
"""Run every Java problem in the decks and fail if a stored answer disagrees with real Java.

Checks: output (exact stdout), trace (prints `var` after the code), bug (the line javac or the JVM blames),
and mc questions marked "run": true (stdout must equal the answer). Needs javac and java on PATH.
Usage: python3 tools/check_java.py [deck.json ...]   (default: every deck in decks/index.json)
"""
import json, os, re, subprocess, sys, tempfile

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

def check(path):
    deck = json.load(open(path))
    bad = checked = 0
    for q in deck["questions"]:
        t = q.get("type", "mc")
        if t == "output" or (t == "mc" and q.get("run")):
            kind, _, out = java(q["code"])
            ok, got = kind == "ok" and out.rstrip("\n") == q["answer"], out.rstrip("\n")
        elif t == "trace":
            kind, _, out = java(q["code"] + f"\nSystem.out.print({q['var']});")
            ok, got = kind == "ok" and out == q["answer"], out
        elif t == "bug":
            kind, line, _ = java(q["code"])
            runtime = "crash" in q["prompt"].lower() or "runs" in q["prompt"].lower()
            ok, got = kind == ("runtime" if runtime else "compile") and line == q["answer"], f"{kind} at line {line}"
        else:
            continue
        checked += 1
        if not ok:
            bad += 1
            print(f"  WRONG {q['id']}: deck says {q['answer']!r}, Java says {got!r}")
    print(f"{os.path.relpath(path, ROOT)}: {checked} checked, {bad} wrong")
    return bad

if __name__ == "__main__":
    paths = sys.argv[1:] or [os.path.join(ROOT, d["file"]) for d in json.load(open(os.path.join(ROOT, "decks/index.json")))["decks"]]
    sys.exit(1 if sum(check(p) for p in paths) else 0)
