export type ReasonPart = { text: string; code: boolean }

// `x`, a setting `update.self_update: on` or an env variable `UPDATE_SELF=on`.
const TOKEN = /`([^`]+)`|([a-z_]+(?:\.[a-z_]+)+: [^\s),]+)|([A-Z][A-Z0-9_]+=[^\s),]+)/g

// The server's reason, as parts to show: setting names in code style, the
// first letter capitalised (the server writes them lower-case).
export const reasonParts = (text: string | undefined): ReasonPart[] => {
  if (!text) return []
  const parts: ReasonPart[] = []
  let last = 0
  for (const match of text.matchAll(TOKEN)) {
    const index = match.index ?? 0
    if (index > last) parts.push({ text: text.slice(last, index), code: false })
    parts.push({ text: match[1] ?? match[2] ?? match[3], code: true })
    last = index + match[0].length
  }
  if (last < text.length) parts.push({ text: text.slice(last), code: false })

  const first = parts[0]
  if (first && !first.code) first.text = first.text.charAt(0).toUpperCase() + first.text.slice(1)
  return parts
}
