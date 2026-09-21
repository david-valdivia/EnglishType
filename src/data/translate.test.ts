import { describe, expect, it } from 'vitest'
import { GLOSSARY } from './glossary'
import { translateToken } from './translate'
import { ALL_WORDS } from './index'
import { SENTENCES_ES } from './sentences-es'

describe('translateToken', () => {
  it('finds a glossary word', () => {
    expect(translateToken('please')).toBe('por favor')
  })

  it('ignores case and surrounding punctuation', () => {
    expect(translateToken('Please,')).toBe('por favor')
    expect(translateToken('"today."')).toBe('hoy')
  })

  it('prefers the vocabulary, so the learner sees the sense they studied', () => {
    expect(translateToken('dolphin')).toBe('delfín')
  })

  it('resolves a regular plural to its base', () => {
    expect(translateToken('dolphins')).toBe('delfín')
  })

  it('resolves a regular past tense to its base', () => {
    expect(translateToken('walked')).toBe('caminar')
  })

  it('knows an irregular past from the verb forms', () => {
    expect(translateToken('went')).toBe('ir')
  })

  it('returns nothing for a word it does not know', () => {
    expect(translateToken('zzzz')).toBeUndefined()
  })

  it('returns nothing for punctuation alone', () => {
    expect(translateToken('.')).toBeUndefined()
  })
})

describe('coverage', () => {
  it('translates every word used in every example sentence', () => {
    const unknown = new Set<string>()
    for (const word of ALL_WORDS) {
      for (const token of word.sentence.split(/\s+/)) {
        const clean = token.replace(/[^\p{Letter}\p{Number}'-]/gu, '')
        if (clean && !translateToken(clean)) unknown.add(clean.toLowerCase())
      }
    }
    expect([...unknown].sort()).toEqual([])
  })

  it('has no glossary entry that duplicates a vocabulary word', () => {
    // Harmless, but it means two sources of truth for the same word.
    const vocab = new Set(
      ALL_WORDS.filter((w) => !/\s/.test(w.word)).map((w) => w.word.toLowerCase()),
    )
    const shadowed = Object.keys(GLOSSARY).filter((key) => vocab.has(key))
    expect(shadowed).toEqual([])
  })
})

describe('sentence translations', () => {
  it('translates every sentence, and nothing that is not one', () => {
    const ids = new Set(ALL_WORDS.map((word) => word.id))
    const translated = new Set(Object.keys(SENTENCES_ES))

    const untranslated = [...ids].filter((id) => !translated.has(id)).sort()
    const orphans = [...translated].filter((id) => !ids.has(id)).sort()

    expect({ untranslated, orphans }).toEqual({ untranslated: [], orphans: [] })
  })

  it('writes every translation as a sentence', () => {
    const malformed = Object.entries(SENTENCES_ES).filter(
      ([, text]) => !/^[¿¡A-ZÁÉÍÓÚÑ].*[.!?]$/u.test(text),
    )
    expect(malformed.map(([id]) => id)).toEqual([])
  })

  it('never leaves a translation identical to its English', () => {
    const same = ALL_WORDS.filter((word) => SENTENCES_ES[word.id] === word.sentence)
    expect(same.map((word) => word.id)).toEqual([])
  })
})
