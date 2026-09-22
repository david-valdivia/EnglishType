import { DEFAULT_VOICE } from '../lib/kokoroVoices'
import type { Device } from '../lib/kokoro'

/** Which voice reads the words out, and how. */
export type VoiceSettings = {
  engine: 'system' | 'kokoro'
  voice: string
  device: Device
}

const KEY = 'englishtype:voice:v1'

export const DEFAULT_SETTINGS: VoiceSettings = {
  engine: 'system',
  voice: DEFAULT_VOICE,
  device: 'webgpu',
}

export function loadVoiceSettings(store: Storage, fallbackDevice: Device): VoiceSettings {
  const defaults = { ...DEFAULT_SETTINGS, device: fallbackDevice }
  try {
    const saved: unknown = JSON.parse(store.getItem(KEY) ?? 'null')
    if (!saved || typeof saved !== 'object') return defaults
    const { engine, voice, device } = saved as Partial<VoiceSettings>
    return {
      engine: engine === 'kokoro' ? 'kokoro' : 'system',
      voice: typeof voice === 'string' && voice ? voice : defaults.voice,
      device: device === 'webgpu' || device === 'wasm' ? device : defaults.device,
    }
  } catch {
    // Unreadable or absent: the system voice is a safe place to start.
    return defaults
  }
}

export function saveVoiceSettings(store: Storage, settings: VoiceSettings): void {
  try {
    store.setItem(KEY, JSON.stringify(settings))
  } catch {
    // Private browsing: the choice just will not persist.
  }
}

const ONBOARDED = 'englishtype:voice-onboarded:v1'

/** Whether the voice has ever been chosen. Asked once, on the first visit. */
export function hasChosenVoice(store: Storage): boolean {
  try {
    return store.getItem(ONBOARDED) === 'yes'
  } catch {
    // No storage, no way to remember — better to ask again than to assume.
    return false
  }
}

export function markVoiceChosen(store: Storage): void {
  try {
    store.setItem(ONBOARDED, 'yes')
  } catch {
    // Private browsing: it will ask again next time.
  }
}
