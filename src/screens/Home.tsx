import { useLayoutEffect, useState } from 'react'
import { CHAPTER_INDEX } from '../data/manifest'
import type { ChapterSummary } from '../data/summary'
import { Icon } from '../components/Icon'
import { chapterProgress, type Progress } from '../store/progress'
import { DIRECTIONS, type Direction } from '../engine/task'
import { speechProblem, speechSteps } from '../lib/speech'
import { useSpeechOutlook } from '../lib/useSpeechOutlook'

const DISMISSED = 'englishtype:audio-notice-dismissed:v1'

/** Chapters under each heading, in the order the headings should appear. */
function groupChapters(chapters: ChapterSummary[]) {
  const groups: { group: string; chapters: ChapterSummary[] }[] = []
  for (const chapter of chapters) {
    const last = groups.at(-1)
    if (last?.group === chapter.group) last.chapters.push(chapter)
    else groups.push({ group: chapter.group, chapters: [chapter] })
  }
  return groups
}

export type Deck = {
  title: string
  wordIds: string[]
  /** Review is already sorted by how overdue each word is; leave it alone. */
  keepOrder?: boolean
}

export function Home({
  progress,
  decks,
  direction,
  onChooseDirection,
  onStart,
  restoreScroll,
}: {
  progress: Progress
  decks: { review: Deck; marked: Deck; random: Deck; all: Deck }
  direction: Direction
  onChooseDirection: (direction: Direction) => void
  onStart: (deck: Deck) => void
  /** Where the list stood when the last chapter was opened. */
  restoreScroll: number
}) {
  // Finishing a chapter should put you back beside it, not at the top of a
  // list nearly two hundred chapters long.
  useLayoutEffect(() => {
    window.scrollTo(0, restoreScroll)
  }, [restoreScroll])

  const { review, marked, random, all } = decks
  const learnedTotal = progress.learned.length
  const outlook = useSpeechOutlook()
  const [noticeDismissed, setNoticeDismissed] = useState(() => {
    try {
      return window.localStorage.getItem(DISMISSED) === 'yes'
    } catch {
      return false
    }
  })

  const dismissNotice = () => {
    setNoticeDismissed(true)
    try {
      window.localStorage.setItem(DISMISSED, 'yes')
    } catch {
      // Private browsing: it will come back next visit, which is harmless.
    }
  }

  return (
    <div className="app">
      {outlook === 'blocked' && !noticeDismissed && (
        <div className="shell">
          <aside className="browser-card">
            <span className="browser-card-icon" aria-hidden>
              🔊
            </span>
            <div>
              <p className="browser-card-title">The sentences are read aloud — in Chrome</p>
              <p className="browser-card-body">{speechProblem()}</p>
              <ul className="browser-card-steps">
                {speechSteps().map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            </div>
            <button className="browser-card-close" onClick={dismissNotice} aria-label="Dismiss">
              ✕
            </button>
          </aside>
        </div>
      )}

      <div className="shell home-head">
        <h1>EnglishType</h1>
        <p>Type each word letter by letter. You remember what your hands have written.</p>

        <div className="switcher" role="group" aria-label="Exercise direction">
          {DIRECTIONS.map(({ id, label, hint }) => (
            <button
              key={id}
              className={`swap ${direction === id ? 'on' : ''}`}
              aria-pressed={direction === id}
              onClick={() => onChooseDirection(id)}
            >
              <span className="swap-label">{label}</span>
              <span className="swap-hint">{hint}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="shell">
        <div className="deck-row">
          <button
            className="deck review"
            disabled={review.wordIds.length === 0}
            onClick={() => onStart(review)}
          >
            <Icon name="counterclockwise-arrows-button" className="glyph" />
            <span className="name">Review</span>
            <span className="meta">
              {review.wordIds.length === 0 ? 'Nothing due today' : `${review.wordIds.length} due today`}
            </span>
          </button>

          <button
            className="deck marked"
            disabled={marked.wordIds.length === 0}
            onClick={() => onStart(marked)}
          >
            <Icon name="star" className="glyph" />
            <span className="name">Marked words</span>
            <span className="meta">
              {marked.wordIds.length === 0 ? 'Star a word to add it' : `${marked.wordIds.length} saved`}
            </span>
          </button>

          <button className="deck random" onClick={() => onStart(random)}>
            <Icon name="game-die" className="glyph" />
            <span className="name">Random words</span>
            <span className="meta">from all {all.wordIds.length} words</span>
          </button>

          <button className="deck every" onClick={() => onStart(all)}>
            <Icon name="shuffle-tracks-button" className="glyph" />
            <span className="name">All words</span>
            <span className="meta">
              {learnedTotal} / {all.wordIds.length}
            </span>
          </button>
        </div>

        {groupChapters(CHAPTER_INDEX).map(({ group, chapters }) => (
          <section className="group" key={group}>
            <h2 className="section-title">{group}</h2>
            <div className="chapter-grid">
              {chapters.map((chapter) => {
                const { done, total } = chapterProgress(progress, chapter.wordIds)
                const complete = done === total
                return (
                  <button
                    key={chapter.id}
                    className={`chapter ${complete ? 'complete' : ''}`}
                    onClick={() => onStart({ title: chapter.title, wordIds: chapter.wordIds })}
                  >
                    {complete && <span className="badge">✓</span>}
                    <Icon name={chapter.icon} />
                    <div className="name">{chapter.title}</div>
                    <div className="meta">
                      {done} / {total}
                    </div>
                  </button>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
