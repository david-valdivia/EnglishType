const base = import.meta.env.BASE_URL

/** Where an illustration lives, so it can also be fetched ahead of time. */
export const iconUrl = (name: string) => `${base}icons/${name}.svg`

/**
 * Pulls an illustration into the cache before it is needed. Nothing is done
 * with the result: the browser keeps it, and the <img> that asks for it next
 * finds it already there.
 */
export function preloadIcon(name: string): void {
  const image = new Image()
  image.src = iconUrl(name)
}
