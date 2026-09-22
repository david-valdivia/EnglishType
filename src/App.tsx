import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Word } from './data/types'
import { CHAPTER_INDEX } from './data/manifest'
import { loadExerciseText, loadWords } from './data/load'
import { dueWords } from './engine/srs'
import {
  loadProgress,
  recordAnswer,
  saveProgress,
  toggleMark,
  isMarked,
  type Progress,
} from './store/progress'
import { DIRECTIONS, type Direction } from './engine/task'
import {
  hasChosenVoice,
  loadVoiceSettings,
  markVoiceChosen,
  saveVoiceSettings,
  type VoiceSettings,
} from './store/voice'
import { useVoiceSettings } from './lib/speech'
import { kokoroPossible, loadKokoro, preferredDevice } from './lib/kokoro'
import { track } from './lib/analytics'
import { deckOrder, shuffle } from './engine/deck'
import { Home, type Deck } from './screens/Home'
import { Settings } from './screens/Settings'
import { Onboarding } from './screens/Onboarding'
import { Exercise } from './screens/Exercise'
import { Results } from './screens/Results'

const DIRECTION_KEY = 'englishtype:direction:v1'

const loadDirection = (): Direction => {
  try {
    const saved = window.localStorage.getItem(DIRECTION_KEY)
    return DIRECTIONS.some((d) => d.id === saved) ? (saved as Direction) : 'es-en'
  } catch {
    return 'es-en'
  }
}

const saveDirection = (direction: Direction): void => {
  try {
    window.localStorage.setItem(DIRECTION_KEY, direction)
  } catch {
    // Private browsing: the choice just will not persist.
  }
}

const ALL_IDS = CHAPTER_INDEX.flatMap((chapter) => chapter.wordIds)

type View =
  | { name: 'home' }
  | { name: 'loading' }
  | { name: 'failed' }
  | {
      name: 'exercise'
      title: string
      words: Word[]
      index: number
      helped: number
      run: number
    }
  | { name: 'results'; title: string; words: Word[]; helped: number }

