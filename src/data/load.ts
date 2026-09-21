import type { Word } from './types'
import { CHAPTER_INDEX } from './manifest'

/**
 * Chapter words, sentence translations and the lexicon are fetched when they
 * are needed rather than shipped with the app. The data is four times the size
 * of the code, and a learner opening one chapter has no use for the other
 * ninety-five.
 *
 * Every import below is static text so the bundler can see it and split on it;
 * a computed path would defeat the whole exercise.
 */

const MODULES: Record<string, () => Promise<{ [key: string]: Omit<import('./types').Chapter, 'group'>[] }>> = {
  adjectives: () => import('./chapters/adjectives'),
  animals: () => import('./chapters/animals'),
  basics: () => import('./chapters/basics'),
  body: () => import('./chapters/body'),
  food: () => import('./chapters/food'),
  grammar: () => import('./chapters/grammar'),
  'grammar-2': () => import('./chapters/grammar-2'),
  house: () => import('./chapters/house'),
  'life-2': () => import('./chapters/life-2'),
  people: () => import('./chapters/people'),
  'adjectives-2': () => import('./chapters/adjectives-2'),
  'work-2': () => import('./chapters/work-2'),
  'world-2': () => import('./chapters/world-2'),
  home: () => import('./chapters/home'),
  idioms: () => import('./chapters/idioms'),
  'idioms-2': () => import('./chapters/idioms-2'),
  'irregular-verbs': () => import('./chapters/irregular-verbs'),
  'irregular-verbs-2': () => import('./chapters/irregular-verbs-2'),
  life: () => import('./chapters/life'),
  'phrasal-verbs': () => import('./chapters/phrasal-verbs'),
  'phrasal-verbs-2': () => import('./chapters/phrasal-verbs-2'),
  'regular-verbs': () => import('./chapters/regular-verbs'),
  work: () => import('./chapters/work'),
  'work-meetings': () => import('./chapters/work-meetings'),
  'work-comms': () => import('./chapters/work-comms'),
  'work-code': () => import('./chapters/work-code'),
  'work-process': () => import('./chapters/work-process'),
  'work-lang': () => import('./chapters/work-lang'),
  'work-career': () => import('./chapters/work-career'),
  'work-support': () => import('./chapters/work-support'),
  'work-data': () => import('./chapters/work-data'),
  'money-study': () => import('./chapters/money-study'),
  world: () => import('./chapters/world'),
}

const loaded = new Map<string, Map<string, Word>>()

/** Every word in one chapter module, by id. Fetched once, then remembered. */
async function wordsFrom(source: string): Promise<Map<string, Word>> {
  const already = loaded.get(source)
  if (already) return already

  const load = MODULES[source]
  if (!load) throw new Error(`No chapter module named ${source}`)

  const module = await load()
  const byId = new Map<string, Word>()
  for (const chapters of Object.values(module)) {
    for (const chapter of chapters) {
      for (const word of chapter.words) byId.set(word.id, word)
    }
  }

  loaded.set(source, byId)
  return byId
}

const sourceOf = new Map(
  CHAPTER_INDEX.flatMap((chapter) => chapter.wordIds.map((id) => [id, chapter.source] as const)),
)

/** The given words, fetching only the modules that actually hold them. */
export async function loadWords(ids: string[]): Promise<Word[]> {
  const needed = new Set(ids.map((id) => sourceOf.get(id)).filter((s): s is string => Boolean(s)))
  const maps = await Promise.all([...needed].map(wordsFrom))

  const byId = new Map<string, Word>()
  for (const map of maps) for (const [id, word] of map) byId.set(id, word)

  return ids.map((id) => byId.get(id)).filter((word): word is Word => Boolean(word))
}

export async function loadChapter(chapterId: string): Promise<Word[]> {
  const chapter = CHAPTER_INDEX.find((entry) => entry.id === chapterId)
  return chapter ? loadWords(chapter.wordIds) : []
}

/** Everything. Only the "All words" deck asks for this. */
export async function loadAllWords(): Promise<Word[]> {
  return loadWords(CHAPTER_INDEX.flatMap((chapter) => chapter.wordIds))
}

// ---- text that an exercise needs, but the home screen does not ----

let sentences: Record<string, string> | null = null
let lexicon: Record<string, string> | null = null

export async function loadExerciseText(): Promise<void> {
  if (sentences && lexicon) return
  const [es, lex] = await Promise.all([import('./sentences-es'), import('./lexicon')])
  sentences = es.SENTENCES_ES
  lexicon = lex.LEXICON
}

/** The Spanish for an example sentence. Empty until the text is loaded. */
export const sentenceEs = (wordId: string): string => sentences?.[wordId] ?? ''

/** Candidate base forms for a regular inflection, most likely first. */
function baseForms(token: string): string[] {
  const forms: string[] = []
  if (token.endsWith('ies') && token.length > 4) forms.push(`${token.slice(0, -3)}y`)
  if (token.endsWith('es') && token.length > 4) forms.push(token.slice(0, -2))
  if (token.endsWith('s') && token.length > 3) forms.push(token.slice(0, -1))
  if (token.endsWith('ed') && token.length > 4) forms.push(token.slice(0, -1), token.slice(0, -2))
  if (token.endsWith('ing') && token.length > 5) {
    forms.push(token.slice(0, -3), `${token.slice(0, -3)}e`)
  }
  return forms
}

/** Spanish for any word in a sentence, once the text has been loaded. */
export function translateToken(token: string): string | undefined {
  if (!lexicon) return undefined
  const clean = token.toLowerCase().replace(/[^\p{Letter}\p{Number}'-]/gu, '')
  if (!clean) return undefined

  return lexicon[clean] ?? baseForms(clean).map((base) => lexicon?.[base]).find(Boolean)
}
