# Study Games

My personal study site: each class topic is a **deck**, and every deck plays as three games:

- **Flashcards**: flip, then "Got it" or "Again" (missed cards come back).
- **Quiz**: 10 random multiple-choice questions, including "what does this print?" code questions, with an explanation after each. Wrong answers go to **Review missed**.
- **Match**: pair 6 terms with their definitions against the clock (+2 s per miss).

Progress (best scores, missed questions) is saved in your browser only.

## Adding a class or topic

Give Claude your notes, slides or a topic and say "make a study deck". It writes
`decks/<id>.json` and adds one line to `decks/index.json`. See `CLAUDE.md` for the format.

## Run locally

```
python3 -m http.server 8000   # then open http://localhost:8000
npm test                      # checks every deck is valid
```

No build step and no dependencies; GitHub Pages serves the files as they are.
