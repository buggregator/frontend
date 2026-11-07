import type { MockFake } from '../types'

// Text with `snippet` put over the selection [start, end) — or at the end when
// the field has no cursor — and where the cursor goes after it.
export const insertAt = (
  text: string,
  start: number | null,
  end: number | null,
  snippet: string
): { text: string; caret: number } => {
  const from = start ?? text.length
  const to = end ?? from
  return { text: text.slice(0, from) + snippet + text.slice(to), caret: from + snippet.length }
}

// Fake-data generators matching a search (name or description) and a category.
export const filterFakes = (fakes: MockFake[], query: string, category: string): MockFake[] => {
  const q = query.trim().toLowerCase()
  return fakes.filter(
    (f) =>
      (!category || f.category === category) &&
      (!q || f.name.toLowerCase().includes(q) || f.description.toLowerCase().includes(q))
  )
}

export const fakeCategories = (fakes: MockFake[]): string[] =>
  [...new Set(fakes.map((f) => f.category))].sort()

// "Name: value" lines of the sample request into headers; lines without a name are skipped.
export const parseHeaderLines = (text: string): Record<string, string> => {
  const headers: Record<string, string> = {}
  text.split('\n').forEach((line) => {
    const at = line.indexOf(':')
    const name = at > 0 ? line.slice(0, at).trim() : ''
    if (name) headers[name] = line.slice(at + 1).trim()
  })
  return headers
}

// Go types a JSON body can take as written; anything else (strings, maps,
// lists) needs `| json`. Parameters are left out: the server fills defaults.
const PLAIN_OUTPUT = /^(u?int(8|16|32|64)?|float(32|64)|bool)$/

export const fakeSnippet = (f: MockFake): string =>
  PLAIN_OUTPUT.test(f.output) ? `{{ fake "${f.name}" }}` : `{{ fake "${f.name}" | json }}`
