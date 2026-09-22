import { useCallback, useMemo, useState } from 'react'
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
import { deckOrder, shuffle } from './engine/deck'
import { Home, type Deck } from './screens/Home'
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
  | { name: 'exercise'; title: string; words: Word[]; index: number; helped: number; run: number }
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

  const goHome = useCallback(() => {
    setNow(Date.now())
    setView({ name: 'home' })
  }, [])

  const chooseDirection = useCallback((next: Direction) => {
    saveDirection(next)
    setDirection(next)
  }, [])

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
  const start = useCallback(async (deck: Deck) => {
    if (deck.wordIds.length === 0) return
    setHomeScroll(window.scrollY)
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
  }, [])

  if (view.name === 'loading') {
    return (
      <div className="app centred">
        <p className="waiting">Loading…</p>
      </div>
    )
  }

  if (view.name === 'failed') {
    return (
      <div className="app centred">
        <p className="waiting">That chapter could not be loaded. Check your connection.</p>
        <button className="btn ghost" onClick={goHome}>
          All chapters
        </button>
      </div>
    )
  }

  if (view.name === 'home') {
    return (
      <Home
        progress={progress}
        decks={decks}
        direction={direction}
        onChooseDirection={chooseDirection}
        onStart={(deck) => void start(deck)}
        restoreScroll={homeScroll}
      />
    )
  }

  if (view.name === 'exercise') {
    const word = view.words[view.index]

    return (
      <Exercise
        // Keyed by the run, not the word: changing word must not remount this
        // screen, or a phone closes the keyboard between every exercise.
        key={`${view.run}-${direction}`}
        word={word}
        direction={direction}
        position={view.index + 1}
        total={view.words.length}
        marked={isMarked(progress, word.id)}
        onToggleMark={() => update(toggleMark(progress, word.id))}
        onQuit={goHome}
        onContinue={({ usedHelp }) => {
          update(recordAnswer(progress, word.id, { usedHelp }, Date.now()))
          const helped = view.helped + (usedHelp ? 1 : 0)
          const next = view.index + 1
          setView(
            next < view.words.length
              ? { ...view, index: next, helped }
              : { name: 'results', title: view.title, words: view.words, helped },
          )
        }}
      />
    )
  }

  return (
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
  )
}
