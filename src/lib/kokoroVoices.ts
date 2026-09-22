/**
 * Kokoro ships 28 voices, most of them poorly trained. These are the three
 * worth offering, picked by the model author's own grade: two women and a man.
 *
 * The grade is that rating. Heart and Bella are the only two the author marks
 * in the A range; no male voice scores above C+, and Michael is one of the
 * three that reach it.
 */
export type KokoroVoice = {
  id: string
  name: string
  accent: 'American' | 'British'
  gender: 'Female' | 'Male'
  grade: string
}

export const KOKORO_VOICES: KokoroVoice[] = [
  { id: 'af_heart', name: 'Heart', accent: 'American', gender: 'Female', grade: 'A' },
  { id: 'af_bella', name: 'Bella', accent: 'American', gender: 'Female', grade: 'A-' },
  { id: 'am_michael', name: 'Michael', accent: 'American', gender: 'Male', grade: 'C+' },
]

/** The best-rated voice, and so the one to start with. */
export const DEFAULT_VOICE = 'af_heart'

/** The line every voice is tried on, so two of them can be compared. */
export const VOICE_SAMPLE = 'She took up the guitar last year.'
