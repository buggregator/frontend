import { monologLevelKey, monologTraceId, type Monolog } from '@/entities/monolog'
import type { ServerEvent } from '@/shared/types'
import { searchWords, type LogsFilters } from './logs-filters'

// The text a search looks in, lower case: message, channel, and the keys and
// values of context and extra (the server's rule for `q`). The server indexes
// only the first 4096 characters (event.MaxSearchTextLen): a live line that
// matches past them here may be gone after a reload. Rare; left as it is.
const haystack = (payload: Monolog): string => {
  const parts: string[] = [payload.message ?? '', payload.channel ?? '']
  const walk = (value: unknown, depth: number) => {
    if (value == null || depth > 8) return
    if (typeof value === 'object') {
      for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
        if (!Array.isArray(value)) parts.push(key)
        walk(v, depth + 1)
      }
      return
    }
    parts.push(String(value))
  }
  walk(payload.context, 0)
  walk(payload.extra, 0)
  return parts.join('\n').toLowerCase()
}

// Whether a live record belongs on screen under these filters: the same
// rules the server applies to the list.
export const matchesLog = (event: ServerEvent<Monolog>, f: LogsFilters): boolean => {
  const p = event.payload
  if (!p) return false
  if (f.levels.length && !f.levels.includes(monologLevelKey(p.level, p.level_name))) return false
  if (f.channels.length && !f.channels.includes(p.channel)) return false
  if (f.trace && (monologTraceId(p) ?? event.facets?.trace?.[0]) !== f.trace) return false
  const words = searchWords(f.q)
  if (!words.length) return true
  const text = haystack(p)
  return words.every((w) => text.includes(w))
}
