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

/** One flat note: finished, but the answer was given away. */
const HELPED: Note[] = [{ hz: 392.0, at: 0, for: 0.18 }]

let context: AudioContext | null = null

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

/** Answered without giving up. */
export const playSuccess = (): void => play(SUCCESS, 0.14)

/** Finished, but the answer was revealed along the way. */
export const playHelped = (): void => play(HELPED, 0.08)
