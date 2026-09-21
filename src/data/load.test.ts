import { beforeAll, describe, expect, it } from 'vitest'
import { loadExerciseText, sentenceEs, translateToken } from './load'
import { ALL_WORDS } from './index'

// The lexicon and the sentences are fetched, not bundled, so every test here
// needs them in memory first.
beforeAll(() => loadExerciseText())

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

  it('has no glossary entry that duplicates a vocabulary word', async () => {
    const { GLOSSARY } = await import('./glossary')
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
    const translated = new Set(ALL_WORDS.map((w) => w.id).filter((id) => sentenceEs(id)))

    const untranslated = [...ids].filter((id) => !translated.has(id)).sort()
    const orphans = [...translated].filter((id) => !ids.has(id)).sort()

    expect({ untranslated, orphans }).toEqual({ untranslated: [], orphans: [] })
  })

  it('writes every translation as a sentence', () => {
    const malformed = ALL_WORDS.filter(
      (word) => !/^[¿¡A-ZÁÉÍÓÚÑ].*[.!?]$/u.test(sentenceEs(word.id)),
    )
    expect(malformed.map((word) => word.id)).toEqual([])
  })

  it('never leaves a translation identical to its English', () => {
    const same = ALL_WORDS.filter((word) => sentenceEs(word.id) === word.sentence)
    expect(same.map((word) => word.id)).toEqual([])
  })
})
