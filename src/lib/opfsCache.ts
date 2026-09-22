/**
 * Where the downloaded model lives.
 *
 * Transformers.js keeps models in the Cache API by default, and a browser is
 * entitled to refuse a single 326 MB entry there — which it does, quietly, so
 * the model downloads again on every visit. The origin private file system has
 * no such objection, and it is a real file system: the file is streamed to
 * disk rather than held whole in memory on the way in.
 *
 * The object below is the two methods Transformers.js asks of a custom cache,
 * `match` and `put`, with the same shapes the Cache API uses.
 */

const DIRECTORY = 'kokoro'

const storage = (): StorageManager | undefined =>
  typeof navigator !== 'undefined' && 'storage' in navigator && 'getDirectory' in navigator.storage
    ? navigator.storage
    : undefined

export const opfsAvailable = (): boolean => storage() !== undefined

/** A cache key is a URL; a file name cannot hold one, so it is escaped whole. */
const fileName = (key: string) => encodeURIComponent(key)

async function directory(create: boolean): Promise<FileSystemDirectoryHandle | undefined> {
  const store = storage()
  if (!store) return undefined
  try {
    const root = await store.getDirectory()
    return await root.getDirectoryHandle(DIRECTORY, { create })
  } catch {
    return undefined
  }
}

export const modelCache = {
  async match(key: string): Promise<Response | undefined> {
    const dir = await directory(false)
    if (!dir) return undefined
    try {
      const handle = await dir.getFileHandle(fileName(key))
      const file = await handle.getFile()
      // A Blob body, so nothing is read until it is actually wanted.
      return new Response(file)
    } catch {
      return undefined
    }
  },

  async put(key: string, response: Response): Promise<void> {
    const dir = await directory(true)
    if (!dir || !response.body) return

    // A writable stream commits only when it is closed, and pipeTo aborts it on
    // failure — so an interrupted download leaves nothing behind to be mistaken
    // for a complete file, without writing the bytes twice to get there.
    const handle = await dir.getFileHandle(fileName(key), { create: true })
    const writable = await handle.createWritable()
    await response.body.pipeTo(writable)
  },
}

/** How much has been kept, so the setting can say what deleting would free. */
export async function storedBytes(): Promise<number> {
  const dir = await directory(false)
  if (!dir) return 0
  let total = 0
  for await (const handle of dir.values()) {
    if (handle.kind !== 'file') continue
    total += (await handle.getFile()).size
  }
  return total
}

/**
 * kokoro-js fetches each voice's embedding itself, straight from the Hub, and
 * keeps it in a Cache API store of its own. Half a megabyte apiece, and not
 * ours — but "clear the cache" that leaves them behind is not a true sentence.
 */
const VOICE_CACHE = 'kokoro-voices'

export async function clearStored(): Promise<void> {
  const store = storage()
  if (store) {
    const root = await store.getDirectory()
    await root.removeEntry(DIRECTORY, { recursive: true }).catch(() => {})
  }
  if (typeof caches !== 'undefined') await caches.delete(VOICE_CACHE).catch(() => {})
}
