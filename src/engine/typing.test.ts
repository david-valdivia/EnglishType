import { describe, expect, it } from 'vitest'
import {
  createTypingState,
  keyPress,
  reveal,
  revealNext,
  revealRest,
  revealWord,
  visibleText,
} from './typing'

const start = () => createTypingState('cup', 'I have a cup.')

describe('createTypingState', () => {
  it('starts on the word with nothing typed', () => {
    const s = start()
    expect(s.phase).toBe('word')
    expect(visibleText(s.word)).toBe('')
    expect(s.usedHelp).toBe(false)
  })

  it('marks letters as typeable and punctuation as automatic', () => {
    const s = createTypingState('cup', 'I have a cup.')
    expect(s.word.map((x) => x.typeable)).toEqual([true, true, true])
    // "I have a cup." -> spaces and the period are filled in automatically
    expect(s.sentence.filter((x) => !x.typeable).map((x) => x.char)).toEqual([' ', ' ', ' ', '.'])
  })
})

describe('keyPress on the word', () => {
  it('accepts the correct letter and advances', () => {
    const s = keyPress(start(), 'c')
    expect(visibleText(s.word)).toBe('c')
    expect(s.wrong).toBe(false)
  })

  it('is case insensitive', () => {
    expect(visibleText(keyPress(start(), 'C').word)).toBe('c')
  })

  it('rejects a wrong letter without advancing', () => {
    const s = keyPress(start(), 'x')
    expect(visibleText(s.word)).toBe('')
    expect(s.wrong).toBe(true)
  })

  it('clears the wrong flag on the next correct letter', () => {
    const s = keyPress(keyPress(start(), 'x'), 'c')
    expect(s.wrong).toBe(false)
  })

  it('ignores keys that are not single characters', () => {
    const s = keyPress(start(), 'Shift')
    expect(visibleText(s.word)).toBe('')
    expect(s.wrong).toBe(false)
  })

  it('moves to the sentence once the word is complete', () => {
    const s = 'cup'.split('').reduce(keyPress, start())
    expect(s.phase).toBe('sentence')
    expect(visibleText(s.word)).toBe('cup')
  })
})

describe('keyPress on the sentence', () => {
  const atSentence = () => 'cup'.split('').reduce(keyPress, start())

  it('fills spaces automatically after a word ends', () => {
    const s = keyPress(atSentence(), 'i')
    expect(visibleText(s.sentence)).toBe('I ')
  })

  it('fills trailing punctuation automatically and finishes', () => {
    const s = 'ihaveacup'.split('').reduce(keyPress, atSentence())
    expect(visibleText(s.sentence)).toBe('I have a cup.')
    expect(s.phase).toBe('done')
  })

  it('stays done and ignores further keys', () => {
    const done = 'ihaveacup'.split('').reduce(keyPress, atSentence())
    expect(keyPress(done, 'z')).toEqual(done)
  })
})

describe('reveal', () => {
  it('completes the sentence and records that help was used', () => {
    const s = reveal('cup'.split('').reduce(keyPress, start()))
    expect(visibleText(s.sentence)).toBe('I have a cup.')
    expect(s.phase).toBe('done')
    expect(s.usedHelp).toBe(true)
  })

  it('also completes the word when revealed early', () => {
    const s = reveal(start())
    expect(visibleText(s.word)).toBe('cup')
    expect(s.usedHelp).toBe(true)
  })
})

describe('multi-word targets', () => {
  it('auto-fills the space inside the answer itself', () => {
    let s = createTypingState('wine glass', 'The wine glass is empty.')
    s = 'wine'.split('').reduce(keyPress, s)
    expect(visibleText(s.word)).toBe('wine ')
    s = 'glass'.split('').reduce(keyPress, s)
    expect(s.phase).toBe('sentence')
  })
})

