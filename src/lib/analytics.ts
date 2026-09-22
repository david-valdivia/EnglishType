type Params = Record<string, string | number>

declare global {
  interface Window {
    gtag?: (command: 'event', name: string, params?: Params) => void
  }
}

/**
 * One line of the site's own story: which chapters get opened, which get
 * finished, and in which direction people read.
 *
 * Analytics is blocked more often than not — a shield, an extension, a private
 * window — so nothing here may ever matter to the app. It is a no-op whenever
 * the tag is absent, and a thrown error is swallowed rather than losing the
 * learner their exercise.
 */
export function track(event: string, params: Params = {}): void {
  try {
    window.gtag?.('event', event, params)
  } catch {
    // Not worth a broken screen.
  }
}
