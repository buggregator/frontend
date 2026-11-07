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

// How well a generator matches a search: 0 exact name, 1 name starts with it,
// 2 name contains it, 3 description only, -1 no match.
const fakeRank = (f: MockFake, q: string): number => {
  const name = f.name.toLowerCase()
  if (name === q) return 0
  if (name.startsWith(q)) return 1
  if (name.includes(q)) return 2
  return f.description.toLowerCase().includes(q) ? 3 : -1
}

// Fake-data generators matching a search (name or description) and a category,
// best name matches first; the server's order stays within one rank.
export const filterFakes = (fakes: MockFake[], query: string, category: string): MockFake[] => {
  const q = query.trim().toLowerCase()
  const inCategory = fakes.filter((f) => !category || f.category === category)
  if (!q) return inCategory
  return inCategory
    .map((f) => ({ f, rank: fakeRank(f, q) }))
    .filter(({ rank }) => rank >= 0)
    .sort((a, b) => a.rank - b.rank)
    .map(({ f }) => f)
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
