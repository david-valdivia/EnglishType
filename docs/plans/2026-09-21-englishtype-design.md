# EnglishType — design

Date: 2026-09-21

## What it is

A vocabulary trainer rebuilt from a screen recording of the Easy Vocabulary web
app. The learner sees an illustration, types the word letter by letter over a
row of dashes, then types the example sentence the same way.

## Decisions

| Question | Choice | Why |
| --- | --- | --- |
| Stack | Vite + React + TypeScript | The app is almost entirely client-side keyboard interaction. A static SPA deploys anywhere for free and iterates fastest. |
| Storage | `localStorage` | No accounts in scope, so a backend would buy nothing. |
| Native language | Spanish | The user is the first learner. |
| Artwork | Microsoft Fluent Emoji (MIT) | Colourful flat illustrations, permissive licence, no per-icon attribution. Noto Emoji (Apache 2.0) is the fallback. |
| Content | 80 chapters x 10 words | Enough for the app to feel real without a long content pass before anything is testable. |

### Artwork: what was rejected and why

- **The Noun Project** — huge coverage, but the free tier is monochrome line
  icons requiring per-icon attribution, and the API is paid. Wrong look, wrong
  terms.
- **Streamline colour sets (CC BY, via Iconify)** — the search results looked
  promising, but rendering them showed two-tone *line icons*, not the flat
  illustrations the reference app uses.
- **OpenMoji (CC BY-SA 4.0)** — good artwork, but ShareAlike is a stronger
  obligation than this project needs when MIT alternatives exist.

Fluent Emoji only covers the Unicode emoji set, so the long tail is missing:
`stove`, `toaster`, `fridge`, `kettle`, `waterfall`. Rather than ship blank
tiles, the vocabulary is **curated against icon availability** — every word in
`chapters.ts` has a verified illustration, and `npm run icons` fails loudly if
one goes missing.

## Architecture

```
src/
  data/chapters.ts    60 words: text, translation, sentence, icon name
  engine/typing.ts    pure reducer: state + key -> state
  engine/srs.ts       pure Leitner scheduler
  store/progress.ts   localStorage-backed, all helpers return new values
  screens/            Home, Exercise, Results
  components/         Icon, TypedLine, Glyphs
```

The two engines are pure and hold no React, so the whole interaction model is
tested without a DOM. The screens are thin: `App.tsx` is a three-state machine
(`home` / `exercise` / `results`) and everything else renders props.

### Typing rules, read off the recording

- One slot per character. Letters and digits are typeable; spaces and
  punctuation fill themselves in when the cursor reaches them.
- Input is case-insensitive.
- A wrong key does not advance — it flashes and waits.
- Word first, then sentence. Finishing the sentence enables **Continue**.
- "Show me the sentence" completes the exercise but marks it as helped, which is
  what makes the results line read "Without help: 7 / 10".

### Review scheduling

Four boxes at 1, 3, 7 and 21 days. Answering without help promotes a word;
asking for help drops it to box 0. The Home screen's Review deck shows what is
due, most overdue first.

## Phrasal verbs and idioms

Added after the first pass. They break the assumption the rest of the app rests
on: that an illustration identifies the answer. Nothing pictures "give up" or
"once in a blue moon".

So `Word` gained an optional `meaning` — a plain-English gloss rendered under
the illustration, and again on the results card. The picture stays as a memory
hook; the gloss does the identifying. Concrete nouns omit it and are unchanged.

The typing engine needed no change: multi-word answers already worked, since
spaces are non-typeable slots that fill themselves in.

## Scaling to 800 entries

Three things had to change to go from 80 entries to 800.

**Verbs needed a third dimension.** `Word` gained `forms: [past, participle]`,
and `typingTarget()` turns an entry into what the learner actually types — the
word alone, or `go went gone`. The typing engine needed no change, because
multi-word answers already worked.

**The data file had to become a directory.** `src/data/chapters/` holds one file
per domain; `src/data/index.ts` composes them and assigns each chapter its
section heading. Keeping the grouping in the barrel rather than in every chapter
means adding a chapter is a one-line change in two places, not fifteen.

**The home screen had to gain structure.** Eighty chapters in one flat grid was
five screens of undifferentiated scrolling. They now render under eleven sticky
section headings.

