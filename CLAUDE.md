# Study Games: how to make a deck

The user gives class notes and asks for a study game. **The notes are context, not a question bank.** They say what
the user has been taught (and so what they should and shouldn't be expected to know). The job is to write *original*
problems that test whether they understand it.

## 1. Update the course scope first
`courses/<course>.md` (e.g. `courses/cs209.md`) lists **Taught** (by lecture date) and **Not taught yet**. Add the new
lecture's concepts from the notes; move anything newly covered out of "Not taught yet". New problems may combine
anything taught so far, across lectures, but must not require anything in "Not taught yet".

## 2. Write original problems
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

## 3. Verify, then publish
1. `python3 tools/check_java.py` runs every output/trace/bug/run problem through real Java and must report 0 wrong
   (Java: `PATH=~/.local/share/mise/installs/java/27.0.0/bin:$PATH`). For a non-Java course, verify answers another way and say how.
2. `npm test` must pass.
3. Commit and push to `main`. The GitHub Action re-runs both checks and only deploys to Pages if they pass (~1 min).

From any directory, `/study-deck <notes file or topic>` runs this whole flow.
