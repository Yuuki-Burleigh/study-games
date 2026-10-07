# Study Games

My personal study site. Each class is one deck, split into units (one per lecture), of **original problems** written from what I've been taught
(my notes set the scope; they aren't the questions).

- **Quick play**: 10 problems mixing four formats: multiple choice, type the exact output, trace a variable,
  and find the broken line. Half are hand-written, half freshly generated.
- **Endless practice**: problems generated from templates with random values (numbers, names, words), so you can keep
  going without repeats. It leans toward the templates you miss (your weak spots show on the deck page).
  Every template's answer logic is checked against real Java in CI.
- **Error hunt / Type it / Multiple choice**: drill one format. **Fix mistakes** replays what I got wrong.
- **Flashcards** and **Match** (pair 6 terms against the clock) to warm up.

XP, levels, a daily streak and best scores are saved in the browser only.

## Adding a class or topic

Run `/study-deck <notes file>` in Claude Code. It updates `courses/<course>.md` (what's been taught), writes new
problems, checks every answer against real Java, and publishes. Details in `CLAUDE.md`.

## Run locally

```
python3 -m http.server 8000      # then open http://localhost:8000
npm test                         # deck format + game logic
python3 tools/check_java.py      # every answer (incl. sampled template problems) vs real Java
node tools/sample.mjs decks/cs209.json 2   # peek at generated problems
```

No build step and no dependencies. GitHub Pages serves the files as they are, after CI passes both checks.
