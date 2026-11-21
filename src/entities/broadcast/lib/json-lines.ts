import { joinIndex, joinKey, type PayloadChange } from './payload-diff'

// Pretty JSON as lines, each changed value marked (`~` and its old value,
// `+` for a new one), for the payload view of the console (#6614).

export type JsonTokenKind = 'key' | 'str' | 'num' | 'null' | 'punct'

export type JsonToken = { kind: JsonTokenKind; text: string }

export type JsonLine = {
  indent: number
  tokens: JsonToken[]
  mark: '~' | '+' | null
  // The old value of a changed line, as JSON.
  was?: string
}

const scalar = (v: unknown): JsonToken => {
  if (v === null) return { kind: 'null', text: 'null' }
  if (typeof v === 'string') return { kind: 'str', text: JSON.stringify(v) }
  if (typeof v === 'number' || typeof v === 'boolean') return { kind: 'num', text: String(v) }
  return { kind: 'punct', text: JSON.stringify(v) ?? 'undefined' }
}

const short = (v: unknown, max = 60): string => {
  const s = JSON.stringify(v) ?? 'undefined'
  return s.length > max ? `${s.slice(0, max - 1)}…` : s
}

export const jsonLines = (value: unknown, changes: PayloadChange[] = []): JsonLine[] => {
  const byPath = new Map(changes.map((c) => [c.path, c]))
  const lines: JsonLine[] = []

  const markOf = (path: string): Pick<JsonLine, 'mark' | 'was'> => {
    const c = byPath.get(path)
    if (!c || c.kind === 'removed') return { mark: null }
    if (c.kind === 'added') return { mark: '+' }
    return { mark: '~', was: short(c.before) }
  }

  const walk = (v: unknown, indent: number, path: string, key: JsonToken[] | null, comma: boolean) => {
    const head = key ?? []
    const tail: JsonToken[] = comma ? [{ kind: 'punct', text: ',' }] : []
    const isArray = Array.isArray(v)

    if (v !== null && typeof v === 'object') {
      const entries: [string | number, unknown][] = isArray
        ? (v as unknown[]).map((item, i) => [i, item])
        : Object.entries(v as Record<string, unknown>)
      const [open, close] = isArray ? ['[', ']'] : ['{', '}']

      if (!entries.length) {
        lines.push({ indent, tokens: [...head, { kind: 'punct', text: open + close }, ...tail], ...markOf(path) })
        return
      }

      lines.push({ indent, tokens: [...head, { kind: 'punct', text: open }], ...markOf(path) })
      entries.forEach(([k, item], i) => {
        const last = i === entries.length - 1
        if (typeof k === 'number') {
          walk(item, indent + 1, joinIndex(path, k), null, !last)
        } else {
          const keyTokens: JsonToken[] = [
            { kind: 'key', text: JSON.stringify(k) },
            { kind: 'punct', text: ': ' }
          ]
          walk(item, indent + 1, joinKey(path, k), keyTokens, !last)
        }
      })
      lines.push({ indent, tokens: [{ kind: 'punct', text: close }, ...tail], mark: null })
      return
    }

    lines.push({ indent, tokens: [...head, scalar(v), ...tail], ...markOf(path) })
  }

  walk(value, 0, '', null, false)
  return lines
}

// A value for one line of the Changes list.
export const jsonShort = short
