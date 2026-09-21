# EnglishType

A vocabulary trainer where you learn each word by typing it, letter by letter,
over a row of dashes — then type the example sentence the same way. Modelled on
the Easy Vocabulary web app.

Once an answer is right, the Spanish appears: the whole sentence underneath, and
any single word by tapping it.

You are never asked to guess. One side of the pair is always on screen and you
produce the other. The example sentence is **dictation**: you hear it, replay it
as often as you like, and type what you hear — with hints that give you one word
at a time rather than the whole thing. When you have never met a word before,
the hint uncovers it a letter at a time.

**80 chapters, 800 entries**, grouped on the home screen: concrete vocabulary
(food, animals, the body, the world, everyday life), then **adjectives**,
**verbs**, **phrasal verbs** and **idioms**.

Everything runs in the browser. There is no backend and no account: progress
lives in `localStorage`.

## Running it

```bash
npm install
npm run dev
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server on http://localhost:5173 |
| `npm run build` | Type-check and build to `dist/` |
| `npm test` | Run the unit tests |
| `npm run icons` | Re-download the illustrations |

## How it works

**`src/engine/typing.ts`** is the heart of the app: a pure reducer that takes
the current state and a key, and returns the next state. Letters and digits are
typeable; spaces and punctuation fill themselves in when the cursor reaches
them, so you never hunt for a comma. A wrong key does not advance — it just
flashes. Finish the word and the cursor moves to the sentence; finish the
sentence and the exercise is done.

Accents are forgiving in one direction only: typing `delfin` is accepted for
`delfín`, because the learner may be on an English keyboard, but `ñ` is its own
letter and never matches `n`.

`revealNext` uncovers a single letter and marks the entry as helped. That is the
way in for a word you have never seen — uncover, keep typing, and spaced
repetition brings it back sooner.

Because it is pure, the whole interaction is tested without a DOM.

**`src/data/translate.ts`** answers "what does this word mean?" for any word in
any sentence. The vocabulary wins over the glossary, so a word studied as an
entry shows the sense it was studied in, and regular inflections fall back to
their base — which keeps `glossary.ts` down to the words that genuinely need an
author rather than every plural and past tense.

Multi-word entries deliberately contribute nothing per word. Splitting "hit the
road" would teach that "road" means *ponerse en marcha*: a phrase's translation
belongs to the phrase.

**`src/data/sentences-es.ts`** holds the Spanish for all 800 example sentences,
keyed by entry id and kept apart from the chapters so the English stays
readable. A test checks the two sides match exactly — no untranslated sentence,
no orphan translation.

**`src/lib/speech.ts`** reads the English aloud, and the dictation depends on
it. One rule governs the whole file: **`speak()` must be called synchronously
inside the gesture that asked for it.** Awaiting anything first — even an
already-resolved promise — lets the browser's user activation lapse and the
request is dropped without a word. So the voice list is kept warm in the
background via `voiceschanged` and never awaited at call time.

`say()` resolves with whether speech actually began. Only a *pressed* button is
allowed to act on that answer: an autoplayed dictation that the browser refuses
says nothing about whether the engine works, and treating it as broken would
give the sentence away in browsers that read it perfectly well.

When it does fail, the cause decides the advice. Brave blocks the API under its
fingerprinting shield — the voice list reveals which languages are installed —
so it is detected with `navigator.brave.isBrave()` and told where the setting
lives. A page cannot lower that shield itself; there is deliberately no API for
it. An empty voice list points at the system instead, and anything else points
at the browser. Each comes with a retry, because changing the setting is the
only way to find out whether it took.

**`src/engine/task.ts`** decides what is shown and what is typed.
`Spanish → English` shows the translation and asks for the English word, then
the example sentence. `English → Spanish` shows the English and asks for the
translation, with no sentence to type — the answer is not English, so typing an
English sentence after it would not follow. The audio always speaks the English.
The choice is a toggle on the home screen and persists.

**`src/engine/srs.ts`** schedules reviews on a four-box Leitner ladder
(1, 3, 7 and 21 days). Answering without help promotes a word; asking for the
answer drops it back to the first box.

**`src/store/progress.ts`** holds what persists: review schedules, which words
have been learned, and which are starred. Every helper returns a new value, and
a corrupt or unwritable store degrades to an empty one rather than breaking the
app.

## Adding words

Vocabulary lives in `src/data/chapters/`, one file per domain, stitched together
by `src/data/index.ts` — which is also where each chapter gets the section
heading it appears under. Edit a chapter file, then run `npm run icons` to fetch
any new artwork:

```ts
{ id: 'ladder', word: 'ladder', translation: 'escalera',
  sentence: 'The ladder is too short.', icon: 'ladder' }
```

Phrasal verbs and idioms also take a `meaning` — a plain-English gloss shown
under the illustration. They need it: no picture carries "give up" or "break the
ice" on its own, so without the gloss the exercise is unanswerable.

```ts
{ id: 'give-up', word: 'give up', translation: 'rendirse',
  meaning: 'to stop trying', sentence: 'Do not give up now.', icon: 'white-flag' }
```

Irregular and regular verbs carry `forms`, the past simple and past participle.
That makes the typed answer all three parts, because the triplet is the thing
worth memorising:

```ts
{ id: 'v-go', word: 'go', forms: ['went', 'gone'], translation: 'ir',
  meaning: 'to move to another place', sentence: 'They went home early.',
  icon: 'person-running' }
```

The learner types `go went gone`; the results card reads `go · went · gone`.

`src/data/chapters.test.ts` enforces all of this across the 800 entries —
unique ids, real icon files, a gloss on every entry whose picture cannot carry
the meaning, both forms on every verb, well-formed sentences, ten words per
chapter — so a hand-editing slip fails the test run rather than reaching the
screen.

`icon` is the name of an illustration in Microsoft's Fluent Emoji set. The set
covers about 1,500 distinct concepts — all of Unicode's emoji and no more — so
plenty of ordinary words have no picture: `stove`, `toaster`, `fridge`,
`kettle`, `waterfall`. The vocabulary is curated against what exists rather than
shipping blank tiles. `npm run icons` exits non-zero and names any icon it could
not find, so a bad name fails loudly instead of shipping a broken image.

## Artwork

Illustrations are Microsoft Fluent Emoji (MIT). See [LICENSES.md](LICENSES.md).
