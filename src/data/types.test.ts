import { describe, expect, it } from 'vitest'
import { displayForms, typingTarget, type Word } from './types'

const noun: Word = {
  id: 'cup', word: 'cup', translation: 'taza',
  sentence: 'I have a cup.', icon: 'teacup-without-handle',
}

const verb: Word = {
  id: 'go', word: 'go', translation: 'ir', meaning: 'to move somewhere',
  sentence: 'We go home now.', icon: 'person-running', forms: ['went', 'gone'],
}

describe('typingTarget', () => {
  it('is the word itself for a plain entry', () => {
    expect(typingTarget(noun)).toBe('cup')
  })

  it('is all three forms for an irregular verb', () => {
    expect(typingTarget(verb)).toBe('go went gone')
  })
})

describe('displayForms', () => {
  it('leaves a plain entry alone', () => {
    expect(displayForms(noun)).toBe('cup')
  })

  it('separates the three forms of a verb', () => {
    expect(displayForms(verb)).toBe('go · went · gone')
  })
})
