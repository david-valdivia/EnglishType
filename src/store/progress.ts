/**
 * Everything the app remembers between visits, kept in localStorage.
 *
 * Progress is a plain serialisable value and every helper returns a new one,
 * so React state updates stay predictable and the whole thing is easy to test
 * against an in-memory stand-in for localStorage.
 */

import { initialReview, reviewAfter, type Reviews } from '../engine/srs'

const KEY = 'englishtype:progress:v1'

export type Progress = {
  reviews: Reviews
  /** Words answered at least once without help. */
  learned: string[]
  /** Words starred for the "Marked words" deck. */
  marked: string[]
}

/** The minimal surface we need from localStorage, so tests can substitute one. */
export type ProgressStorage = {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export const emptyProgress = (): Progress => ({ reviews: {}, learned: [], marked: [] })

export function loadProgress(storage: ProgressStorage): Progress {
  try {
    const raw = storage.getItem(KEY)
    if (!raw) return emptyProgress()
    const parsed = JSON.parse(raw) as Partial<Progress>
    return {
      reviews: parsed.reviews ?? {},
      learned: parsed.learned ?? [],
      marked: parsed.marked ?? [],
    }
  } catch {
    // A corrupt or unreadable store should never block the app.
    return emptyProgress()
  }
}

export function saveProgress(storage: ProgressStorage, progress: Progress): void {
  try {
    storage.setItem(KEY, JSON.stringify(progress))
  } catch {
    // Private browsing and full quotas are not worth crashing over.
  }
}

export function recordAnswer(
  progress: Progress,
  wordId: string,
  outcome: { usedHelp: boolean },
  now: number,
): Progress {
  const current = progress.reviews[wordId] ?? initialReview(now)
  const learned =
    outcome.usedHelp || progress.learned.includes(wordId)
      ? progress.learned
      : [...progress.learned, wordId]

  return {
    ...progress,
    reviews: { ...progress.reviews, [wordId]: reviewAfter(current, outcome, now) },
    learned,
  }
}

export const isMarked = (progress: Progress, wordId: string): boolean =>
  progress.marked.includes(wordId)

export const markedCount = (progress: Progress): number => progress.marked.length

export function toggleMark(progress: Progress, wordId: string): Progress {
  const marked = isMarked(progress, wordId)
    ? progress.marked.filter((id) => id !== wordId)
    : [...progress.marked, wordId]
  return { ...progress, marked }
}

export function chapterProgress(
  progress: Progress,
  wordIds: string[],
): { done: number; total: number } {
  const done = wordIds.filter((id) => progress.learned.includes(id)).length
  return { done, total: wordIds.length }
}
