import type { Slot } from '../engine/typing'

/**
 * Renders the dashes the learner types over. Slots are grouped word by word so
 * a long sentence wraps between words rather than mid-word.
 */

type Chunk = { key: number; slots: { slot: Slot; index: number }[] }

function toChunks(slots: Slot[]): Chunk[] {
  const chunks: Chunk[] = []
  let current: Chunk | null = null

  slots.forEach((slot, index) => {
    const isGap = slot.char === ' '
    if (isGap || !current) {
      current = { key: index, slots: [] }
      chunks.push(current)
    }
    current.slots.push({ slot, index })
    if (isGap) current = null
  })

  return chunks
}

export function TypedLine({
  slots,
  size,
  cursor,
  onWord,
}: {
  slots: Slot[]
  size: 'lg' | 'sm'
  /** Index of the slot waiting for a key, or -1 when this line is not active. */
  cursor: number
  /** When given, each finished word becomes a button that asks for its meaning. */
  onWord?: (word: string) => void
}) {
  return (
    <div className={`slots ${size}`}>
      {toChunks(slots).map((chunk) => {
        const text = chunk.slots
          .map(({ slot }) => slot.char)
          .join('')
          .trim()
        const askable = Boolean(onWord) && text.length > 0 && chunk.slots.every(({ slot }) => slot.filled)
        const Tag = askable ? 'button' : 'span'

        return (
        <Tag
          className={`chunk ${askable ? 'askable' : ''}`}
          key={chunk.key}
          {...(askable ? { onClick: () => onWord?.(text), title: `What does "${text}" mean?` } : {})}
        >
          {chunk.slots.map(({ slot, index }) => {
            const isGap = slot.char === ' '
            const isPunct = !slot.typeable && !isGap
            const classes = [
              'slot',
              isGap ? 'gap' : '',
              isPunct ? 'punct' : '',
              index === cursor ? 'active' : '',
            ]
              .filter(Boolean)
              .join(' ')

            return (
              <span className={classes} key={index}>
                <span className={`ch ${slot.filled ? '' : 'blank'}`}>
                  {isGap ? ' ' : slot.char}
                </span>
                <span className="rule" />
                {index === cursor && <span className="cursor" />}
              </span>
            )
          })}
        </Tag>
        )
      })}
    </div>
  )
}