Content was authored against a harvest of the real Fluent Emoji catalogue — all
3,126 names, reduced to 1,548 distinct concepts after dropping skin-tone and
gendered duplicates. Every icon name was checked against that list before the
words were written, which is why all 800 entries resolve.

## The prompt was missing

The first version showed an illustration and a row of dashes, and expected the
English word. That tests recall but never teaches: a picture of a fridge does
not tell you the word is `fridge` rather than `refrigerator`, and no picture
will ever suggest `a blessing in disguise`. The Spanish translation — the one
thing that says *which* word to produce — was hidden until the results screen,
after the answer was already due. The only way out was a button that revealed
everything at once and ended the exercise as a failure.

Three changes fix it:

1. **The prompt is always on screen.** `taskFor(word, direction)` returns what
   is shown and what is typed, so neither can be absent.
2. **The learner picks the direction.** Spanish to English, or English to
   Spanish. In the second direction there is no sentence to type.
3. **The hint uncovers one letter.** `revealNext` replaces the all-or-nothing
   reveal, so meeting a new word means uncovering it gradually and typing the
   rest, rather than giving up.

The sentence had the same defect and it survived the first pass: after
producing `tree` from `árbol`, the learner was asked for `The tree is very old.`
with nothing on screen to go on.

It is now **dictation**. The sentence is spoken, replayable on demand, and not
written anywhere. That makes it a listening exercise instead of an impossible
recall, and it is the one part of the app that trains the ear. Three hints sit
under it: reveal the next word, write the sentence out, or fill the rest in.
Each marks the entry as helped.

The fallback matters as much as the feature: when the browser will not speak,
dictation is impossible, so the sentence is written out and the interface says
why.

Typing Spanish brought accents with it, so letter comparison folds diacritics —
`delfin` is accepted for `delfín`. `ñ` is excluded from the folding: it is a
distinct letter in Spanish, not an accented `n`.

## Speech

Three real bugs, the third of my own making. The first two were found by
instrumenting `speechSynthesis.speak`:

- No voice was ever assigned, because `getVoices()` returns an empty list until
  the browser loads it asynchronously. An utterance with no voice can be
  accepted and never start, leaving `speaking` stuck at true.
- `say()` began with `cancel()`. The exercise screen also spoke the word on
  mount, which React's StrictMode runs twice, so each call cancelled the one
  before it and nothing was ever heard.

The first fix awaited the voice list before speaking — and that **broke audio
completely**, which the original naive version had got right by accident.
`speak()` has to be called synchronously inside the user gesture; awaiting
anything first lets the activation lapse and the request is dropped in silence.
The voice list is now kept warm in the background and never awaited at call
time. The speak-on-mount was removed separately: autoplay policy blocks it in
most browsers, so it bought nothing and caused the collision.

**Verified working in Chrome.** It never works in the Electron pane this was
developed against: a fresh page, a real click and the three-line minimum the API
allows — no cancel, no voice, no framework — still leaves `speaking` true with
no `start`, no `end` and no `error`. That is the pane, not the code. Do not
debug speech there; open a real browser.

**Brave refuses on purpose.** Its fingerprinting shield blocks the Web Speech
API, because enumerating voices reveals the languages installed on the machine.
A page cannot ask for that shield to be lowered — there is no API, by design —
so the failure panel detects Brave and names the setting instead of offering a
button that could not work.

Two habits were dropped along the way because both can wedge Chromium:
`cancel()` on an idle queue, and judging the engine dead too quickly (a browser
slow to warm a voice would be misread as mute, which gives the dictation away).

`say()` now resolves with whether speech began. Some embedded browsers — the one
this was developed against among them — expose the full API and a 180-voice
list, accept the call, and never emit `start`. The exercise screen surfaces that
instead of leaving the learner pressing a button that does nothing.

## Deliberately out of scope

- Accounts, sync, and any server.
- Backspace and free-form editing — the reference app does not have it, and
  "wrong key does nothing" keeps the engine small.
- A separate flashcard study step before the typing. The always-visible prompt
  plus the letter-by-letter hint covers first exposure without a second screen.
- A content pipeline. Words are a hand-edited TypeScript file; that is the right
  size for 60 words and is easy to replace later.
