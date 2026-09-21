import { useEffect, useState } from 'react'
import { onSpeechChange, speechOutlook } from './speech'

/** Re-renders when the browser finally tells us what it can do. */
export function useSpeechOutlook() {
  const [outlook, setOutlook] = useState(speechOutlook)

  useEffect(() => onSpeechChange(() => setOutlook(speechOutlook())), [])

  return outlook
}
