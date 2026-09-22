import { useState } from 'react'
import { iconUrl } from '../lib/icons'

/**
 * An illustration, with the three things a plain <img> gets wrong here.
 *
 * The home screen holds a hundred of them. Loading every one at once is how a
 * flaky connection ends up dropping a few, so only the one in the exercise —
 * where it is the whole point — loads eagerly.
 *
 * A slow one leaves a hole where the picture should be, so the frame holds its
 * place and says it is working on it. Only after a moment: a fast load must
 * never flash a spinner at anybody.
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
  // Progress is recorded against the name it belongs to, so a new illustration
  // starts fresh without an effect resetting it.
  const [status, setStatus] = useState({ name, attempt: 0, loaded: false })
  const current = status.name === name ? status : { name, attempt: 0, loaded: false }

  if (current.attempt > 1) {
    return <span className={`icon icon-missing ${className ?? ''}`} aria-hidden />
  }

  return (
    <span className={`icon ${current.loaded ? '' : 'icon-waiting'} ${className ?? ''}`} aria-hidden>
      <img
        // A cached illustration can finish before React hears about it, so the
        // element is asked outright rather than waited on.
        ref={(img) => {
          if (img?.complete && !current.loaded) setStatus({ ...current, loaded: true })
        }}
        // The retry is a different URL, or the browser serves its cached failure.
        src={`${iconUrl(name)}${current.attempt === 1 ? '?retry' : ''}`}
        alt=""
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setStatus({ ...current, loaded: true })}
        onError={() => setStatus({ name, attempt: current.attempt + 1, loaded: false })}
      />
    </span>
  )
}
