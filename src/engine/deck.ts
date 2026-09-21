/**
 * The order a deck is presented in.
 *
 * Chapters are written in a sensible reading order, which makes them
 * predictable: open Kitchen and it always starts with "pot". A deck is shuffled
 * each time it is opened, so the tenth word gets asked first as often as the
 * first does.
 *
 * Review is the exception. It is already ordered by how overdue each word is,
 * and that order is the whole point of it.
 */

export const shuffle = <T,>(items: readonly T[], random: () => number = Math.random): T[] => {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export function deckOrder<T>(items: readonly T[], keepOrder: boolean): T[] {
  return keepOrder ? [...items] : shuffle(items)
}
