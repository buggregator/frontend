import { isMonologErrorLevel } from '@/entities/monolog'
import { fillBuckets, MAX_BARS, type BarBucket, type BarSeries } from '@/shared/ui/bar-histogram'
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
  // The server sizes the bucket for first..last line; drawn up to now that can
  // need more than MAX_BARS bars and the old lines would fall off. Widen it to
  // a multiple of the server's bucket (fillBuckets adds up shared bars).
  const bucket = Math.max(1, Math.ceil((now - from) / MAX_BARS / reply.bucket)) * reply.bucket
  return fillBuckets(points, bucket, from, now)
}

const plural = (n: number, word: string) => (n === 1 ? word : `${n} ${word}s`)

// What one bar counts, for screen readers: «Log lines per 7 minutes».
export const barsLabel = (bars: BarBucket[]): string => {
  const step = bars.length > 1 ? bars[1].t - bars[0].t : 0
  if (step <= 0) return 'Log lines over time'
  if (step % 3600 === 0) return `Log lines per ${plural(step / 3600, 'hour')}`
  if (step % 60 === 0) return `Log lines per ${plural(step / 60, 'minute')}`
  return `Log lines per ${plural(step, 'second')}`
}
