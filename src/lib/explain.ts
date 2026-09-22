/**
 * "Quiero saber más": the longer answer about a word.
 *
 * Chrome and Edge ship a model on the machine itself, reachable without a key
 * and without a network — but only on the desktop, and only after a download
 * of several gigabytes that the learner has to agree to. Everywhere else, and
 * that includes every iPhone, the question is handed to Google instead.
 */

type Availability = 'unavailable' | 'downloadable' | 'downloading' | 'available'

type Session = {
  promptStreaming: (input: string) => AsyncIterable<string>
  destroy: () => void
}

type Monitor = { addEventListener: (event: 'downloadprogress', fn: (e: { loaded: number }) => void) => void }

type LanguageModelApi = {
  availability: () => Promise<Availability>
  create: (options?: {
    initialPrompts?: { role: 'system'; content: string }[]
    monitor?: (monitor: Monitor) => void
  }) => Promise<Session>
}

const model = (): LanguageModelApi | undefined =>
  (globalThis as { LanguageModel?: LanguageModelApi }).LanguageModel

const TEACHER =
  'Eres un profesor de inglés para hispanohablantes. Respondes en español, ' +
  'en frases cortas, sin rodeos y sin repetir la pregunta.'

/** The same question either way, so the two answers are comparable. */
export const question = (word: string, meaning: string): string =>
  `Explícame la palabra o expresión inglesa "${word}" (en español: ${meaning}). ` +
  'Dime cuándo se usa, si es formal o coloquial, tres ejemplos con su traducción, ' +
  'y con qué palabras parecidas se confunde.'

export const searchUrl = (word: string, meaning: string): string =>
  // udm=50 asks Google for its AI answer. Where that is not offered the same
  // URL is an ordinary, well-phrased search, so it never lands on nothing.
  `https://www.google.com/search?udm=50&q=${encodeURIComponent(question(word, meaning))}`

/**
 * Whether the machine can answer on its own. A browser without the API never
 * settles the promise in some builds, so a slow answer counts as a no.
 */
export async function localAvailability(): Promise<Availability> {
  const api = model()
  if (!api) return 'unavailable'
  try {
    const slow = new Promise<Availability>((resolve) => setTimeout(() => resolve('unavailable'), 3000))
    return await Promise.race([api.availability(), slow])
  } catch {
    return 'unavailable'
  }
}

/**
 * Streams an answer from the model on the machine. `onProgress` reports the
 * one-off download, `onText` every piece of the answer as it arrives.
 */
export async function explainLocally(
  word: string,
  meaning: string,
  onText: (text: string) => void,
  onProgress?: (fraction: number) => void,
): Promise<void> {
  const api = model()
  if (!api) throw new Error('no local model')

  const session = await api.create({
    initialPrompts: [{ role: 'system', content: TEACHER }],
    monitor: (monitor) => {
      monitor.addEventListener('downloadprogress', (event) => onProgress?.(event.loaded))
    },
  })

  try {
    let answer = ''
    for await (const chunk of session.promptStreaming(question(word, meaning))) {
      answer += chunk
      onText(answer)
    }
  } finally {
    session.destroy()
  }
}
