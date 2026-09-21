import { useCallback, useMemo, useState } from 'react'
import { ALL_WORDS, WORDS_BY_ID, type Word } from './data'
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

type View =
  | { name: 'home' }
  | { name: 'exercise'; deck: Deck; index: number; helped: number }
  | { name: 'results'; deck: Deck; helped: number }

const shuffle = <T,>(items: T[]): T[] => {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export default function App() {
  const [progress, setProgress] = useState<Progress>(() => loadProgress(window.localStorage))
  const [direction, setDirection] = useState<Direction>(() => loadDirection())
  const [view, setView] = useState<View>({ name: 'home' })
  // Captured rather than read during render, so the decks stay stable between
  // renders. Returning home takes a fresh reading.
  const [now, setNow] = useState(() => Date.now())

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

  const decks = useMemo(() => {
    const due = dueWords(progress.reviews, now)
      .map((id) => WORDS_BY_ID.get(id))
      .filter((word): word is Word => Boolean(word))

    return {
      review: { title: 'Review', words: due.slice(0, 10) },
      marked: {
        title: 'Marked words',
        words: progress.marked
          .map((id) => WORDS_BY_ID.get(id))
          .filter((word): word is Word => Boolean(word)),
      },
      random: { title: 'Random words', words: shuffle(ALL_WORDS).slice(0, 10) },
      all: { title: 'All words', words: ALL_WORDS },
    }
  }, [progress, now])

  const start = (deck: Deck) => {
    if (deck.words.length === 0) return
    setView({ name: 'exercise', deck, index: 0, helped: 0 })
  }

  if (view.name === 'home') {
    return (
      <Home
        progress={progress}
        decks={decks}
        direction={direction}
        onChooseDirection={chooseDirection}
        onStart={start}
      />
    )
  }

  if (view.name === 'exercise') {
    const word = view.deck.words[view.index]

    return (
      <Exercise
        key={`${view.deck.title}-${view.index}-${direction}`}
        word={word}
        direction={direction}
        position={view.index + 1}
        total={view.deck.words.length}
        marked={isMarked(progress, word.id)}
        onToggleMark={() => update(toggleMark(progress, word.id))}
        onQuit={goHome}
        onContinue={({ usedHelp }) => {
          update(recordAnswer(progress, word.id, { usedHelp }, Date.now()))
          const helped = view.helped + (usedHelp ? 1 : 0)
          const next = view.index + 1
          setView(
            next < view.deck.words.length
              ? { ...view, index: next, helped }
              : { name: 'results', deck: view.deck, helped },
          )
        }}
      />
    )
  }

  return (
    <Results
      words={view.deck.words}
      direction={direction}
      withoutHelp={view.deck.words.length - view.helped}
      onRetry={() => setView({ name: 'exercise', deck: view.deck, index: 0, helped: 0 })}
      onHome={goHome}
    />
  )
}
