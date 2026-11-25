import { computed, getCurrentInstance, onBeforeUnmount, shallowRef } from 'vue'

// What the agents panel talks about (#7111 §2). A page says what it shows;
// the panel reads the latest one. The deepest page part wins: a child's setup
// runs after its parent's, and a new route's page sets up before the old one
// goes, so the last one still mounted is the one on screen. The layout's
// generic context is a fallback: pages wrap the layout, so it sets up after
// them, yet any page's own context comes first.

export type PageContext = {
  // An event: the server builds the text from the stored event (key = uuid).
  // A page: the client's text goes as it is (key = route with its query).
  kind: 'event' | 'page'
  key: string
  // «Sentry error · OrderError: Order 15 not found», «Sentry exceptions».
  title: string
  // The page's own words (page only): route, project, filters, top rows.
  text?: string
  project?: string
  // Three ready questions for the empty panel; defaults by kind otherwise.
  suggestions?: string[]
}

type Entry = { id: number; fallback: boolean; get: () => PageContext | null }

let seq = 0
const entries = shallowRef<Entry[]>([])

const latest = (list: Entry[]): PageContext | null => {
  for (let i = list.length - 1; i >= 0; i--) {
    const ctx = list[i].get()
    if (ctx) return ctx
  }
  return null
}

export const currentPageContext = computed<PageContext | null>(
  () => latest(entries.value.filter((e) => !e.fallback)) ?? latest(entries.value.filter((e) => e.fallback))
)

// Call in setup. A getter that answers null steps aside (an event page while
// its event loads): the next one down is used.
export const providePageContext = (
  get: () => PageContext | null,
  { fallback = false }: { fallback?: boolean } = {}
): (() => void) => {
  const entry = { id: ++seq, fallback, get }
  entries.value = [...entries.value, entry]
  const remove = () => {
    entries.value = entries.value.filter((e) => e.id !== entry.id)
  }
  if (getCurrentInstance()) onBeforeUnmount(remove)
  return remove
}

// Page text is capped by the server at 4096 bytes (400 context_too_long):
// cut at a line, by bytes, before sending.
export const PAGE_TEXT_BYTES = 4000

export const clipBytes = (text: string, max = PAGE_TEXT_BYTES): string => {
  const enc = new TextEncoder()
  if (enc.encode(text).length <= max) return text
  const lines = text.split('\n')
  const out: string[] = []
  let size = 0
  const tail = '… (cut)'
  const room = max - enc.encode(tail).length - 1
  for (const line of lines) {
    const n = enc.encode(line).length + 1
    if (size + n > room) break
    out.push(line)
    size += n
  }
  if (!out.length) {
    // One huge line: cut by characters until it fits.
    let s = lines[0]
    while (s && enc.encode(s).length > room) s = s.slice(0, Math.floor(s.length * 0.9))
    out.push(s)
  }
  return `${out.join('\n')}\n${tail}`
}

// Test helper: forget every context.
export const resetPageContexts = () => {
  entries.value = []
}
