import { useEffect, useMemo, useRef, useState } from 'react'
import type { Word } from '../data/types'
import { createTypingState, keyPress, revealNext, revealRest, revealWord } from '../engine/typing'
import { taskFor, type Direction } from '../engine/task'
import { sentenceEs, translateToken } from '../data/load'
import { Icon } from '../components/Icon'
import { preloadIcon } from '../lib/icons'
import { TypedLine } from '../components/TypedLine'
import { BackGlyph, CheckGlyph, EyeGlyph, SpeakerGlyph, StarGlyph } from '../components/Glyphs'
import { say, speechProblem, speechSteps } from '../lib/speech'
import { playHelped, playKey, playSuccess } from '../lib/chime'
import { explainLocally, localAvailability, searchUrl, type Availability } from '../lib/explain'

const cursorOf = (slots: { filled: boolean }[]) => slots.findIndex((slot) => !slot.filled)

/** Shown when a tapped word is not in the vocabulary — a Spanish one never is. */
const UNTRANSLATED = 'sin traducción'

/**
 * Splits text that is already on screen into words you can tap. Only what is
 * visible anyway is ever wrapped in these, so nothing here gives an answer
 * away.
 */
function AskableWords({ text, onWord }: { text: string; onWord: (word: string) => void }) {
  return (
    <>
      {text.split(/(\s+)/).map((part, index) =>
        // A word the dictionary does not carry stays plain text, rather than
        // inviting a tap that answers "sin traducción".
        /\S/.test(part) && translateToken(part) ? (
          <button
            className="ask-word"
            key={index}
            onClick={() => onWord(part)}
            title={`What does "${part}" mean?`}
          >
            {part}
          </button>
        ) : (
          part
        ),
      )}
    </>
  )
}

