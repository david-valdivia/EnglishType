import { describe, expect, it } from 'vitest'
import { deckOrder, shuffle } from './deck'

const items = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']

describe('shuffle', () => {
  it('keeps every item exactly once', () => {
    expect(shuffle(items).sort()).toEqual([...items].sort())
  })

  it('does not change the original', () => {
    const copy = [...items]
    shuffle(items)
    expect(items).toEqual(copy)
  })

  it('actually reorders', () => {
    // A fixed generator, so this asserts behaviour rather than luck.
    let seed = 0
    const random = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280)
    expect(shuffle(items, random)).not.toEqual(items)
  })

  it('does not start with the same item every time', () => {
    const firsts = new Set(Array.from({ length: 40 }, () => shuffle(items)[0]))
    expect(firsts.size).toBeGreaterThan(1)
  })
})

describe('deckOrder', () => {
  it('shuffles a chapter, so it does not always open on the same word', () => {
    const opens = new Set(Array.from({ length: 40 }, () => deckOrder(items, false)[0]))
    expect(opens.size).toBeGreaterThan(1)
  })

  it('leaves review alone, because most overdue first is the point of it', () => {
    expect(deckOrder(items, true)).toEqual(items)
  })
})
