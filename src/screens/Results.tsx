import { useEffect, useRef } from 'react'
import { displayForms, typingTarget, type Word } from '../data/types'
import type { Direction } from '../engine/task'
import { sentenceEs } from '../data/load'
import { Icon } from '../components/Icon'
import { SpeakerGlyph } from '../components/Glyphs'
import { say } from '../lib/speech'
import { playVictory } from '../lib/chime'

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
  // Guarded, because React mounts effects twice in development and one
  // fanfare is plenty.
  const sounded = useRef(false)
  useEffect(() => {
    if (sounded.current) return
    sounded.current = true
    playVictory()
  }, [])

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
              <div className="example-es">{sentenceEs(word.id)}</div>
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
