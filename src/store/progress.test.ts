import { beforeEach, describe, expect, it } from 'vitest'
import {
  chapterProgress,
  emptyProgress,
  isMarked,
  loadProgress,
  markedCount,
  recordAnswer,
  saveProgress,
  toggleMark,
} from './progress'
import { CHAPTERS } from '../data'

class MemoryStorage {
  private map = new Map<string, string>()
  getItem = (k: string) => this.map.get(k) ?? null
  setItem = (k: string, v: string) => void this.map.set(k, v)
}

let storage: MemoryStorage
beforeEach(() => {
  storage = new MemoryStorage()
})

const now = new Date('2026-09-21T10:00:00Z').getTime()

describe('loadProgress', () => {
  it('returns an empty progress when nothing is stored', () => {
    expect(loadProgress(storage)).toEqual(emptyProgress())
  })

  it('round-trips through storage', () => {
    const saved = recordAnswer(emptyProgress(), 'cup', { usedHelp: false }, now)
    saveProgress(storage, saved)
    expect(loadProgress(storage)).toEqual(saved)
  })

  it('falls back to empty progress when the stored value is corrupt', () => {
    storage.setItem('englishtype:progress:v1', '{not json')
    expect(loadProgress(storage)).toEqual(emptyProgress())
  })
})

describe('recordAnswer', () => {
  it('schedules a review and counts the word as learned', () => {
    const p = recordAnswer(emptyProgress(), 'cup', { usedHelp: false }, now)
    expect(p.reviews.cup.box).toBe(1)
    expect(p.learned).toContain('cup')
  })

  it('does not count a helped word as learned', () => {
    const p = recordAnswer(emptyProgress(), 'cup', { usedHelp: true }, now)
    expect(p.reviews.cup.box).toBe(0)
    expect(p.learned).not.toContain('cup')
  })

  it('keeps a word learned even if a later attempt needs help', () => {
    let p = recordAnswer(emptyProgress(), 'cup', { usedHelp: false }, now)
    p = recordAnswer(p, 'cup', { usedHelp: true }, now)
    expect(p.learned).toContain('cup')
    expect(p.reviews.cup.box).toBe(0)
  })

  it('does not duplicate a word already learned', () => {
    let p = recordAnswer(emptyProgress(), 'cup', { usedHelp: false }, now)
    p = recordAnswer(p, 'cup', { usedHelp: false }, now)
    expect(p.learned.filter((id) => id === 'cup')).toHaveLength(1)
  })
})

describe('marking', () => {
  it('toggles a word on and off', () => {
    let p = toggleMark(emptyProgress(), 'cup')
    expect(isMarked(p, 'cup')).toBe(true)
    expect(markedCount(p)).toBe(1)

    p = toggleMark(p, 'cup')
    expect(isMarked(p, 'cup')).toBe(false)
    expect(markedCount(p)).toBe(0)
  })
})

describe('chapterProgress', () => {
  const kitchen = CHAPTERS[0]

  it('counts learned words in the chapter', () => {
    let p = emptyProgress()
    p = recordAnswer(p, 'cup', { usedHelp: false }, now)
    p = recordAnswer(p, 'spoon', { usedHelp: false }, now)
    p = recordAnswer(p, 'dog', { usedHelp: false }, now) // another chapter
    expect(chapterProgress(p, kitchen.words.map((w) => w.id))).toEqual({ done: 2, total: 10 })
  })
})
