import { useSyncExternalStore } from 'react'
import { onSpeechBusyChange, speechBusy } from './speech'

/** True while a voice is being generated, for the button that asked for it. */
export const useSpeechBusy = (): boolean =>
  useSyncExternalStore(onSpeechBusyChange, speechBusy, () => false)
