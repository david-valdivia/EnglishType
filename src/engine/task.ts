import { displayForms, typingTarget, type Word } from '../data/types'

/**
 * Which way round the exercise runs.
 *
 * The prompt is never hidden. An illustration alone cannot tell you whether the
 * word is "fridge", "refrigerator" or "icebox", and no picture will ever suggest
 * "a blessing in disguise" — so one side of the pair is always on screen and the
 * learner produces the other.
 */
export type Direction = 'es-en' | 'en-es'

export const DIRECTIONS: { id: Direction; label: string; hint: string }[] = [
  { id: 'es-en', label: 'Spanish → English', hint: 'See the Spanish, write the English' },
  { id: 'en-es', label: 'English → Spanish', hint: 'See the English, write the Spanish' },
]

export type Task = {
  /** Shown above the answer box. Always present. */
  prompt: string
  promptLanguage: 'es' | 'en'
  /** What the learner types. */
  answer: string
  /** Typed after the answer. Empty when there is nothing to type. */
  sentence: string
  /** Read aloud. Always the English, whichever way round the exercise runs. */
  speech: string
  /** Plain-English gloss, or empty. */
  meaning: string
  /**
   * True when the answer is a verb's three parts rather than a single word.
   * Without saying so the learner types "go", nothing happens, and there is
   * nothing on screen to explain why.
   */
  threeForms: boolean
  /** Names of those parts, in order, or empty. */
  formLabels: string[]
}

const PART_LABELS: Record<NonNullable<Word['formKind']>, string[]> = {
  verb: ['base', 'past', 'participle'],
  degree: ['base', 'comparative', 'superlative'],
}

export function taskFor(word: Word, direction: Direction): Task {
  const english = typingTarget(word)
  const common = { speech: english, meaning: word.meaning ?? '' }

  if (direction === 'en-es') {
    return {
      ...common,
      // The forms are the prompt here, so there is nothing to warn about.
      threeForms: false,
      formLabels: [],
      prompt: displayForms(word),
      promptLanguage: 'en',
      answer: word.translation,
      // The answer is Spanish, so typing the English example after it would not
      // follow. It is shown as context on the results card instead.
      sentence: '',
    }
  }

  return {
    ...common,
    prompt: word.translation,
    promptLanguage: 'es',
    answer: english,
    sentence: word.sentence,
    threeForms: Boolean(word.forms),
    formLabels: word.forms ? PART_LABELS[word.formKind ?? 'verb'] : [],
  }
}
