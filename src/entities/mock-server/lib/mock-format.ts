import type { MockHttpDump, MockNearReason } from '../types'
import { withQuery } from './mock-rule'

// Light badges use -700 on -50 (≥4.5:1 for 11 px text); dark -400 on -500/10.
const TONES = {
  green: 'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-500/10',
  blue: 'text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-500/10',
  amber: 'text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10',
  red: 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-500/10',
  gray: 'text-gray-700 bg-gray-100 dark:text-gray-300 dark:bg-gray-500/10',
}

export const methodTone = (method: string): string => {
  const m = method.toUpperCase()
  if (m === 'GET') return TONES.green
  if (m === 'POST') return TONES.blue
  if (m === 'PUT' || m === 'PATCH') return TONES.amber
  if (m === 'DELETE') return TONES.red
  return TONES.gray
}

export const statusTone = (status: number): string => {
  if (status >= 500) return TONES.red
  if (status >= 400) return TONES.amber
  if (status >= 300) return TONES.blue
  return TONES.green
}

export const NEAR_REASON_TEXT: Record<MockNearReason, string> = {
  disabled: 'path fits, but the rule is disabled',
  method: 'path fits, the method differs',
  project: 'path fits, the rule is for another project',
}

export const delayText = (ms: number): string => (ms >= 1000 ? `${ms / 1000} s` : `${ms} ms`)

const quote = (s: string) => `'${s.replace(/'/g, `'\\''`)}'`

const SKIP_HEADERS = new Set(['host', 'content-length', 'connection', 'accept-encoding'])

// A cURL command that repeats the captured request against the same server.
// The dump stores the URI without its leading slash and the query apart.
export const toCurl = (origin: string, req: MockHttpDump['request']): string => {
  const url = `${origin.replace(/\/+$/, '')}/${withQuery(req.uri.replace(/^\/+/, ''), req.query)}`
  const parts = [`curl -X ${req.method.toUpperCase()} ${quote(url)}`]
  Object.entries(req.headers || {}).forEach(([name, values]) => {
    if (SKIP_HEADERS.has(name.toLowerCase())) return
    const list = Array.isArray(values) ? values : [values]
    list.forEach((v) => parts.push(`-H ${quote(`${name}: ${v}`)}`))
  })
  if (req.body) parts.push(`--data-raw ${quote(req.body)}`)
  return parts.join(' \\\n  ')
}

export const formatJson = (body: string): string | null => {
  try {
    return JSON.stringify(JSON.parse(body), null, 2)
  } catch {
    return null
  }
}
