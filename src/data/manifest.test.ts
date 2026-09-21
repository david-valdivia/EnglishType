import { describe, expect, it } from 'vitest'
import { CHAPTERS, ALL_WORDS } from './index'
import { CHAPTER_INDEX, TOTAL_WORDS } from './manifest'
import { LEXICON } from './lexicon'
import { GLOSSARY } from './glossary'

/**
 * manifest.ts and lexicon.ts are generated from the chapters by
 * `npm run index`. These fail if either has gone stale, which is the only way
 * the split can quietly serve the wrong thing.
 */

describe('the generated manifest', () => {
  it('lists every chapter, in order', () => {
    expect(CHAPTER_INDEX.map((c) => c.id)).toEqual(CHAPTERS.map((c) => c.id))
  })

  it('carries each chapter title, icon and group', () => {
    const fromChapters = CHAPTERS.map((c) => `${c.id}|${c.title}|${c.icon}|${c.group}`)
    const fromIndex = CHAPTER_INDEX.map((c) => `${c.id}|${c.title}|${c.icon}|${c.group}`)
    expect(fromIndex).toEqual(fromChapters)
  })

  it('lists every word id, in order', () => {
    const fromChapters = CHAPTERS.map((c) => c.words.map((w) => w.id).join(','))
    const fromIndex = CHAPTER_INDEX.map((c) => c.wordIds.join(','))
    expect(fromIndex).toEqual(fromChapters)
  })

  it('counts the words', () => {
    expect(TOTAL_WORDS).toBe(ALL_WORDS.length)
  })

  it('names a real module for every chapter', () => {
    const sources = new Set(CHAPTER_INDEX.map((c) => c.source))
    expect([...sources].filter((s) => !s.trim())).toEqual([])
    expect(sources.size).toBeGreaterThan(1)
  })
})

describe('the generated lexicon', () => {
  it('translates every single-word vocabulary entry', () => {
    const missing = ALL_WORDS.filter(
      (word) => !/\s/.test(word.word) && !LEXICON[word.word.toLowerCase()],
    )
    expect(missing.map((w) => w.id)).toEqual([])
  })

  it('lets the vocabulary win over the glossary', () => {
    // "test" is a vocabulary entry; the lexicon must carry that sense.
    const vocabulary = ALL_WORDS.find((word) => word.word === 'test')
    expect(vocabulary && LEXICON.test).toBe(vocabulary?.translation)
  })

  it('keeps every glossary word', () => {
    const missing = Object.keys(GLOSSARY).filter((key) => !LEXICON[key])
    expect(missing).toEqual([])
  })

  it('leaves out multi-word entries, so a phrase never teaches its parts', () => {
    expect(LEXICON.road).not.toBe('ponerse en marcha')
  })
})
