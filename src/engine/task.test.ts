import { describe, expect, it } from 'vitest'
import { DIRECTIONS, taskFor } from './task'
import type { Word } from '../data/types'

const noun: Word = {
  id: 'dolphin', word: 'dolphin', translation: 'delfín',
  sentence: 'A dolphin is very smart.', icon: 'dolphin',
}

const verb: Word = {
  id: 'v-go', word: 'go', forms: ['went', 'gone'], translation: 'ir',
  meaning: 'to move to another place', sentence: 'They went home early.', icon: 'person-running',
}

describe('taskFor, Spanish to English', () => {
  it('shows the Spanish and asks for the English', () => {
    const task = taskFor(noun, 'es-en')
    expect(task.prompt).toBe('delfín')
    expect(task.promptLanguage).toBe('es')
    expect(task.answer).toBe('dolphin')
  })

  it('asks for all three forms of a verb', () => {
    expect(taskFor(verb, 'es-en').answer).toBe('go went gone')
  })

  it('includes the example sentence', () => {
    expect(taskFor(noun, 'es-en').sentence).toBe('A dolphin is very smart.')
  })
})

describe('taskFor, English to Spanish', () => {
  it('shows the English and asks for the Spanish', () => {
    const task = taskFor(noun, 'en-es')
    expect(task.prompt).toBe('dolphin')
    expect(task.promptLanguage).toBe('en')
    expect(task.answer).toBe('delfín')
  })

  it('shows all three forms of a verb as the prompt', () => {
    expect(taskFor(verb, 'en-es').prompt).toBe('go · went · gone')
  })

  it('has no sentence to type, because the answer is not English', () => {
    expect(taskFor(noun, 'en-es').sentence).toBe('')
  })
})

describe('taskFor, both directions', () => {
  it('always speaks the English', () => {
    expect(taskFor(verb, 'es-en').speech).toBe('go went gone')
    expect(taskFor(verb, 'en-es').speech).toBe('go went gone')
  })

  it('carries the gloss through', () => {
    expect(taskFor(verb, 'es-en').meaning).toBe('to move to another place')
    expect(taskFor(noun, 'es-en').meaning).toBe('')
  })

  it('never leaves the learner without a prompt', () => {
    for (const { id } of DIRECTIONS) {
      for (const word of [noun, verb]) {
        expect(taskFor(word, id).prompt.length).toBeGreaterThan(0)
      }
    }
  })
})

describe('three-form verbs', () => {
  it('flags a verb so the interface can ask for all three forms', () => {
    expect(taskFor(verb, 'es-en').threeForms).toBe(true)
  })

  it('does not flag a plain word', () => {
    expect(taskFor(noun, 'es-en').threeForms).toBe(false)
  })

  it('does not flag the other direction, where the forms are given', () => {
    expect(taskFor(verb, 'en-es').threeForms).toBe(false)
  })

  it('names the three parts in order', () => {
    expect(taskFor(verb, 'es-en').formLabels).toEqual(['base', 'past', 'participle'])
  })

  it('gives a plain word no part labels', () => {
    expect(taskFor(noun, 'es-en').formLabels).toEqual([])
  })
})
