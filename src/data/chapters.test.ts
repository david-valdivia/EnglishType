import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { ALL_WORDS, CHAPTERS, typingTarget } from './index'

/**
 * The vocabulary is hand-edited across a dozen files, so these guard the things
 * that are easy to get wrong by hand: a duplicated id, a typo in an icon name,
 * a phrase with no gloss, a verb missing a form.
 */

const GLOSSED = /^(phrasal-verbs|idioms|adjectives|regular-verbs|irregular-verbs)/

describe('vocabulary data', () => {
  it('gives every word a unique id', () => {
    const ids = ALL_WORDS.map((word) => word.id)
    const seen = new Set<string>()
    const duplicates = ids.filter((id) => (seen.has(id) ? true : (seen.add(id), false)))
    expect(duplicates).toEqual([])
  })

  it('gives every chapter a unique id', () => {
    const ids = CHAPTERS.map((chapter) => chapter.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('points every word at an illustration that exists', () => {
    const missing = ALL_WORDS.filter((word) => !existsSync(`public/icons/${word.icon}.svg`))
    expect(missing.map((word) => `${word.id} -> ${word.icon}`)).toEqual([])
  })

  it('gives every chapter an illustration that exists', () => {
    const missing = CHAPTERS.filter((chapter) => !existsSync(`public/icons/${chapter.icon}.svg`))
    expect(missing.map((chapter) => chapter.id)).toEqual([])
  })

  it('glosses every entry whose picture cannot carry the meaning', () => {
    const ungloss = CHAPTERS.filter((chapter) => GLOSSED.test(chapter.id))
      .flatMap((chapter) => chapter.words)
      .filter((word) => !word.meaning?.trim())
    expect(ungloss.map((word) => word.id)).toEqual([])
  })

  it('gives every verb both a past and a participle', () => {
    const broken = CHAPTERS.filter((chapter) => chapter.id.includes('verbs-'))
      .flatMap((chapter) => chapter.words)
      .filter((word) => !word.forms || word.forms.some((form) => !form.trim()))
    // Phrasal verbs are not conjugated here, so only the verb chapters count.
    const conjugated = broken.filter((word) => word.id.startsWith('v-') || word.id.startsWith('r-'))
    expect(conjugated.map((word) => word.id)).toEqual([])
  })

  it('writes every sentence as a sentence', () => {
    const malformed = ALL_WORDS.filter((word) => !/^[A-Z].*[.!?]$/.test(word.sentence))
    expect(malformed.map((word) => word.sentence)).toEqual([])
  })

  it('translates every word', () => {
    expect(ALL_WORDS.filter((word) => !word.translation.trim()).map((w) => w.id)).toEqual([])
  })

  it('keeps every chapter to ten words', () => {
    const wrong = CHAPTERS.filter((chapter) => chapter.words.length !== 10)
    expect(wrong.map((chapter) => `${chapter.id}: ${chapter.words.length}`)).toEqual([])
  })

  it('keeps what the learner types free of stray whitespace', () => {
    const messy = ALL_WORDS.filter((word) => typingTarget(word) !== typingTarget(word).trim())
    expect(messy.map((word) => word.id)).toEqual([])
  })
})
