# Study Games: how to add a deck

The user gives class materials (notes, slides, a topic) and asks for a study game. Output = one new deck.

1. Write `decks/<course>-<topic>.json` (lowercase, hyphens), shaped like `decks/cs209-java-basics.json`:
   ```json
   {
     "id": "<same as filename>", "title": "CS 209: Loops", "course": "CS 209",
     "description": "one line: what it covers",
     "cards": [ { "id": "c-unique", "term": "...", "definition": "...", "topic": "Lecture 10-6" } ],
     "questions": [ {
       "id": "q-unique", "topic": "Lecture 10-6",
       "prompt": "What does this print?",
       "code": "optional code block",
       "choices": ["right answer", "wrong 1", "wrong 2", "wrong 3"],
       "answer": "right answer",
       "explanation": "why, in 1-2 sentences"
     } ]
   }
   ```
   Rules: ids unique across cards+questions; `answer` must be exactly one of `choices`; choices unique;
   aim for 20+ cards and 25+ questions; `topic` groups items into filter chips (use the lecture date or sub-topic).
2. Add `{ "id": "...", "file": "decks/<id>.json" }` to `decks/index.json`.
3. Facts must be correct even where the notes are wrong; fix them and say so in the explanation.
   For code-output questions, run the code (Java: `~/.local/share/mise/installs/java/*/bin/java`) and use the real output.
   Distractors should be the mistakes a student actually makes (e.g. `hi3` for `"hi" + 1 + 2`).
4. `npm test` must pass, then commit and push to `main`. The GitHub Action re-runs the tests and only deploys
   to Pages if they pass (about a minute). From any directory, `/study-deck <notes file or topic>` runs this whole flow.
