/**
 * The short sound that marks the end of an exercise.
 *
 * Synthesised rather than loaded, so there is no audio file to ship and nothing
 * to fail on a slow connection. It also sidesteps speech synthesis entirely:
 * Web Audio works in browsers where `speechSynthesis` silently does not.
 */

type Note = { hz: number; at: number; for: number }

/** A rising major triad — the ordinary "that was right" shape. */
const SUCCESS: Note[] = [
  { hz: 587.33, at: 0, for: 0.12 }, // D5
  { hz: 739.99, at: 0.09, for: 0.12 }, // F#5
  { hz: 880.0, at: 0.18, for: 0.22 }, // A5
]

/**
 * Finished, but with help. Still a rise, just a smaller one: revealing a single
 * letter of a long sentence should not be answered with a sound that reads as
 * failure.
 */
const HELPED: Note[] = [
  { hz: 493.88, at: 0, for: 0.12 }, // B4
  { hz: 587.33, at: 0.08, for: 0.18 }, // D5
]

/**
 * The end of a whole chapter. A run up the same triad and then the octave held
 * underneath it, so it is recognisably the little chime's big brother rather
 * than an unrelated noise.
 */
const VICTORY: Note[] = [
  { hz: 587.33, at: 0, for: 0.14 }, // D5
  { hz: 739.99, at: 0.1, for: 0.14 }, // F#5
  { hz: 880.0, at: 0.2, for: 0.14 }, // A5
  { hz: 1174.66, at: 0.3, for: 0.5 }, // D6
  { hz: 880.0, at: 0.32, for: 0.5 }, // A5 held under it
  { hz: 587.33, at: 0.34, for: 0.5 }, // D5 held under it
]

let context: AudioContext | null = null
/** One short burst of noise, reused for every keystroke. */
let noise: AudioBuffer | null = null

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor = window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null

  context ??= new Ctor()
  // Browsers start the context suspended until a gesture; a keystroke finished
  // the exercise, so this resume is allowed.
  if (context.state === 'suspended') void context.resume()
  return context
}

function play(notes: Note[], volume: number): void {
  const ctx = audio()
  if (!ctx) return

  const start = ctx.currentTime + 0.01
  for (const note of notes) {
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()

    oscillator.type = 'sine'
    oscillator.frequency.value = note.hz

    // A quick swell and a slow fade, so it reads as a chime and not a beep.
    const from = start + note.at
    const to = from + note.for
    gain.gain.setValueAtTime(0, from)
    gain.gain.linearRampToValueAtTime(volume, from + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, to)

    oscillator.connect(gain)
    gain.connect(ctx.destination)
    oscillator.start(from)
    oscillator.stop(to + 0.02)
  }
}

/**
 * The click of a key striking paper.
 *
 * A typewriter is mostly noise, not a tone, so this is a short burst of it
 * through a narrow filter. The pitch moves a little each time, because a run of
 * identical clicks sounds like a machine rather than a machine being used.
 *
 * It fires on every correct letter, so it has to be cheap: the noise is
 * generated once and replayed.
 */
export function playKey(): void {
  const ctx = audio()
  if (!ctx) return

  if (!noise) {
    const frames = Math.floor(ctx.sampleRate * 0.03)
    noise = ctx.createBuffer(1, frames, ctx.sampleRate)
    const data = noise.getChannelData(0)
    for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1
  }

  const source = ctx.createBufferSource()
  source.buffer = noise

  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = 2200 + Math.random() * 900
  filter.Q.value = 1.4

  const gain = ctx.createGain()
  const start = ctx.currentTime
  gain.gain.setValueAtTime(0.06, start)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.028)

  source.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)
  source.start(start)
  source.stop(start + 0.03)
}

/** Answered without giving up. */
export const playSuccess = (): void => play(SUCCESS, 0.14)

/** Finished, but the answer was revealed along the way. */
export const playHelped = (): void => play(HELPED, 0.1)

/** A whole chapter finished. */
export const playVictory = (): void => play(VICTORY, 0.12)
