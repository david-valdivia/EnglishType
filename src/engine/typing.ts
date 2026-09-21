/**
 * The typing engine: a pure reducer driving the letter-by-letter exercise.
 *
 * A target string becomes a list of slots, one per character. Letters and
 * digits are typeable — the learner has to produce them. Everything else
 * (spaces, commas, apostrophes, the final period) fills itself in as soon as
 * the cursor reaches it, so the learner never hunts for punctuation.
 */

export type Slot = {
  char: string
  typeable: boolean
  filled: boolean
}

export type Phase = 'word' | 'sentence' | 'done'

export type TypingState = {
  word: Slot[]
  sentence: Slot[]
  phase: Phase
  /** Set when the last key press did not match; drives the shake/flash. */
  wrong: boolean
  /** True once the learner asked to be shown the answer. */
  usedHelp: boolean
}

const isTypeable = (char: string) => /[\p{Letter}\p{Number}]/u.test(char)

/**
 * Letters are compared without their accents, so someone on an English keyboard
 * can type "delfin" for "delfín". Letters that are genuinely different in
 * Spanish stay different: ñ is its own letter, not an accented n.
 */
const fold = (char: string): string =>
  char === 'ñ' || char === 'Ñ'
    ? 'ñ'
    : char.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')

const toSlots = (target: string): Slot[] =>
  [...target].map((char) => ({ char, typeable: isTypeable(char), filled: false }))

/** Fills every automatic slot sitting directly under the cursor. */
const skipAutomatic = (slots: Slot[]): Slot[] => {
  const next = [...slots]
  for (let i = 0; i < next.length; i++) {
    if (next[i].filled) continue
    if (next[i].typeable) break
    next[i] = { ...next[i], filled: true }
  }
  return next
}

const fillAll = (slots: Slot[]): Slot[] => slots.map((slot) => ({ ...slot, filled: true }))

const cursorOf = (slots: Slot[]) => slots.findIndex((slot) => !slot.filled)

const isComplete = (slots: Slot[]) => cursorOf(slots) === -1

/** Some exercises have no sentence to type, so the word is the whole thing. */
const afterWord = (state: TypingState): Phase =>
  isComplete(state.sentence) ? 'done' : 'sentence'

export const visibleText = (slots: Slot[]): string =>
  slots
    .filter((slot) => slot.filled)
    .map((slot) => slot.char)
    .join('')

export function createTypingState(word: string, sentence: string): TypingState {
  return {
    word: skipAutomatic(toSlots(word)),
    sentence: skipAutomatic(toSlots(sentence)),
    phase: 'word',
    wrong: false,
    usedHelp: false,
  }
}

export function keyPress(state: TypingState, key: string): TypingState {
  if (state.phase === 'done') return state
  // Ignore modifiers, arrows and friends — only real characters count.
  if ([...key].length !== 1) return state

  const active = state.phase === 'word' ? state.word : state.sentence
  const cursor = cursorOf(active)
  if (cursor === -1) return state

  const expected = active[cursor].char
  if (fold(key) !== fold(expected)) {
    return { ...state, wrong: true }
  }

  const advanced = [...active]
  advanced[cursor] = { ...advanced[cursor], filled: true }
  const settled = skipAutomatic(advanced)

  if (state.phase === 'word') {
    return {
      ...state,
      word: settled,
      wrong: false,
      phase: isComplete(settled) ? afterWord(state) : 'word',
    }
  }

  return {
    ...state,
    sentence: settled,
    wrong: false,
    phase: isComplete(settled) ? 'done' : 'sentence',
  }
}

/**
 * Reveals just the next letter. This is the way out when the learner has never
 * seen the word before: uncover it a letter at a time and keep typing. It marks
 * the entry as helped, so spaced repetition brings it back sooner.
 */
export function revealNext(state: TypingState): TypingState {
  return fillActive(state, (slots) => {
    const cursor = cursorOf(slots)
    if (cursor === -1) return slots
    const next = [...slots]
    next[cursor] = { ...next[cursor], filled: true }
    return next
  })
}

/**
 * Applies a fill to whichever line is active and settles the phase. Shared by
 * every "reveal" — they only differ in how much they fill in.
 */
function fillActive(state: TypingState, fill: (slots: Slot[]) => Slot[]): TypingState {
  if (state.phase === 'done') return state

  const active = state.phase === 'word' ? state.word : state.sentence
  if (isComplete(active)) return state

  const settled = skipAutomatic(fill(active))
  const complete = isComplete(settled)

  if (state.phase === 'word') {
    return {
      ...state,
      word: settled,
      wrong: false,
      usedHelp: true,
      phase: complete ? afterWord(state) : 'word',
    }
  }

  return {
    ...state,
    sentence: settled,
    wrong: false,
    usedHelp: true,
    phase: complete ? 'done' : 'sentence',
  }
}

/**
 * Reveals up to the end of the word the cursor is in. This is the hint that
 * fits dictation: hearing a sentence and missing one word should not cost the
 * whole sentence.
 */
export function revealWord(state: TypingState): TypingState {
  return fillActive(state, (slots) => {
    const next = [...slots]
    let reached = false
    for (let i = 0; i < next.length; i++) {
      if (next[i].filled) continue
      if (reached && next[i].char === ' ') break
      next[i] = { ...next[i], filled: true }
      if (next[i].char === ' ') break
      reached = true
    }
    return next
  })
}

/** Reveals the rest of the current line — the word, or the whole sentence. */
export function revealRest(state: TypingState): TypingState {
  return fillActive(state, fillAll)
}

/** Completes the whole exercise at once, and marks it as helped. */
export function reveal(state: TypingState): TypingState {
  return {
    ...state,
    word: fillAll(state.word),
    sentence: fillAll(state.sentence),
    phase: 'done',
    wrong: false,
    usedHelp: true,
  }
}
