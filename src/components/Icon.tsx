import { useState } from 'react'

const base = import.meta.env.BASE_URL

/**
 * An illustration, with the two things a plain <img> gets wrong here.
 *
 * The home screen holds a hundred of them. Loading every one at once is how a
 * flaky connection ends up dropping a few, so only the one in the exercise —
 * where it is the whole point — loads eagerly.
 *
 * And when a request does fail, a broken-image box is the worst possible
 * outcome: it is uglier than nothing and says nothing. One retry, then a quiet
 * placeholder.
 */
export function Icon({
  name,
  className,
  priority = false,
}: {
  name: string
  className?: string
  /** True for the illustration the exercise is built around. */
  priority?: boolean
}) {
  // Failures are recorded against the name they belong to, so a new
  // illustration starts fresh without an effect resetting it.
  const [failure, setFailure] = useState({ name, attempt: 0 })
  const attempt = failure.name === name ? failure.attempt : 0

  if (attempt > 1) {
    return <span className={`icon-missing ${className ?? ''}`} aria-hidden />
  }

  return (
    <img
      className={className}
      // The retry is a different URL, or the browser serves its cached failure.
      src={`${base}icons/${name}.svg${attempt === 1 ? '?retry' : ''}`}
      alt=""
      aria-hidden
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setFailure({ name, attempt: attempt + 1 })}
    />
  )
}