export default function App() {
  const [progress, setProgress] = useState<Progress>(() => loadProgress(window.localStorage))
  const [direction, setDirection] = useState<Direction>(() => loadDirection())
  const [view, setView] = useState<View>({ name: 'home' })
  // Captured rather than read during render, so the decks stay stable between
  // renders. Returning home takes a fresh reading.
  const [now, setNow] = useState(() => Date.now())
  // Where the chapter list stood when the current run was started.
  const [homeScroll, setHomeScroll] = useState(0)
  const [voice, setVoice] = useState<VoiceSettings>(() =>
    loadVoiceSettings(window.localStorage, preferredDevice()),
  )
  const [settingsOpen, setSettingsOpen] = useState(false)
  // Asked once. Until it is answered there is no point starting a chapter:
  // every exercise reads itself aloud.
  const [asking, setAsking] = useState(() => !hasChosenVoice(window.localStorage))
  /** Set as the question closes, to show where the answer can be changed. */
  const [pointAtVoices, setPointAtVoices] = useState(false)

  // The speech layer is not a component, so it is told rather than passed.
  useVoiceSettings(voice)

  // Already downloaded and chosen: warm it up now, quietly, so the first tap
  // is answered by the voice that was asked for rather than the fallback.
  useEffect(() => {
    if (voice.engine === 'kokoro' && kokoroPossible()) {
      // A failure here is not worth a message: the system voice answers the
      // next tap, which is what the learner actually notices.
      loadKokoro(voice.device).catch(() => {})
    }
  }, [voice.engine, voice.device])

  const chooseVoice = useCallback((next: VoiceSettings) => {
    saveVoiceSettings(window.localStorage, next)
    setVoice(next)
  }, [])

  const goHome = useCallback(() => {
    setNow(Date.now())
    setView({ name: 'home' })
  }, [])

  const chooseDirection = useCallback(
    (next: Direction) => {
      saveDirection(next)
      setDirection(next)
      // Only a real change; tapping the side you are already on is not news.
      if (next !== direction) track('direction_change', { direction: next })
    },
    [direction],
  )

  const update = useCallback((next: Progress) => {
    saveProgress(window.localStorage, next)
    setProgress(next)
  }, [])

  const decks = useMemo(
    () => ({
      review: {
        title: 'Review',
        wordIds: dueWords(progress.reviews, now).slice(0, 10),
        keepOrder: true,
      },
      marked: { title: 'Marked words', wordIds: progress.marked },
      random: { title: 'Random words', wordIds: shuffle(ALL_IDS).slice(0, 10) },
      all: { title: 'All words', wordIds: ALL_IDS },
    }),
    [progress, now],
  )

  /** Fetches a deck's words, and the text an exercise needs, before starting. */
  const start = useCallback(
    async (deck: Deck) => {
      if (deck.wordIds.length === 0) return
      setHomeScroll(window.scrollY)
      track('deck_start', {
        deck: deck.title,
        direction,
        words: deck.wordIds.length,
      })
      setView({ name: 'loading' })
      try {
        const [words] = await Promise.all([loadWords(deck.wordIds), loadExerciseText()])
        if (words.length === 0) return setView({ name: 'failed' })
        setView({
          name: 'exercise',
          title: deck.title,
          words: deckOrder(words, deck.keepOrder ?? false),
          index: 0,
          helped: 0,
          run: Date.now(),
        })
      } catch {
        setView({ name: 'failed' })
      }
    },
    [direction],
  )

  const panel = asking ? (
    <Onboarding
      settings={voice}
      onChange={chooseVoice}
      onFinish={() => {
        markVoiceChosen(window.localStorage)
        setAsking(false)
        setPointAtVoices(true)
        window.setTimeout(() => setPointAtVoices(false), 6000)
      }}
    />
  ) : (
    settingsOpen && (
      <Settings settings={voice} onChange={chooseVoice} onClose={() => setSettingsOpen(false)} />
    )
  )

  if (view.name === 'failed') {
    return (
      <>
        <div className="app centred">
          <p className="waiting">That chapter could not be loaded. Check your connection.</p>
          <button className="btn ghost" onClick={goHome}>
            All chapters
          </button>
        </div>
        {panel}
      </>
    )
  }

  // The chapter list stays where it was while its words are fetched, with the
  // waiting laid over it. Replacing the screen with the word "Loading" threw
  // away everything the learner was looking at to say less than nothing.
  if (view.name === 'home' || view.name === 'loading') {
    return (
      <>
        <Home
          progress={progress}
          decks={decks}
          direction={direction}
          onChooseDirection={chooseDirection}
          onStart={(deck) => void start(deck)}
          onOpenVoices={() => {
            setPointAtVoices(false)
            setSettingsOpen(true)
          }}
          pointAtVoices={pointAtVoices}
          restoreScroll={homeScroll}
        />
        {panel}
        {view.name === 'loading' && (
          <div className="overlay" role="status" aria-live="polite">
            <div className="overlay-card">
              <span className="spinner" aria-hidden />
              <p>Getting the words ready…</p>
            </div>
          </div>
        )}
      </>
    )
  }

  if (view.name === 'exercise') {
    const word = view.words[view.index]

    return (
      <>
        <Exercise
          // Keyed by the run, not the word: changing word must not remount this
          // screen, or a phone closes the keyboard between every exercise.
          key={`${view.run}-${direction}`}
          word={word}
          nextIcon={view.words[view.index + 1]?.icon}
          direction={direction}
          position={view.index + 1}
          total={view.words.length}
          marked={isMarked(progress, word.id)}
          onToggleMark={() => update(toggleMark(progress, word.id))}
          onQuit={goHome}
          onOpenVoices={() => setSettingsOpen(true)}
          onContinue={({ usedHelp }) => {
            update(recordAnswer(progress, word.id, { usedHelp }, Date.now()))
            const helped = view.helped + (usedHelp ? 1 : 0)
            const next = view.index + 1
            if (next < view.words.length) return setView({ ...view, index: next, helped })

            track('deck_finish', {
              deck: view.title,
              direction,
              words: view.words.length,
              without_help: view.words.length - helped,
            })
            setView({
              name: 'results',
              title: view.title,
              words: view.words,
              helped,
            })
          }}
        />
        {panel}
      </>
    )
  }

  return (
    <>
      <Results
        words={view.words}
        direction={direction}
        withoutHelp={view.words.length - view.helped}
        onRetry={() =>
          setView({
            name: 'exercise',
            title: view.title,
            words: shuffle(view.words),
            index: 0,
            helped: 0,
            run: Date.now(),
          })
        }
        onHome={goHome}
      />
      {panel}
    </>
  )
}
