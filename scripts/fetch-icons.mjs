// Downloads every illustration the app references into public/icons/.
// Names are read straight out of src/data/chapters/, so adding a word there and
// re-running this is all it takes to get its picture.
//
//   npm run icons
//
// Fluent Emoji is MIT licensed — see LICENSES.md.

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const OUT = 'public/icons'
const DATA = 'src/data/chapters'
const SET = 'fluent-emoji'
/** Keeps each request URL well under any practical length limit. */
const BATCH = 100

/** Illustrations used by the interface itself rather than by a word. */
const UI_ICONS = [
  'counterclockwise-arrows-button', // Review deck
  'star', // Marked words deck
  'game-die', // Random words deck
  'shuffle-tracks-button', // All words deck
  'trophy', // results screen
  'keyboard', // favicon
]

const names = new Set(UI_ICONS)
for (const file of readdirSync(DATA)) {
  if (!file.endsWith('.ts') || file.endsWith('.test.ts')) continue
  const source = readFileSync(join(DATA, file), 'utf8')
  for (const match of source.matchAll(/icon: '([^']+)'/g)) names.add(match[1])
}

const wanted = [...names].sort()
const found = new Set()

mkdirSync(OUT, { recursive: true })
for (let i = 0; i < wanted.length; i += BATCH) {
  const batch = wanted.slice(i, i + BATCH)
  const res = await fetch(`https://api.iconify.design/${SET}.json?icons=${batch.join(',')}`)
  if (!res.ok) throw new Error(`${SET}: HTTP ${res.status}`)
  const data = await res.json()

  for (const [name, def] of Object.entries(data.icons ?? {})) {
    const width = def.width ?? data.width ?? 24
    const height = def.height ?? data.height ?? 24
    writeFileSync(
      join(OUT, `${name}.svg`),
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">${def.body}</svg>`,
    )
    found.add(name)
  }
}

const missing = wanted.filter((name) => !found.has(name))
if (missing.length) {
  console.error(`Missing from ${SET}: ${missing.join(', ')}`)
  process.exitCode = 1
}
console.log(`${found.size}/${wanted.length} illustrations in ${OUT}`)
