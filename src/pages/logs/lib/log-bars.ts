import { isMonologErrorLevel } from '@/entities/monolog'
import { fillBuckets, type BarBucket, type BarSeries } from '@/shared/ui/bar-histogram'
import { windowSeconds } from './logs-filters'

// `GET /api/events/histogram`: lines per bucket with a count per level. Empty
// buckets are left out; the server widens `bucket` for a long range.
export type LogsHistogram = {
  bucket: number
  data: { t: number; count: number; levels?: Record<string, number> }[]
}

export const LOG_SERIES: BarSeries[] = [
  { key: 'error', label: 'error', tone: 'error' },
  { key: 'warning', label: 'warning', tone: 'warning' },
  { key: 'other', label: 'other', tone: 'neutral' }
]

// The bars of the chart: errors (error and worse), warnings and the rest, for
// the whole window up to now, empty buckets included. «All time» spans from
// the first line.
export const toLogBars = (
  reply: LogsHistogram | null,
  window: string,
  now: number
): BarBucket[] => {
  if (!reply?.bucket) return []
  const points = reply.data.map(({ t, count, levels = {} }) => {
    let error = 0
    let warning = 0
    for (const [level, n] of Object.entries(levels)) {
      if (isMonologErrorLevel(level)) error += n
      else if (level === 'warning') warning += n
    }
    return { t, values: { error, warning, other: Math.max(0, count - error - warning) } }
  })
  const span = windowSeconds(window)
  const from = span ? now - span + reply.bucket : (points[0]?.t ?? now)
  return fillBuckets(points, reply.bucket, from, now)
}
