# Study Games

My personal study site. Each class topic is a deck of **original problems** written from what I've been taught
(my notes set the scope; they aren't the questions).

- **Quick play**: 10 problems mixing four formats: multiple choice, type the exact output, trace a variable,
  and find the broken line.
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
python3 tools/check_java.py      # every answer vs real Java
```

No build step and no dependencies. GitHub Pages serves the files as they are, after CI passes both checks.
