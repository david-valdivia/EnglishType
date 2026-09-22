let context: AudioContext | null = null

/**
 * The one audio context the app uses, for the chimes and for spoken audio.
 *
 * Browsers start it suspended until a gesture; every caller here runs from a
 * keystroke or a tap, so resuming is allowed — and once it is running, sound
 * generated later (a voice that took a second to synthesise) plays without
 * tripping the autoplay rules.
 */
export function audioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor =
    window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null

  context ??= new Ctor()
  if (context.state === 'suspended') void context.resume()
  return context
}
