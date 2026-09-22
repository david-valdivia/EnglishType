/**
 * How much of the screen the phone can actually show.
 *
 * `100dvh` covers the browser's own bars but not the on-screen keyboard, and
 * on iOS no CSS length does: the layout viewport keeps its full height while
 * the keyboard covers the bottom third of it. The visible height is therefore
 * measured and published as a custom property, so the exercise can size itself
 * to the part of the screen the learner can see.
 */
export function trackVisibleHeight(): void {
  const viewport = window.visualViewport
  if (!viewport) return

  const publish = () => {
    document.documentElement.style.setProperty('--app-h', `${Math.round(viewport.height)}px`)
  }

  publish()
  viewport.addEventListener('resize', publish)
}
