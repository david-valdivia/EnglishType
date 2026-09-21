import { describe, expect, it } from 'vitest'
import { DAY, INTERVALS_DAYS, dueWords, initialReview, reviewAfter } from './srs'

const at = (iso: string) => new Date(iso).getTime()
const now = at('2026-09-21T10:00:00Z')

describe('initialReview', () => {
  it('starts an unseen word in box 0, due immediately', () => {
    const r = initialReview(now)
    expect(r.box).toBe(0)
    expect(r.dueAt).toBe(now)
  })
})

describe('reviewAfter', () => {
  it('promotes a word answered without help', () => {
    const r = reviewAfter(initialReview(now), { usedHelp: false }, now)
    expect(r.box).toBe(1)
    expect(r.dueAt).toBe(now + INTERVALS_DAYS[0] * DAY)
  })

  it('keeps promoting through the ladder', () => {
    let r = initialReview(now)
    for (const box of [1, 2, 3, 4]) {
      r = reviewAfter(r, { usedHelp: false }, now)
      expect(r.box).toBe(box)
    }
    expect(r.dueAt).toBe(now + INTERVALS_DAYS[3] * DAY)
  })

  it('caps at the last box instead of running off the ladder', () => {
    let r = initialReview(now)
    for (let i = 0; i < 10; i++) r = reviewAfter(r, { usedHelp: false }, now)
    expect(r.box).toBe(INTERVALS_DAYS.length)
    expect(r.dueAt).toBe(now + INTERVALS_DAYS.at(-1)! * DAY)
  })

  it('sends a helped word back to the start', () => {
    let r = reviewAfter(initialReview(now), { usedHelp: false }, now)
    r = reviewAfter(r, { usedHelp: false }, now)
    expect(r.box).toBe(2)

    r = reviewAfter(r, { usedHelp: true }, now)
    expect(r.box).toBe(0)
    expect(r.dueAt).toBe(now + INTERVALS_DAYS[0] * DAY)
  })
})

describe('dueWords', () => {
  const reviews = {
    cup: { box: 1, dueAt: at('2026-09-20T10:00:00Z') },
    pot: { box: 2, dueAt: at('2026-09-21T09:00:00Z') },
    owl: { box: 1, dueAt: at('2026-09-25T10:00:00Z') },
  }

  it('returns only words due at or before now', () => {
    expect(dueWords(reviews, now).sort()).toEqual(['cup', 'pot'])
  })

  it('returns nothing when everything is scheduled ahead', () => {
    expect(dueWords(reviews, at('2026-09-19T10:00:00Z'))).toEqual([])
  })

  it('orders the most overdue word first', () => {
    expect(dueWords(reviews, now)[0]).toBe('cup')
  })
})
