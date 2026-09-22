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
import { PHRASAL_VERB_CHAPTERS_3 } from './chapters/phrasal-verbs-3'
import { IDIOM_CHAPTERS } from './chapters/idioms'
import { IDIOM_CHAPTERS_2 } from './chapters/idioms-2'
import { WORK_CHAPTERS } from './chapters/work'
import { WORK_MEETING_CHAPTERS } from './chapters/work-meetings'
import { WORK_COMMS_CHAPTERS } from './chapters/work-comms'
import { WORK_CODE_CHAPTERS } from './chapters/work-code'
import { WORK_PROCESS_CHAPTERS } from './chapters/work-process'
import { WORK_LANG_CHAPTERS } from './chapters/work-lang'
import { WORK_CAREER_CHAPTERS } from './chapters/work-career'
import { WORK_SUPPORT_CHAPTERS } from './chapters/work-support'
import { WORK_DATA_CHAPTERS } from './chapters/work-data'
import { MONEY_STUDY_CHAPTERS } from './chapters/money-study'
import { GRAMMAR_CHAPTERS } from './chapters/grammar'
import { GRAMMAR_CHAPTERS_2 } from './chapters/grammar-2'
import { PREPOSITION_CHAPTERS } from './chapters/prepositions'
import { PEOPLE_CHAPTERS } from './chapters/people'
import { WORLD_CHAPTERS_2 } from './chapters/world-2'
import { HOUSE_CHAPTERS } from './chapters/house'
import { LIFE_CHAPTERS_2 } from './chapters/life-2'
import { WORK_CHAPTERS_2 } from './chapters/work-2'
import { ADJECTIVE_CHAPTERS_2 } from './chapters/adjectives-2'

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
  ...inGroup('Home & Kitchen', HOUSE_CHAPTERS),
  ...inGroup('Food & Drink', FOOD_CHAPTERS),
  ...inGroup('Animals', ANIMAL_CHAPTERS),
  ...inGroup('People & Body', BODY_CHAPTERS),
  ...inGroup('People & Body', PEOPLE_CHAPTERS),
  ...inGroup('The World', WORLD_CHAPTERS),
  ...inGroup('The World', WORLD_CHAPTERS_2),
  ...inGroup('Everyday Life', LIFE_CHAPTERS),
  ...inGroup('Everyday Life', LIFE_CHAPTERS_2),
  ...inGroup('Everyday Life', MONEY_STUDY_CHAPTERS),
  ...inGroup('Basics', BASICS_CHAPTERS),
  ...inGroup('Adjectives', ADJECTIVE_CHAPTERS),
  ...inGroup('Adjectives', ADJECTIVE_CHAPTERS_2),
  ...inGroup('Verbs', REGULAR_VERB_CHAPTERS),
  ...inGroup('Verbs', IRREGULAR_VERB_CHAPTERS),
  ...inGroup('Verbs', IRREGULAR_VERB_CHAPTERS_2),
  ...inGroup('Phrasal Verbs', PHRASAL_VERB_CHAPTERS),
  ...inGroup('Phrasal Verbs', PHRASAL_VERB_CHAPTERS_2),
  ...inGroup('Phrasal Verbs', PHRASAL_VERB_CHAPTERS_3),
  ...inGroup('Grammar', GRAMMAR_CHAPTERS),
  ...inGroup('Grammar', GRAMMAR_CHAPTERS_2),
  ...inGroup('Grammar', PREPOSITION_CHAPTERS),
  ...inGroup('At Work', WORK_CHAPTERS),
  ...inGroup('At Work', WORK_MEETING_CHAPTERS),
  ...inGroup('At Work', WORK_COMMS_CHAPTERS),
  ...inGroup('At Work', WORK_CODE_CHAPTERS),
  ...inGroup('At Work', WORK_PROCESS_CHAPTERS),
  ...inGroup('At Work', WORK_LANG_CHAPTERS),
  ...inGroup('At Work', WORK_CAREER_CHAPTERS),
  ...inGroup('At Work', WORK_SUPPORT_CHAPTERS),
  ...inGroup('At Work', WORK_DATA_CHAPTERS),
  ...inGroup('At Work', WORK_CHAPTERS_2),
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
