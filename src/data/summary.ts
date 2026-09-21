/** What the home screen needs about a chapter, without loading its words. */
export type ChapterSummary = {
  id: string
  title: string
  icon: string
  group: string
  /** The chapter module this lives in, so the loader fetches only that one. */
  source: string
  wordIds: string[]
}
