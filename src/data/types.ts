export type Word = {
  /** Stable id used as the key for progress and review scheduling. */
  id: string
  word: string
  translation: string
  sentence: string
  /** Basename of an SVG in public/icons. */
  icon: string
  /**
   * A plain-English gloss, shown under the illustration. Phrasal verbs, idioms
   * and verbs need it: no picture carries "give up" or "break the ice" on its
   * own. Concrete nouns leave it out — the illustration is the clue.
   */
  meaning?: string
  /**
   * The other two forms of a three-part entry, typed along with the first:
   * "go went gone" for a verb, "large larger largest" for an adjective. The
   * triplet is the thing worth memorising, so the triplet is the answer.
   */
  forms?: [second: string, third: string]
  /** What those forms are. Defaults to a verb's tenses. */
  formKind?: 'verb' | 'degree'
}

export type Chapter = {
  id: string
  title: string
  icon: string
  words: Word[]
  /** Section heading on the home screen. Assigned when chapters are composed. */
  group: string
}

/** What the learner actually types for this entry. */
export const typingTarget = (word: Word): string =>
  word.forms ? `${word.word} ${word.forms[0]} ${word.forms[1]}` : word.word

/** How the entry reads on a results card. */
export const displayForms = (word: Word): string =>
  word.forms ? `${word.word} · ${word.forms[0]} · ${word.forms[1]}` : word.word
