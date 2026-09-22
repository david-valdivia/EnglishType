import { audioContext } from './audio'
import { clearStored, modelCache, opfsAvailable, storedBytes } from './opfsCache'

/**
 * Kokoro: a speech model that runs on the learner's own machine.
 *
 * It is open source, needs no key, and nothing typed here is sent anywhere —
 * the text never leaves the computer. It speaks English only, in 28 voices.
 *
 * The cost is the download: 326 MB, once. On a GPU a sentence takes about a
 * second to generate; without one it is closer to forty, which is why WebGPU
 * is the default wherever the browser offers it.
 */

const MODEL = 'onnx-community/Kokoro-82M-v1.0-ONNX'

export type Device = 'webgpu' | 'wasm'

export type LoadProgress = {
  /** 0 to 1 across the whole download, or undefined while sizes are unknown. */
  fraction?: number
  loaded: number
  total: number
}

type Tts = {
  generate: (text: string, options: { voice: string; speed?: number }) => Promise<{
    // Narrowed from ArrayBufferLike: Web Audio will not take a shared buffer,
    // and the model never produces one.
    audio: Float32Array<ArrayBuffer>
    sampling_rate: number
  }>
}

export const webgpuAvailable = (): boolean => typeof navigator !== 'undefined' && 'gpu' in navigator

export const kokoroPossible = (): boolean => opfsAvailable() && typeof WebAssembly !== 'undefined'

export const preferredDevice = (): Device => (webgpuAvailable() ? 'webgpu' : 'wasm')

let loaded: { device: Device; tts: Tts } | null = null
let loading: Promise<Tts> | null = null
let inFlight: AbortController | null = null

/**
 * Stops a download in progress.
 *
 * Transformers.js takes no abort signal, so the only place to put one is
 * `fetch` itself: while a load is running, requests to the model's host — and
 * nothing else — carry our signal. Aborting rejects the fetch, which rejects
 * the load, and the half-written file is discarded rather than committed.
 */
export function cancelKokoroLoad(): void {
  inFlight?.abort()
}

export const kokoroReady = (): boolean => loaded !== null

/**
 * Loads the model, from the machine if it is already there and from Hugging
 * Face if it is not. The same load is shared by every caller that asks while it
 * is in flight.
 */
export function loadKokoro(device: Device, onProgress?: (progress: LoadProgress) => void): Promise<Tts> {
  if (loaded && loaded.device === device) return Promise.resolve(loaded.tts)
  if (loading) return loading

  const controller = new AbortController()
  inFlight = controller
  const plainFetch = globalThis.fetch
  globalThis.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    return url.includes('huggingface.co')
      ? plainFetch(input, { ...init, signal: controller.signal })
      : plainFetch(input, init)
  }

  loading = (async () => {
    const [{ KokoroTTS }, { env }] = await Promise.all([
      import('kokoro-js'),
      import('@huggingface/transformers'),
    ])

    // Ours rather than the Cache API, which refuses a file this size.
    env.useBrowserCache = false
    env.useCustomCache = true
    env.customCache = modelCache

    // Files arrive one at a time; progress is reported across all of them so
    // the bar moves once, from nothing to done.
    const files = new Map<string, { loaded: number; total: number }>()
    let reported = -1
    const tts = (await KokoroTTS.from_pretrained(MODEL, {
      dtype: 'fp32',
      device,
      progress_callback: (event: { status: string; file?: string; loaded?: number; total?: number }) => {
        if (event.status !== 'progress' || !event.file) return
        files.set(event.file, { loaded: event.loaded ?? 0, total: event.total ?? 0 })

        // The weights are 326 MB; everything beside them is a few kilobytes of
        // configuration that arrives first and finishes instantly. Summing the
        // lot puts the bar at 100% before the real download has begun, so the
        // biggest file is the one that speaks — and nothing is said until it
        // has been announced.
        let main: { loaded: number; total: number } | undefined
        for (const file of files.values()) if (!main || file.total > main.total) main = file
        if (!main || main.total < 10_000_000) return

        // Thousands of events a second otherwise, and a re-render for each.
        const percent = Math.floor((main.loaded / main.total) * 100)
        if (percent === reported) return
        reported = percent
        onProgress?.({ fraction: main.loaded / main.total, loaded: main.loaded, total: main.total })
      },
    })) as unknown as Tts

    loaded = { device, tts }
    return tts
  })()

  loading.finally(() => {
    loading = null
    inFlight = null
    globalThis.fetch = plainFetch
  })

  return loading
}

let playing: AudioBufferSourceNode | null = null

/** Stops whatever Kokoro is currently saying, so a replay replaces it. */
export function stopKokoro(): void {
  playing?.stop()
  playing = null
}

/**
 * Says something in the chosen voice. Resolves when the audio starts, not when
 * it finishes, to match what the system voice reports.
 */
export async function speakKokoro(text: string, voice: string, device: Device): Promise<void> {
  const tts = await loadKokoro(device)
  const result = await tts.generate(text, { voice })

  const ctx = audioContext()
  if (!ctx) throw new Error('no audio output')

  const buffer = ctx.createBuffer(1, result.audio.length, result.sampling_rate)
  buffer.copyToChannel(result.audio, 0)

  stopKokoro()
  const source = ctx.createBufferSource()
  source.buffer = buffer
  source.connect(ctx.destination)
  source.addEventListener('ended', () => {
    if (playing === source) playing = null
  })
  source.start()
  playing = source
}

export { clearStored, storedBytes }

/** Drops the model from memory as well as from disk. */
export function forgetKokoro(): void {
  stopKokoro()
  loaded = null
}
