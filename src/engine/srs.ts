/**
 * Spaced repetition: a Leitner ladder over four boxes.
 *
 * Answer a word without asking for help and it moves up a box, pushing the
 * next review further out. Ask for help and it drops back to the start, so
 * the words you lean on keep coming back.
 */

export const DAY = 24 * 60 * 60 * 1000

export const INTERVALS_DAYS = [1, 3, 7, 21] as const

export type Review = {
  /** 0 = brand new, INTERVALS_DAYS.length = fully learned. */
  box: number
  dueAt: number
}

export type Reviews = Record<string, Review>

const scheduleFor = (box: number, now: number): number => {
  if (box <= 0) return now + INTERVALS_DAYS[0] * DAY
  const days = INTERVALS_DAYS[Math.min(box, INTERVALS_DAYS.length) - 1]
  return now + days * DAY
}

export function initialReview(now: number): Review {
  return { box: 0, dueAt: now }
}

export function reviewAfter(
  review: Review,
  outcome: { usedHelp: boolean },
  now: number,
): Review {
  const box = outcome.usedHelp ? 0 : Math.min(review.box + 1, INTERVALS_DAYS.length)
  return { box, dueAt: scheduleFor(box, now) }
}

/** Words whose review has come around, most overdue first. */
export function dueWords(reviews: Reviews, now: number): string[] {
  return Object.entries(reviews)
    .filter(([, review]) => review.dueAt <= now)
    .sort(([, a], [, b]) => a.dueAt - b.dueAt)
    .map(([id]) => id)
}