export function Exercise({
  word,
  nextIcon,
  direction,
  position,
  total,
  marked,
  onToggleMark,
  onContinue,
  onQuit,
}: {
  word: Word
  /** The illustration after this one, fetched while this one is being typed. */
  nextIcon?: string
  direction: Direction
  position: number
  total: number
  marked: boolean
  onToggleMark: () => void
  onContinue: (outcome: { usedHelp: boolean }) => void
  onQuit: () => void
}) {
  const task = useMemo(() => taskFor(word, direction), [word, direction])
  const [state, setState] = useState(() => createTypingState(task.answer, task.sentence))
  const [audioWorks, setAudioWorks] = useState(true)
  /** Set when the learner gives up on hearing it and asks to read it instead. */
  const [sentenceShown, setSentenceShown] = useState(false)
  /** The word the learner last asked the meaning of. */
  const [asked, setAsked] = useState<{ word: string; meaning: string } | null>(null)
  /** The longer answer, once it has been asked for. */
  const [more, setMore] = useState<{
    word: string
    meaning: string
    text: string
    state: 'offer' | 'downloading' | 'writing' | 'done' | 'failed'
    progress?: number
  } | null>(null)
  /**
   * Whether this machine can answer on its own. Read once, because asking is
   * slow and the answer cannot change mid-exercise.
   */
  const [localAi, setLocalAi] = useState<Availability>('unavailable')
  const catcher = useRef<HTMLInputElement>(null)
  const dictated = useRef(false)
  const chimed = useRef(false)
  /**
   * Shift on its own replays the line being written. It is tracked across
   * keydown and keyup because Shift is also held to type a capital — firing on
   * keydown would speak every time the learner wrote "The" or "I".
   */
  const shiftAlone = useRef(false)

  /**
   * A new word resets the exercise here rather than by remounting the whole
   * screen. Remounting destroyed the hidden input, and a phone closes its
   * keyboard when the field it was typing into disappears — refocusing a fresh
   * node does not bring it back without a tap.
   */
  const [shownWord, setShownWord] = useState(word.id)
  if (shownWord !== word.id) {
    setShownWord(word.id)
    setState(createTypingState(task.answer, task.sentence))
    setSentenceShown(false)
    setMore(null)
    setAsked(null)
    dictated.current = false
    chimed.current = false
  }


  /** What Shift replays: whichever line is being written. */
  const replayText =
    state.phase === 'sentence' && task.sentence ? task.sentence : task.speech

  /**
   * Only a press decides whether audio works. Autoplay policy can refuse a
   * speak that was not asked for, and treating that as a broken engine would
   * give away the sentence in browsers that are perfectly capable of reading it.
   */
  const speak = (text: string, rate?: number) => {
    void say(text, rate).then((outcome) => {
      if (outcome !== 'superseded') setAudioWorks(outcome === 'spoken')
    })
  }

  const speakUnprompted = (text: string, rate?: number) => {
    void say(text, rate)
  }

  // Physical keyboards are handled on window; this focus is what makes a
  // phone's on-screen keyboard appear.
  const focusCatcher = () => catcher.current?.focus({ preventScroll: true })
  useEffect(focusCatcher, [word])

  useEffect(() => setAsked(null), [word])

  // Mark the end of the exercise with a sound. Guarded, because React mounts
  // effects twice in development and one chime is plenty.
  useEffect(() => {
    if (state.phase !== 'done' || chimed.current) return
    chimed.current = true
    if (state.usedHelp) playHelped()
    else playSuccess()
  }, [state.phase, state.usedHelp])

  // Reading the sentence out the moment it becomes the task is the whole point
  // of dictation. The keystroke that finished the word is the gesture that
  // permits it.
  useEffect(() => {
    if (state.phase !== 'sentence' || dictated.current) return
    dictated.current = true
    speakUnprompted(task.sentence, 0.85)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Shift') {
        if (!event.repeat) shiftAlone.current = true
        return
      }
      // Any other key means Shift is being used as a modifier, not asked for.
      shiftAlone.current = false

      if (event.metaKey || event.ctrlKey || event.altKey) return

      if (event.key === 'Enter') {
        if (state.phase === 'done') {
          event.preventDefault()
          onContinue({ usedHelp: state.usedHelp })
        }
        return
      }

      if (event.key === 'Tab') {
        event.preventDefault()
        setState(state.phase === 'word' ? revealNext : revealWord)
        return
      }

      if ([...event.key].length !== 1) return
      event.preventDefault()
      setState((current) => {
        const next = keyPress(current, event.key)
        // Only a letter that landed makes a sound; a wrong key already shakes.
        if (!next.wrong && next !== current) playKey()
        return next
      })
    }

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key !== 'Shift' || !shiftAlone.current) return
      shiftAlone.current = false
      speak(replayText, state.phase === 'sentence' ? 0.85 : undefined)
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.usedHelp, onContinue, replayText])

  // A phone keyboard can cover the line being typed, so bring it back into
  // view whenever the exercise moves from the word to the sentence.
  useEffect(() => {
    if (state.phase !== 'sentence') return
    document
      .querySelector('.box.sentence')
      ?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [state.phase])

  // Clear the shake so the same wrong key can flash again.
  useEffect(() => {
    if (!state.wrong) return
    const timer = setTimeout(() => setState((current) => ({ ...current, wrong: false })), 240)
    return () => clearTimeout(timer)
  }, [state.wrong])

  const wordCursor = state.phase === 'word' ? cursorOf(state.word) : -1
  const sentenceCursor = state.phase === 'sentence' ? cursorOf(state.sentence) : -1

  // Fetched a whole exercise early, so the next illustration is already in the
  // cache by the time it is asked for.
  useEffect(() => {
    if (nextIcon) preloadIcon(nextIcon)
  }, [nextIcon])

  useEffect(() => {
    let alive = true
    void localAvailability().then((availability) => {
      if (alive) setLocalAi(availability)
    })
    return () => {
      alive = false
    }
  }, [])

  /**
   * The machine's own model when it has one, and Google when it does not —
   * which is every phone. Opening the tab is the click itself, never a later
   * callback, or the browser takes it for a pop-up.
   */
  const done = state.phase === 'done'

  /**
   * Only an English word we know is worth asking about by itself. Writing
   * English to Spanish the box holds Spanish, and a Spanish word has no
   * translation here — then the entry being learnt is the thing to explain.
   */
  const moreAbout = !asked
    ? null
    : asked.meaning !== UNTRANSLATED
      ? asked
      : // The entry itself is the English word here — only offer it once it has
        // been written, or the link would hand over the answer.
        done
        ? { word: word.word, meaning: word.translation }
        : null

  /** Answers in the page, from the model on this machine. */
  const answerHere = () => {
    const target = moreAbout
    if (!target) return

    setMore({ ...target, text: '', state: 'writing' })
    void explainLocally(
      target.word,
      target.meaning,
      (text) => setMore({ ...target, text, state: 'writing' }),
      (progress) =>
        setMore((current) =>
          current && !current.text ? { ...current, state: 'downloading', progress } : current,
        ),
    )
      .then(() => {
        setLocalAi('available')
        setMore((current) => (current ? { ...current, state: 'done' } : current))
      })
      .catch(() => setMore({ ...target, text: '', state: 'failed' }))
  }

  const askMeaning = (tapped: string) => {
    // The tapped chunk carries its punctuation; neither the label nor the voice
    // should.
    const clean = tapped.replace(/^[^\p{Letter}\p{Number}]+|[^\p{Letter}\p{Number}]+$/gu, '')
    const word = clean || tapped
    setAsked({ word, meaning: translateToken(tapped) ?? UNTRANSLATED })
    setMore(null)
    // Spoken from inside the tap, so the gesture still counts and the word is
    // heard as well as read.
    speak(word)
  }

  const onSentence = state.phase === 'sentence'
  /** How many of a verb's parts are already written, to mark the current one. */
  const filledParts = task.threeForms
    ? state.word.filter((slot) => slot.filled && slot.char === ' ').length
    : 0
  const progress = ((position - (done ? 0 : 1)) / total) * 100
  const askingFor = direction === 'es-en' ? 'English' : 'Spanish'
  const instruction = task.threeForms
    ? 'Write all three forms in English'
    : `Write it in ${askingFor}`
  // Dictation only works if the browser actually speaks; otherwise it has to be
  // something to read.
  const showSentenceText = sentenceShown || !audioWorks || done

  return (
    <div className="app locked">
      <div className="shell topbar">
        <button className="iconbtn" onClick={onQuit} aria-label="Back to chapters">
          <BackGlyph />
        </button>
        <div className="track" role="progressbar" aria-valuenow={position} aria-valuemin={1} aria-valuemax={total}>
          <i style={{ width: `${progress}%` }} />
        </div>
        <span className="count">
          {position} / {total}
        </span>
      </div>

      <div className="shell stage" onPointerDown={focusCatcher}>
        <Icon name={word.icon} className="cue" priority />

        <div className="prompt">
          <p className="ask">{instruction}</p>
          <p className={`given ${task.promptLanguage}`} lang={task.promptLanguage}>
            {/* Tappable only when the prompt is the English side: the Spanish
                one has nothing to look up, and the English answer is not on
                screen yet. */}
            {task.promptLanguage === 'en' ? (
              <AskableWords text={task.prompt} onWord={askMeaning} />
            ) : (
              task.prompt
            )}
          </p>
          {task.meaning && (
            <p className="gloss">
              <AskableWords text={task.meaning} onWord={askMeaning} />
            </p>
          )}
        </div>

        <div className="answer-row">
          <button
            className="side"
            onClick={() => speak(task.speech)}
            title="Listen — Shift"
            aria-label={`Listen to ${task.speech}, shortcut Shift`}
          >
            <SpeakerGlyph />
          </button>

          <div className={`box word ${state.wrong && state.phase === 'word' ? 'shake' : ''}`}>
            <TypedLine
              slots={state.word}
              size="lg"
              cursor={wordCursor}
              onWord={state.phase === 'word' ? undefined : askMeaning}
            />
            {task.threeForms && (
              <ol className="parts" aria-label="The three parts to write">
                {task.formLabels.map((label, index) => (
                  <li key={label} className={index === filledParts ? 'now' : ''}>
                    {label}
                  </li>
                ))}
              </ol>
            )}
          </div>

          <button
            className={`side ${marked ? 'on' : ''}`}
            onClick={onToggleMark}
            aria-pressed={marked}
            aria-label={marked ? 'Remove from marked words' : 'Add to marked words'}
          >
            <StarGlyph filled={marked} />
          </button>
        </div>

        {task.sentence && (
          <div className="sentence-step">
            <p className="ask">{onSentence ? 'Type what you hear' : 'Then a sentence, by ear'}</p>

            <button className="play" onClick={() => speak(task.sentence, 0.85)}>
              <SpeakerGlyph size={16} />
              Play the sentence
              <kbd>Shift</kbd>
            </button>

            {showSentenceText && (
              <p className="model" lang="en">
                {task.sentence}
              </p>
            )}

            <div className={`box sentence ${state.wrong && onSentence ? 'shake' : ''}`}>
              <TypedLine
                slots={state.sentence}
                size="sm"
                cursor={sentenceCursor}
                onWord={done ? askMeaning : undefined}
              />
            </div>

            {done && <p className="sentence-es">{sentenceEs(word.id)}</p>}
          </div>
        )}

        {!done && (
          <div className="hints">
            {onSentence ? (
              <>
                <button className="hint" onClick={() => setState(revealWord)}>
                  <EyeGlyph />
                  Show a word
                  <kbd>Tab</kbd>
                </button>
                {!showSentenceText && (
                  <button className="hint" onClick={() => setSentenceShown(true)}>
                    <EyeGlyph />
                    Show the sentence
                  </button>
                )}
                <button className="hint" onClick={() => setState(revealRest)}>
                  <EyeGlyph />
                  Fill it in
                </button>
              </>
            ) : (
              <button className="hint" onClick={() => setState(revealNext)}>
                <EyeGlyph />
                Show a letter
                <kbd>Tab</kbd>
              </button>
            )}
          </div>
        )}

        {/* From the start, not only at the end: a word you cannot place is worth
            asking about while you are still stuck on it. */}
        {(done || asked) && (
          <p className="tap-hint">
            {asked ? (
              <>
                <button
                  className="say-word"
                  onClick={() => speak(asked.word)}
                  aria-label={`Listen to ${asked.word} again`}
                >
                  <SpeakerGlyph size={14} />
                </button>
                <b>{asked.word}</b> — {asked.meaning}
                {/* A real link where the answer is elsewhere: a pop-up opened
                    from script is blocked often enough, and a link can also be
                    held to open in the background. */}
                {moreAbout &&
                  (localAi === 'available' ? (
                    <button className="know-more" onClick={answerHere}>
                      I want to know more
                    </button>
                  ) : (
                    <>
                      <a
                        className="know-more"
                        href={searchUrl(moreAbout.word, moreAbout.meaning)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        I want to know more
                      </a>
                      {(localAi === 'downloadable' || localAi === 'downloading') && (
                        <button
                          className="know-more quiet"
                          onClick={() => setMore({ ...moreAbout, text: '', state: 'offer' })}
                        >
                          without leaving
                        </button>
                      )}
                    </>
                  ))}
              </>
            ) : (
              'Tap any word to hear it and see what it means'
            )}
          </p>
        )}

        {more && (
          <div className="explain">
            <button className="explain-close" onClick={() => setMore(null)} aria-label="Close">
              ✕
            </button>
            {more.state === 'offer' ? (
              <>
                <p>
                  Chrome puede responder aquí mismo, sin conexión y sin salir de la app. Para eso
                  tiene que descargar su modelo una sola vez, y son varios gigas.
                </p>
                <button className="know-more" onClick={answerHere}>
                  Descargar y responder
                </button>
              </>
            ) : more.state === 'downloading' ? (
              <p className="waiting">
                Descargando el modelo… {Math.round((more.progress ?? 0) * 100)}%
              </p>
            ) : more.state === 'failed' ? (
              <p>
                No pude responder aquí.{' '}
                <a href={searchUrl(more.word, more.meaning)} target="_blank" rel="noreferrer">
                  Búscalo en Google
                </a>
                .
              </p>
            ) : more.text ? (
              more.text.split('\n').filter(Boolean).map((line, index) => <p key={index}>{line}</p>)
            ) : (
              <p className="waiting">Pensando…</p>
            )}
          </div>
        )}

        {!audioWorks && (
          <div className="audio-help">
            <p className="notice">{speechProblem()}</p>
            <details>
              <summary>How to turn it on</summary>
              <ol>
                {speechSteps().map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </details>
            <button
              className="hint"
              onClick={() => {
                // A retry is the only way to find out whether the setting took.
                setAudioWorks(true)
                speak(task.sentence || task.speech, 0.85)
              }}
            >
              <SpeakerGlyph size={15} />
              Try the sound again
            </button>
          </div>
        )}

        <input
          ref={catcher}
          className="typing-catcher"
          aria-label={`Type the answer in ${askingFor}`}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          onChange={(event) => {
            // Virtual keyboards often report key as "Unidentified", so the
            // characters they insert here are the only signal we get.
            for (const char of event.target.value) setState((current) => keyPress(current, char))
            event.target.value = ''
          }}
        />
      </div>

      <div className="footer">
        <div className="shell">
          {done ? (
            state.usedHelp ? (
              <span className="verdict help">You will see this one again</span>
            ) : (
              <span className="verdict ok">
                <CheckGlyph /> Correct!
              </span>
            )
          ) : (
            <span />
          )}
          <button
            className={`cta ${done ? 'ready' : ''}`}
            disabled={!done}
            onClick={() => onContinue({ usedHelp: state.usedHelp })}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}
