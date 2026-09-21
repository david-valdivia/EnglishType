import { CHAPTER_GROUPS, type Word } from '../data'
import { Icon } from '../components/Icon'
import { chapterProgress, type Progress } from '../store/progress'
import { DIRECTIONS, type Direction } from '../engine/task'

export type Deck = { title: string; words: Word[] }

export function Home({
  progress,
  decks,
  direction,
  onChooseDirection,
  onStart,
}: {
  progress: Progress
  decks: { review: Deck; marked: Deck; random: Deck; all: Deck }
  direction: Direction
  onChooseDirection: (direction: Direction) => void
  onStart: (deck: Deck) => void
}) {
  const { review, marked, random, all } = decks
  const learnedTotal = progress.learned.length

  return (
    <div className="app">
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
            disabled={review.words.length === 0}
            onClick={() => onStart(review)}
          >
            <Icon name="counterclockwise-arrows-button" className="glyph" />
            <span className="name">Review</span>
            <span className="meta">
              {review.words.length === 0 ? 'Nothing due today' : `${review.words.length} due today`}
            </span>
          </button>

          <button
            className="deck marked"
            disabled={marked.words.length === 0}
            onClick={() => onStart(marked)}
          >
            <Icon name="star" className="glyph" />
            <span className="name">Marked words</span>
            <span className="meta">
              {marked.words.length === 0 ? 'Star a word to add it' : `${marked.words.length} saved`}
            </span>
          </button>

          <button className="deck random" onClick={() => onStart(random)}>
            <Icon name="game-die" className="glyph" />
            <span className="name">Random words</span>
            <span className="meta">from all {all.words.length} words</span>
          </button>

          <button className="deck every" onClick={() => onStart(all)}>
            <Icon name="shuffle-tracks-button" className="glyph" />
            <span className="name">All words</span>
            <span className="meta">
              {learnedTotal} / {all.words.length}
            </span>
          </button>
        </div>

        {CHAPTER_GROUPS.map(({ group, chapters }) => (
          <section className="group" key={group}>
            <h2 className="section-title">{group}</h2>
            <div className="chapter-grid">
              {chapters.map((chapter) => {
                const { done, total } = chapterProgress(progress, chapter)
                const complete = done === total
                return (
                  <button
                    key={chapter.id}
                    className={`chapter ${complete ? 'complete' : ''}`}
                    onClick={() => onStart({ title: chapter.title, words: chapter.words })}
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
