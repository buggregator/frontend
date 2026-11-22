export type MarkSegment = { text: string; match: boolean }

// Cuts `text` into plain and marked parts: every place one of `terms` occurs,
// case-insensitive. Overlapping matches merge; a longer term wins where two
// start at the same place.
export const markSegments = (text: string, terms: string[]): MarkSegment[] => {
  const words = [...new Set(terms.map((t) => t.trim().toLowerCase()).filter(Boolean))]
  if (!text || !words.length) return [{ text, match: false }]

  const lower = text.toLowerCase()
  const marked = new Uint8Array(text.length)
  for (const word of words) {
    let pos = lower.indexOf(word)
    while (pos !== -1) {
      marked.fill(1, pos, pos + word.length)
      pos = lower.indexOf(word, pos + 1)
    }
  }

  const out: MarkSegment[] = []
  let start = 0
  for (let i = 1; i <= text.length; i++) {
    if (i === text.length || marked[i] !== marked[start]) {
      out.push({ text: text.slice(start, i), match: marked[start] === 1 })
      start = i
    }
  }
  return out
}
