# Study Games: how to make a deck

The user gives class notes and asks for a study game. **The notes are context, not a question bank.** They say what
the user has been taught (and so what they should and shouldn't be expected to know). The job is to write *original*
problems that test whether they understand it.

## 1. Update the course scope first
`courses/<course>.md` (e.g. `courses/cs209.md`) lists **Taught** (by lecture date) and **Not taught yet**. Add the new
lecture's concepts from the notes; move anything newly covered out of "Not taught yet". New problems may combine
anything taught so far, across lectures, but must not require anything in "Not taught yet".

## 2. Write original problems (hand-written)
- Never reuse the notes' worked examples (same expression, different numbers is fine; the same line is not).
  Aim at understanding: new combinations, edge cases, the traps students actually fall into, and "why" over "what".
- Mix all four types (roughly 35% mc, 25% output, 20% trace, 20% bug; 40+ problems per deck):

| type | the student... | fields |
|---|---|---|
| `mc` | picks one of 4 choices | `choices`, `answer` (one of choices); `run: true` if `answer` is the code's exact output |
| `output` | types the exact output | `code`, `answer` (exact stdout; avoid `\t` since Tab leaves a textarea) |
| `trace` | types a variable's final value | `code`, `var`, `answer` (as Java would print it, e.g. `85.0`) |
| `bug` | taps the broken line | `code`, `answer` (1-based line); prompt says "won't compile" or "crashes when it runs" |

- Every problem: unique `id`, `topic` (a concept, used as a filter chip), `prompt`, `explanation` (1-2 sentences:
  why, naming the trap). Distractors = real mistakes (e.g. `hi3` for `"hi" + 1 + 2`).
- Flashcards (`cards`: `id`, `term`, `definition`, `topic`) are fine as plain recall of key terms.
- Deck file `decks/<course>-<topic>.json` with `id`, `title` ("CS 209: Loops"), `course`, `description`, `scope`
  (path to the course file), `cards`, `questions`. Add `{ "id", "file" }` to `decks/index.json`.
  A continuing topic can extend an existing deck instead.

- `mc` can also use `check: "compiles"` when the choices are single declarations: exactly the answer must compile.

## 3. Write templates (endless practice)
Hand-written problems run out; templates don't. `generators/<deck id>.js` exports an array of templates, and the deck
points at it with `"generators": "generators/<deck id>.js"`. Each template is one problem *shape* whose values
(numbers, names, words, letters) come from random pools, with the answer **computed by Java's rules**:

```js
import { idiv, imod, jdouble, code, jstr, choices, NAMES, WORDS, LETTERS } from '../gen-kit.js';
export default [
  { id: 'g-avg', type: 'trace', topic: 'Arithmetic & division', make(r) {   // r = seeded RNG: r.int(lo, hi), r.pick, r.sample, r.shuffle, r.chance
    const s = [r.int(60, 100), r.int(60, 100), r.int(60, 100)];
    const sum = s[0] + s[1] + s[2];
    return { prompt: 'After this runs, what is the value of avg?', var: 'avg',
      code: `int sum = ${s.join(' + ')};\ndouble avg = sum / 3;`,
      answer: jdouble(idiv(sum, 3)),                                     // int division, then printed like a double: "85.0"
      explanation: `${sum} / 3 is int / int = ${idiv(sum, 3)} before it reaches the double.` };
  } },
];
```
Rules:
- Same fields as the hand-written types (mc / output / trace / bug); `make(r)` must be deterministic for a given seed.
  Instances get id `<template id>#<seed>`, which is how a missed one is replayed exactly in Fix mistakes.
- Compute answers only with gen-kit's Java helpers: `idiv` (truncating int /), `imod`, `jdouble` (Double.toString for
  1e-3 to 1e7; it throws outside that range, so keep doubles small), `code`/`chr` (char codes), `jstr` (a String literal).
  Concatenation is left to right: write the answer the way Java evaluates it, not the way it reads.
- Make the trap real: e.g. `uneven()` so integer division actually drops something; for `bug`, build the program with
  `program(r, lines)` and flag the broken line `{ src, bad: true }` so filler lines can shift it.
- Build mc distractors from the actual mistakes (all-text, all-added, wrong precedence) via `choices(r, answer, [...])`.
- Stay inside the course scope file. Aim for 25+ templates covering every topic and all four types.
- Look at a few instances before trusting a template: `node tools/sample.mjs decks/<deck>.json 3`.

## 4. Verify, then publish
1. `python3 tools/check_java.py` runs every hand-written problem AND a sample from every template (`SAMPLES`, default 20
   per template) through real Java, and must report 0 wrong (Java: `PATH=~/.local/share/mise/installs/java/27.0.0/bin:$PATH`).
   For a non-Java course, verify answers another way and say how.
2. `npm test` must pass (it also builds 300 instances of every template and checks they're valid, varied and deterministic).
3. Commit and push to `main`. The GitHub Action re-runs both checks and only deploys to Pages if they pass (~1 min).

From any directory, `/study-deck <notes file or topic>` runs this whole flow.
