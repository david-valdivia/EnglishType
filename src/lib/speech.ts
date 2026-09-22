/**
 * Reads text aloud in English.
 *
 * The one rule that matters: `speak()` must be called synchronously inside the
 * user gesture that asked for it. Awaiting anything first — even a resolved
 * promise — lets the browser's user activation lapse and the request is
 * silently dropped. So the voice list is kept warm in the background and never
 * awaited at call time.
 *
 * `getVoices()` is also empty until the browser loads the list asynchronously,
 * and an utterance with no voice can be accepted and never start, so the list is
 * refreshed eagerly and on every `voiceschanged`.
 */

import { kokoroReady, speakKokoro, stopKokoro } from './kokoro'
import { DEFAULT_SETTINGS, type VoiceSettings } from '../store/voice'

let voices: SpeechSynthesisVoice[] = []

/**
 * Brave blocks the Web Speech API under its fingerprinting shield — the voice
 * list reveals which languages are installed — so it reports zero voices and
 * never speaks. Knowing that lets us give the one instruction that fixes it
 * instead of a dead end.
 */
let isBrave = false
const brave = (navigator as Navigator & { brave?: { isBrave(): Promise<boolean> } }).brave
void brave
  ?.isBrave()
  .then((yes) => {
    isBrave = yes
    for (const listener of listeners) listener()
  })
  .catch(() => {})

const synth = (): SpeechSynthesis | undefined =>
  typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : undefined

const listeners = new Set<() => void>()

function refreshVoices(): void {
  voices = synth()?.getVoices() ?? []
  for (const listener of listeners) listener()
}

/** Notifies when what we know about the speech engine changes. */
export function onSpeechChange(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** False until the voice list has had a fair chance to arrive. */
let settled = false

const speech = synth()
if (speech) {
  refreshVoices()
  speech.addEventListener('voiceschanged', refreshVoices)
  setTimeout(() => {
    settled = true
    for (const listener of listeners) listener()
  }, 1200)
} else {
  settled = true
}

const pickVoice = (): SpeechSynthesisVoice | undefined =>
  voices.find((voice) => voice.lang === 'en-US' && voice.default) ??
  voices.find((voice) => voice.lang === 'en-US') ??
  voices.find((voice) => voice.lang.startsWith('en'))

/**
 * 'spoken' once the browser starts reading, 'superseded' when a newer request
 * replaced this one, 'unavailable' when the engine is missing or never starts.
 *
 * Some embedded browsers expose the whole API and a full voice list, accept the
 * call, and never play anything. Reporting that back is what lets the interface
 * fall back instead of pretending the button works.
 */
export type SpeechOutcome = 'spoken' | 'superseded' | 'unavailable'

/**
 * How long to wait for speech to begin before calling the engine dead.
 * Generous on purpose: a browser that is merely slow to warm up its voice
 * must not be mistaken for one that cannot speak, because that verdict gives
 * the dictation away.
 */
const START_TIMEOUT = 3500

/**
 * Whether this browser is expected to read the dictation aloud.
 *
 * 'unknown' covers the moment before the voice list has arrived — it is
 * asynchronous — so the interface can stay quiet rather than flash a warning at
 * a browser that turns out to be fine.
 */
export function speechOutlook(): 'good' | 'blocked' | 'unknown' {
  if (isBrave) return 'blocked'
  if (voices.length) return 'good'
  return settled ? 'blocked' : 'unknown'
}

/**
 * The steps that actually fix it, for the browser we are on.
 *
 * A page cannot lower Brave's shield itself — there is deliberately no API for
 * that — so the most useful thing is to say exactly where the setting lives.
 */
export function speechSteps(): string[] {
  if (isBrave) {
    return [
      'Click the lion icon in the address bar.',
      'Set "Block fingerprinting" to Standard, or turn it off for this site.',
      'Reload the page.',
    ]
  }
  if (!voices.length) {
    return [
      'Check that your system has at least one English voice installed.',
      'On macOS: System Settings, Accessibility, Spoken Content, System Voice.',
    ]
  }
  return ['Try a different browser — Chrome and Safari both read this aloud.']
}

/** What to tell the learner when speech will not play, as specifically as we can. */
export function speechProblem(): string {
  if (isBrave) {
    return 'Brave blocks speech as a fingerprinting defence. Lower Shields for this site to hear the dictation.'
  }
  if (!voices.length) {
    return 'This browser offers no speech voices, so the sentence is written out instead.'
  }
  return 'This browser accepts the request to speak but never plays it, so the sentence is written out instead.'
}

/**
 * Which voice to use. Set from the settings, and consulted on every line
 * spoken — a change takes effect on the next word, not the next reload.
 */
let preference: VoiceSettings = DEFAULT_SETTINGS

/**
 * Whether a line is being turned into sound right now.
 *
 * The system voice answers instantly, but a model on the machine takes a
 * second or two, and in that silence it is natural to press again. Every press
 * used to add another line to the queue, and they all came out one after
 * another. So while one is being made, the next is refused rather than stacked
 * — and the buttons say why.
 */
let busy = false
const busyWatchers = new Set<() => void>()

export const speechBusy = (): boolean => busy

export function onSpeechBusyChange(listener: () => void): () => void {
  busyWatchers.add(listener)
  return () => busyWatchers.delete(listener)
}

function setBusy(next: boolean): void {
  if (busy === next) return
  busy = next
  for (const watcher of busyWatchers) watcher()
}

export function useVoiceSettings(settings: VoiceSettings): void {
  preference = settings
}

export function say(text: string, rate = 0.9): Promise<SpeechOutcome> {
  if (!text) return Promise.resolve('unavailable')

  // Only when the model is already in memory. It is loaded in the background
  // at startup, so this is the normal case — but a tap must never be answered
  // with a download.
  if (preference.engine === 'kokoro' && kokoroReady()) {
    if (busy) return Promise.resolve('superseded')
    synth()?.cancel()
    setBusy(true)
    return speakKokoro(text, preference.voice, preference.device)
      .then(
        () => 'spoken' as const,
        // A voice that fails mid-sentence is still better than silence.
        () => systemSay(text, rate),
      )
      .finally(() => setBusy(false))
  }

  stopKokoro()
  return systemSay(text, rate)
}

function systemSay(text: string, rate: number): Promise<SpeechOutcome> {
  const speech = synth()
  if (!speech || !text) return Promise.resolve('unavailable')

  if (!voices.length) refreshVoices()

  // Cancelling an idle queue is a known way to wedge Chromium, so only do it
  // when there is actually something to stop. Still synchronous either way.
  if (speech.speaking || speech.pending) speech.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-US'
  utterance.rate = rate
  const voice = pickVoice()
  if (voice) utterance.voice = voice

  const started = new Promise<SpeechOutcome>((resolve) => {
    utterance.addEventListener('start', () => resolve('spoken'), { once: true })
    utterance.addEventListener(
      'error',
      (event) => {
        const interrupted = event.error === 'canceled' || event.error === 'interrupted'
        resolve(interrupted ? 'superseded' : 'unavailable')
      },
      { once: true },
    )
    setTimeout(() => resolve('unavailable'), START_TIMEOUT)
  })

  speech.speak(utterance)
  // Chromium sometimes leaves the queue paused after a cancel.
  if (speech.paused) speech.resume()

  return started
}
