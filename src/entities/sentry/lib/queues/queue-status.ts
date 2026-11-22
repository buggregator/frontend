import { formatDuration } from '@/shared/lib/formats/format-duration'
import type { QueueAttempt, QueueJob } from '../../types'
import type { CronStatusMeta } from '../crons'

// Statuses of queue jobs (#6713): an icon and a word, colour only on top,
// in the tones of the cron statuses. A job's status is its last attempt's.
// Sentry sends an attempt when it ends: there is no «running», and a failed
// job that the worker will retry looks the same as one it gave up on.

export type QueueDisplayStatus = 'done' | 'failed' | 'retried'

export const QUEUE_STATUS: Record<QueueDisplayStatus, CronStatusMeta> = {
  done: { icon: '✓', label: 'Done', tone: 'ok', hint: 'Finished on the first attempt' },
  failed: {
    icon: '✕',
    label: 'Failed',
    tone: 'err',
    hint: 'The last attempt failed. Whether the worker will try again is not sent by Sentry.'
  },
  retried: { icon: '↻', label: 'Retried', tone: 'miss', hint: 'Finished after more than one attempt' }
}

export const jobStatus = (j: Pick<QueueJob, 'failed' | 'attempts'>): QueueDisplayStatus => {
  if (j.failed) return 'failed'
  return j.attempts > 1 ? 'retried' : 'done'
}

/** One attempt: done or failed. */
export const attemptStatus = (a: Pick<QueueAttempt, 'failed'>): QueueDisplayStatus => (a.failed ? 'failed' : 'done')

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

/** The job page's headline: «Failed after 3 attempts», «Done after 2 attempts», «Done». */
export const statusLine = (j: Pick<QueueJob, 'failed' | 'attempts'>): string => {
  const verb = j.failed ? 'Failed' : 'Done'
  return j.attempts > 1 ? `${verb} after ${plural(j.attempts, 'attempt')}` : verb
}

/** The Attempts cell: «1», «3», and «2 failed» under it when any failed. */
export const attemptsLabel = (j: Pick<QueueJob, 'attempts' | 'failed_attempts'>) => ({
  text: String(j.attempts),
  note: j.failed_attempts > 0 ? `${j.failed_attempts} failed` : ''
})

/** «340 ms», «8.4 s», «4 min 12 s»; «—» without a number. */
export const formatMs = (ms: number | null | undefined): string =>
  ms === null || ms === undefined || ms < 0 ? '—' : formatDuration(ms, { unit: 'ms', style: 'compact' })

/** The duration bar of a row: % of the slowest job shown, a sliver at least. */
export const durationShare = (ms: number | null, max: number): number => {
  if (ms === null || ms <= 0 || max <= 0) return 0
  return Math.min(100, Math.max(2, Math.round((ms / max) * 100)))
}

export type QueueScaleBar = {
  key: string
  status: QueueDisplayStatus
  tone: CronStatusMeta['tone']
  // % of the scale.
  left: number
  width: number
  label: string
  title: string
}
export type QueueScaleGap = { key: string; left: number; width: number; label: string }

const at = (iso: string | null) => (iso ? Date.parse(iso) : Number.NaN)

/**
 * The attempts on one time scale, from the first start to the last finish:
 * a bar per attempt and the pauses between them. An attempt without times
 * is left out of the scale (its row below still shows it).
 */
export const attemptScale = (list: QueueAttempt[]) => {
  const timed = list
    .map((a) => {
      const start = at(a.started_at)
      let end = at(a.finished_at)
      if (Number.isNaN(end) && !Number.isNaN(start) && a.duration_ms !== null) end = start + a.duration_ms
      return { a, start, end }
    })
    .filter((t) => !Number.isNaN(t.start) && !Number.isNaN(t.end))
  if (!timed.length) return { bars: [] as QueueScaleBar[], gaps: [] as QueueScaleGap[], span: 0 }

  const t0 = Math.min(...timed.map((t) => t.start))
  const t1 = Math.max(...timed.map((t) => t.end))
  const span = Math.max(1, t1 - t0)
  // Two decimals: enough for a bar, and stable to compare.
  const pos = (t: number) => Math.round(((t - t0) / span) * 10_000) / 100
  // A short attempt next to a long pause still gets a visible bar.
  const MIN = 1.5

  const bars: QueueScaleBar[] = timed.map(({ a, start, end }) => {
    const status = attemptStatus(a)
    const left = Math.min(pos(start), 100 - MIN)
    return {
      key: a.transaction_id || `${a.attempt}-${start}`,
      status,
      tone: QUEUE_STATUS[status].tone,
      left,
      width: Math.max(MIN, Math.round((pos(end) - left) * 100) / 100),
      label: `#${a.attempt}`,
      title: `Attempt #${a.attempt} · ${QUEUE_STATUS[status].label} · ${formatMs(a.duration_ms ?? end - start)}`
    }
  })

  const gaps: QueueScaleGap[] = []
  for (let i = 1; i < timed.length; i++) {
    const prev = timed[i - 1]
    const cur = timed[i]
    const ms = cur.a.gap_ms ?? cur.start - prev.end
    if (ms <= 0) continue
    const left = pos(prev.end)
    gaps.push({ key: `gap-${i}`, left, width: Math.max(0, Math.round((pos(cur.start) - left) * 100) / 100), label: formatMs(ms) })
  }
  return { bars, gaps, span }
}

/** «SendInvoice» of «App\Jobs\SendInvoice», and the namespace to show faint. */
export const jobName = (job: string) => {
  const name = job || 'Unnamed job'
  const cut = name.lastIndexOf('\\')
  return cut > 0 ? { short: name.slice(cut + 1), ns: name.slice(0, cut) } : { short: name, ns: '' }
}

/** Times of jobs are shown in the browser's own zone. */
export const localTimeZone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}
