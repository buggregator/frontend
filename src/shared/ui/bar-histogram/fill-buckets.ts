// One bar of a histogram: its start (unix seconds) and a count per series.
export type BarBucket = { t: number; values: Record<string, number> }

// A series of the stack: which value of a bar, its legend word and colour.
export type BarSeries = {
  key: string
  label: string
  tone: 'error' | 'warning' | 'info' | 'neutral'
}

// The most bars a chart draws; the oldest go first past it.
export const MAX_BARS = 1440

// The bars from `from` to `to` (unix seconds), one per `bucket` seconds, with
// the empty ones a server leaves out filled in as zero. Points outside the
// range are dropped; points that share a bar are added up.
export const fillBuckets = (
  points: BarBucket[],
  bucket: number,
  from: number,
  to: number,
  max = MAX_BARS
): BarBucket[] => {
  if (!(bucket > 0) || !Number.isFinite(from) || !Number.isFinite(to) || to < from) return []

  const last = Math.floor(to / bucket) * bucket
  const first = Math.max(Math.floor(from / bucket) * bucket, last - (max - 1) * bucket)

  const byStart = new Map<number, Record<string, number>>()
  for (const p of points) {
    const t = Math.floor(p.t / bucket) * bucket
    if (t < first || t > last) continue
    const values = byStart.get(t) ?? {}
    for (const [key, n] of Object.entries(p.values)) values[key] = (values[key] ?? 0) + n
    byStart.set(t, values)
  }

  const out: BarBucket[] = []
  for (let t = first; t <= last; t += bucket) out.push({ t, values: byStart.get(t) ?? {} })
  return out
}

export const bucketTotal = (bar: BarBucket) =>
  Object.values(bar.values).reduce((sum, n) => sum + n, 0)
