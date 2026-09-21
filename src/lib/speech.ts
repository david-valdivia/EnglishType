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

let voices: SpeechSynthesisVoice[] = []

/**
 * Brave blocks the Web Speech API under its fingerprinting shield — the voice
 * list reveals which languages are installed — so it reports zero voices and
 * never speaks. Knowing that lets us give the one instruction that fixes it
 * instead of a dead end.
 */
let isBrave = false
const brave = (navigator as Navigator & { brave?: { isBrave(): Promise<boolean> } }).brave
void brave?.isBrave().then((yes) => {
  isBrave = yes
}).catch(() => {})

const synth = (): SpeechSynthesis | undefined =>
  typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : undefined

function refreshVoices(): void {
  voices = synth()?.getVoices() ?? []
}

const speech = synth()
if (speech) {
  refreshVoices()
  speech.addEventListener('voiceschanged', refreshVoices)
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

export function say(text: string, rate = 0.9): Promise<SpeechOutcome> {
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
