import type { Chapter, Word } from './types'
import { FOOD_CHAPTERS } from './chapters/food'
import { ANIMAL_CHAPTERS } from './chapters/animals'
import { HOME_CHAPTERS } from './chapters/home'
import { BODY_CHAPTERS } from './chapters/body'
import { WORLD_CHAPTERS } from './chapters/world'
import { LIFE_CHAPTERS } from './chapters/life'
import { BASICS_CHAPTERS } from './chapters/basics'
import { ADJECTIVE_CHAPTERS } from './chapters/adjectives'
import { REGULAR_VERB_CHAPTERS } from './chapters/regular-verbs'
import { IRREGULAR_VERB_CHAPTERS } from './chapters/irregular-verbs'
import { IRREGULAR_VERB_CHAPTERS_2 } from './chapters/irregular-verbs-2'
import { PHRASAL_VERB_CHAPTERS } from './chapters/phrasal-verbs'
import { PHRASAL_VERB_CHAPTERS_2 } from './chapters/phrasal-verbs-2'
import { IDIOM_CHAPTERS } from './chapters/idioms'
import { IDIOM_CHAPTERS_2 } from './chapters/idioms-2'
import { WORK_CHAPTERS } from './chapters/work'
import { GRAMMAR_CHAPTERS } from './chapters/grammar'

export type { Chapter, Word } from './types'
export { typingTarget, displayForms } from './types'

/**
 * Eighty chapters is too many for one flat grid, so each carries the section it
 * belongs to. The home screen renders them under these headings, in this order:
 * concrete things first, then grammar, then the phrases that need a gloss.
 */
const inGroup = (group: string, chapters: Omit<Chapter, 'group'>[]): Chapter[] =>
  chapters.map((chapter) => ({ ...chapter, group }))

export const CHAPTERS: Chapter[] = [
  ...inGroup('Home & Kitchen', HOME_CHAPTERS),
  ...inGroup('Food & Drink', FOOD_CHAPTERS),
  ...inGroup('Animals', ANIMAL_CHAPTERS),
  ...inGroup('People & Body', BODY_CHAPTERS),
  ...inGroup('The World', WORLD_CHAPTERS),
  ...inGroup('Everyday Life', LIFE_CHAPTERS),
  ...inGroup('Basics', BASICS_CHAPTERS),
  ...inGroup('Adjectives', ADJECTIVE_CHAPTERS),
  ...inGroup('Verbs', REGULAR_VERB_CHAPTERS),
  ...inGroup('Verbs', IRREGULAR_VERB_CHAPTERS),
  ...inGroup('Verbs', IRREGULAR_VERB_CHAPTERS_2),
  ...inGroup('Phrasal Verbs', PHRASAL_VERB_CHAPTERS),
  ...inGroup('Phrasal Verbs', PHRASAL_VERB_CHAPTERS_2),
  ...inGroup('Grammar', GRAMMAR_CHAPTERS),
  ...inGroup('At Work', WORK_CHAPTERS),
  ...inGroup('Idioms', IDIOM_CHAPTERS),
  ...inGroup('Idioms', IDIOM_CHAPTERS_2),
]

/** Chapters under each heading, in the order the headings should appear. */
export const CHAPTER_GROUPS: { group: string; chapters: Chapter[] }[] = CHAPTERS.reduce(
  (groups, chapter) => {
    const last = groups.at(-1)
    if (last?.group === chapter.group) last.chapters.push(chapter)
    else groups.push({ group: chapter.group, chapters: [chapter] })
    return groups
  },
  [] as { group: string; chapters: Chapter[] }[],
)

export const ALL_WORDS: Word[] = CHAPTERS.flatMap((chapter) => chapter.words)

export const WORDS_BY_ID = new Map(ALL_WORDS.map((word) => [word.id, word]))

export const chapterOf = (wordId: string): Chapter | undefined =>
  CHAPTERS.find((chapter) => chapter.words.some((word) => word.id === wordId))