describe('accents', () => {
  // The learner may be typing Spanish on an English keyboard, so an unaccented
  // letter counts as correct — the accented character is what gets shown.
  const accented = () => createTypingState('delfín', 'Un delfín es muy listo.')

  it('accepts the plain letter for an accented one', () => {
    const s = 'delfin'.split('').reduce(keyPress, accented())
    expect(visibleText(s.word)).toBe('delfín')
    expect(s.phase).toBe('sentence')
  })

  it('still accepts the accented letter', () => {
    const s = 'delfín'.split('').reduce(keyPress, accented())
    expect(visibleText(s.word)).toBe('delfín')
  })

  it('does not accept a different letter', () => {
    expect(keyPress(createTypingState('delfín', 'x.'), 'x').wrong).toBe(true)
  })

  it('treats ñ and n as distinct', () => {
    const s = createTypingState('año', 'El año pasado.')
    expect(keyPress(keyPress(s, 'a'), 'n').wrong).toBe(true)
  })
})

describe('revealNext', () => {
  it('fills one letter and records that help was used', () => {
    const s = revealNext(start())
    expect(visibleText(s.word)).toBe('c')
    expect(s.usedHelp).toBe(true)
    expect(s.phase).toBe('word')
  })

  it('can be used repeatedly to finish the word', () => {
    let s = start()
    for (let i = 0; i < 3; i++) s = revealNext(s)
    expect(visibleText(s.word)).toBe('cup')
    expect(s.phase).toBe('sentence')
  })

  it('carries automatic characters along with the letter', () => {
    let s = 'cup'.split('').reduce(keyPress, start())
    s = revealNext(s)
    expect(visibleText(s.sentence)).toBe('I ')
  })

  it('finishes the exercise when the last letter is revealed', () => {
    let s = 'cup'.split('').reduce(keyPress, start())
    for (let i = 0; i < 20 && s.phase !== 'done'; i++) s = revealNext(s)
    expect(visibleText(s.sentence)).toBe('I have a cup.')
    expect(s.phase).toBe('done')
  })

  it('does nothing once the exercise is done', () => {
    const done = reveal(start())
    expect(revealNext(done)).toEqual(done)
  })
})

describe('exercises with no sentence', () => {
  it('finishes as soon as the word is complete', () => {
    const s = 'ir'.split('').reduce(keyPress, createTypingState('ir', ''))
    expect(s.phase).toBe('done')
  })

  it('finishes the same way when the word is revealed', () => {
    let s = createTypingState('ir', '')
    s = revealNext(revealNext(s))
    expect(s.phase).toBe('done')
    expect(s.usedHelp).toBe(true)
  })
})

describe('revealWord', () => {
  const atSentence = () => 'cup'.split('').reduce(keyPress, start())

  it('fills the whole next word, not just a letter', () => {
    const s = revealWord(atSentence())
    expect(visibleText(s.sentence)).toBe('I ')
    expect(s.usedHelp).toBe(true)
  })

  it('finishes a partly typed word rather than starting the next one', () => {
    let s = keyPress(keyPress(atSentence(), 'i'), 'h')
    expect(visibleText(s.sentence)).toBe('I h')
    s = revealWord(s)
    expect(visibleText(s.sentence)).toBe('I have ')
  })

  it('walks the sentence word by word to the end', () => {
    let s = atSentence()
    for (let i = 0; i < 10 && s.phase !== 'done'; i++) s = revealWord(s)
    expect(visibleText(s.sentence)).toBe('I have a cup.')
    expect(s.phase).toBe('done')
  })

  it('works on the word itself too', () => {
    const s = revealWord(start())
    expect(visibleText(s.word)).toBe('cup')
    expect(s.phase).toBe('sentence')
  })

  it('does nothing once the exercise is done', () => {
    const done = reveal(start())
    expect(revealWord(done)).toEqual(done)
  })
})

describe('revealRest', () => {
  it('completes the current phase only, and marks help', () => {
    const s = revealRest('cup'.split('').reduce(keyPress, start()))
    expect(visibleText(s.sentence)).toBe('I have a cup.')
    expect(s.phase).toBe('done')
    expect(s.usedHelp).toBe(true)
  })

  it('moves on to the sentence when used on the word', () => {
    const s = revealRest(start())
    expect(visibleText(s.word)).toBe('cup')
    expect(s.phase).toBe('sentence')
    expect(visibleText(s.sentence)).toBe('')
  })
})
