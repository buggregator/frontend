import type { ServerEvent } from '../../types'
import { eventContextTitle } from './event-title'
import { clipBytes } from './page-context'

// The words a page sends to the agents (#7111 §2): where it is, which project,
// period and filters, how many items and the first rows. The server takes
// them as they are (≤ 4 KB) and does not rebuild lists from filters.

export type PageFacts = {
  title: string
  path: string
  project?: string | null
  period?: string
  filters?: { key: string; value: string; not: boolean }[]
  count?: number
  rows?: ServerEvent<unknown>[]
}

export const ROWS_SENT = 20

// One thread per page and project: filters and other query parts do not
// start a new one.
export const pageKey = (path: string, project?: string | null): string =>
  project ? `${path}?project=${encodeURIComponent(project)}` : path

const timeOf = (ts?: number) => (ts ? new Date(ts * 1000).toISOString().replace('.000Z', 'Z') : '')

export const pageText = (f: PageFacts): string => {
  const lines = [`Page: ${f.title}`, `Route: ${f.path}`]
  if (f.project) lines.push(`Project: ${f.project}`)
  if (f.period) lines.push(`Period: ${f.period}`)
  if (f.filters?.length) {
    lines.push(`Filters: ${f.filters.map((x) => `${x.not ? 'not ' : ''}${x.key}=${x.value}`).join(', ')}`)
  }
  if (f.count !== undefined) lines.push(`Items shown: ${f.count}`)
  const rows = f.rows?.slice(0, ROWS_SENT) ?? []
  if (rows.length) {
    lines.push('', `First ${rows.length} (type | title | uuid | time):`)
    for (const e of rows) lines.push(`${e.type} | ${eventContextTitle(e)} | ${e.uuid} | ${timeOf(e.timestamp)}`)
  }
  return clipBytes(lines.join('\n'))
}
