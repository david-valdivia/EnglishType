import { GLOSSARY } from './glossary'
import { ALL_WORDS } from './index'

/**
 * Spanish for any word the learner meets inside an example sentence.
 *
 * The vocabulary wins over the glossary, so a word studied as an entry shows
 * the sense it was studied in. Regular inflections fall back to their base,
 * which keeps the glossary to the words that genuinely need an author.
 */

const vocabulary = new Map<string, string>()
for (const entry of ALL_WORDS) {
  // Only single-word entries contribute. Splitting "hit the road" would map
  // "road" to "ponerse en marcha", and "your" in "tighten your belt" to
  // something absurd — a phrase's translation belongs to the phrase.
  if (/\s/.test(entry.word)) continue

  const key = entry.word.toLowerCase()
  if (!vocabulary.has(key)) vocabulary.set(key, entry.translation)

  for (const form of entry.forms ?? []) {
    const formKey = form.toLowerCase()
    if (!vocabulary.has(formKey)) vocabulary.set(formKey, entry.translation)
  }
}

const lookup = (key: string): string | undefined => vocabulary.get(key) ?? GLOSSARY[key]

/** Candidate base forms for a regular inflection, most likely first. */
function baseForms(token: string): string[] {
  const forms: string[] = []
  if (token.endsWith('ies') && token.length > 4) forms.push(`${token.slice(0, -3)}y`)
  if (token.endsWith('es') && token.length > 4) forms.push(token.slice(0, -2))
  if (token.endsWith('s') && token.length > 3) forms.push(token.slice(0, -1))
  if (token.endsWith('ed') && token.length > 4) {
    forms.push(token.slice(0, -1), token.slice(0, -2))
  }
  if (token.endsWith('ing') && token.length > 5) {
    forms.push(token.slice(0, -3), `${token.slice(0, -3)}e`)
  }
  return forms
}

export function translateToken(token: string): string | undefined {
  const clean = token.toLowerCase().replace(/[^\p{Letter}\p{Number}'-]/gu, '')
  if (!clean) return undefined

  const direct = lookup(clean)
  if (direct) return direct

  for (const base of baseForms(clean)) {
    const found = lookup(base)
    if (found) return found
  }

  return undefined
}
