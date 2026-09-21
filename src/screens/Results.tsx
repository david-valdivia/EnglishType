import { displayForms, typingTarget, type Word } from '../data'
import type { Direction } from '../engine/task'
import { Icon } from '../components/Icon'
import { SpeakerGlyph } from '../components/Glyphs'
import { say } from '../lib/speech'

export function Results({
  words,
  direction,
  withoutHelp,
  onRetry,
  onHome,
}: {
  words: Word[]
  direction: Direction
  withoutHelp: number
  onRetry: () => void
  onHome: () => void
}) {
  return (
    <div className="app">
      <div className="shell topbar">
        <span className="iconbtn" />
        <div className="track">
          <i style={{ width: '100%' }} />
        </div>
      </div>

      <div className="shell results">
        <Icon name="trophy" className="mark" />
        <h2>Done!</h2>
        <p className="score">
          Without help: <b>{withoutHelp}</b> / {words.length}
        </p>

        <div className="word-grid">
          {words.map((word) => (
            <div className="word-card" key={word.id}>
              <button className="say" onClick={() => say(typingTarget(word))} aria-label={`Listen to ${typingTarget(word)}`}>
                <SpeakerGlyph size={14} />
              </button>
              <Icon name={word.icon} />
              <div className="en">{displayForms(word)}</div>
              <div className="es">{word.translation}</div>
              {word.meaning && <div className="gloss-sm">{word.meaning}</div>}
              {/* In this direction the example was never typed, so show it here. */}
              {direction === 'en-es' && <div className="example">{word.sentence}</div>}
            </div>
          ))}
        </div>

        <div className="actions">
          <button className="btn primary" onClick={onRetry}>
            Try again
          </button>
          <button className="btn ghost" onClick={onHome}>
            All chapters
          </button>
        </div>
      </div>
    </div>
  )
}
