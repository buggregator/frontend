import { formatDuration } from '@/shared/lib/formats/format-duration'
import type { CronCheckIn, CronMonitor, CronRunStatus } from '../../types'
import { formatClock, formatRelative } from './cron-format'

// Statuses of cron monitors and their runs (#6617): an icon and a word,
// colour only on top. «late» is the client's own: the expected run is past
// its margin and the server's checker (every 30 s) has not marked it yet.

export type CronDisplayStatus =
  | 'ok'
  | 'failed'
  | 'timeout'
  | 'missed'
  | 'late'
  | 'unknown'
  | 'running'
  | 'waiting'

export type CronTone = 'ok' | 'err' | 'miss' | 'run' | 'wait'

// How a status shows: also the queue jobs' statuses (#6713) use it.
export type CronStatusMeta = { icon: string; label: string; tone: CronTone; hint: string }

export const CRON_STATUS: Record<CronDisplayStatus, CronStatusMeta> = {
  ok: { icon: '✓', label: 'OK', tone: 'ok', hint: 'The run finished without an error' },
  failed: { icon: '✕', label: 'Failed', tone: 'err', hint: 'The job reported a failure' },
  timeout: { icon: '⏱', label: 'Timed out', tone: 'err', hint: 'Started and did not finish within its max runtime' },
  missed: { icon: '!', label: 'Missed', tone: 'miss', hint: 'No check-in came within the margin' },
  late: { icon: '!', label: 'Late', tone: 'miss', hint: 'The expected run is past its margin with no check-in yet' },
  unknown: {
    icon: '?',
    label: 'Missed?',
    tone: 'wait',
    hint: 'Buggregator was not running at that time, so this may not be a real miss'
  },
  running: { icon: '◷', label: 'Running', tone: 'run', hint: 'Started, not finished yet' },
  waiting: { icon: '○', label: 'Waiting', tone: 'wait', hint: 'No check-in yet' }
}

const RUN_STATUS: Record<CronRunStatus, CronDisplayStatus> = {
  ok: 'ok',
  error: 'failed',
  timeout: 'timeout',
  missed: 'missed',
  unknown: 'unknown',
  in_progress: 'running'
}

/** The display status of one run. */
export const runStatus = (status: CronRunStatus | string): CronDisplayStatus =>
  RUN_STATUS[status as CronRunStatus] ?? 'unknown'

/** The expected run is past its margin and no check-in has come. */
export const isLate = (m: CronMonitor, now: number): boolean => {
  if (m.last_status === 'in_progress' || !m.next_expected_at) return false
  const slot = Date.parse(m.next_expected_at)
  return !Number.isNaN(slot) && now > slot + m.checkin_margin * 60_000
}

export const monitorStatus = (m: CronMonitor, now: number): CronDisplayStatus => {
  if (m.last_status === 'in_progress') return 'running'
  if (isLate(m, now)) return 'late'
  if (!m.last_status) return 'waiting'
  return runStatus(m.last_status)
}

const ATTENTION: readonly CronDisplayStatus[] = ['failed', 'timeout', 'missed', 'late']

export const needsAttention = (status: CronDisplayStatus) => ATTENTION.includes(status)

/** Problems first; the server's order (project, slug) inside each group. */
export const groupMonitors = (list: CronMonitor[], now: number) => {
  const attention: CronMonitor[] = []
  const rest: CronMonitor[] = []
  for (const m of list) (needsAttention(monitorStatus(m, now)) ? attention : rest).push(m)
  return { attention, rest }
}

/** «10 jobs · 3 need attention · 1 running · 6 OK». */
export const summarizeMonitors = (list: CronMonitor[], now: number) => {
  let attention = 0
  let running = 0
  let ok = 0
  for (const m of list) {
    const s = monitorStatus(m, now)
    if (needsAttention(s)) attention++
    else if (s === 'running') running++
    else if (s === 'ok') ok++
  }
  return { total: list.length, attention, running, ok }
}

export type CronStripCell = { key: string; status: CronDisplayStatus; tone: CronTone; title: string }

/** The recent-runs strip, oldest first, and its line: «2 failed, 1 missed of last 20». */
export const historyStrip = (m: CronMonitor, now: number) => {
  const runs = [...m.recent].reverse()
  const cells: CronStripCell[] = runs.map((r, i) => {
    const status = runStatus(r.status)
    return {
      key: `${r.started_at}-${i}`,
      status,
      tone: CRON_STATUS[status].tone,
      title: `${CRON_STATUS[status].label} · ${formatClock(r.started_at, m.timezone, now)}`
    }
  })
  const n = cells.length
  const count = (s: CronDisplayStatus) => cells.filter((c) => c.status === s).length
  const parts = [
    [count('failed'), 'failed'],
    [count('timeout'), 'timed out'],
    [count('missed'), 'missed']
  ]
    .filter(([c]) => (c as number) > 0)
    .map(([c, w]) => `${c} ${w}`)

  let summary: string
  if (n === 0) summary = 'no runs yet'
  else if (parts.length) summary = `${parts.join(', ')} of last ${n}`
  else if (count('ok') === n) summary = n === 1 ? '1 run, OK' : `${n} runs, all OK`
  else summary = `${n} ${n === 1 ? 'run' : 'runs'}, no failures`

  return { cells, summary, bad: parts.length > 0 }
}

/** «Last run»: when, and a short note under it. */
export const lastRun = (m: CronMonitor, now: number) => {
  const last = m.recent[0]
  if (!last) return { when: 'never', note: 'waiting for the first check-in', bad: false }
  const status = runStatus(last.status)
  const rel = formatRelative(last.started_at, now)
  switch (status) {
    case 'running':
      return { when: `started ${rel}`, note: `max ${m.max_runtime} min`, bad: false }
    case 'timeout':
      return { when: `started ${rel}`, note: `no finish within ${m.max_runtime} min`, bad: true }
    case 'failed':
      return { when: rel, note: 'reported a failure', bad: true }
    case 'missed':
      return { when: `expected ${rel}`, note: 'no check-in', bad: true }
    case 'unknown':
      return { when: `expected ${rel}`, note: 'Buggregator was down', bad: false }
    default:
      return { when: rel, note: m.source === 'ping' ? 'ping' : 'finished', bad: false }
  }
}

/** «Next»: «in 3 min», «due 2 min ago»; the clock in the title. */
export const nextRun = (m: CronMonitor, now: number) => {
  if (!m.schedule || !m.schedule.type) return { text: 'no schedule', clock: '' }
  if (!m.next_expected_at) return { text: '—', clock: '' }
  const at = Date.parse(m.next_expected_at)
  const rel = formatRelative(m.next_expected_at, now)
  return {
    text: at < now ? `due ${rel}` : rel,
    clock: formatClock(m.next_expected_at, m.timezone, now)
  }
}

const lastLine = (body: string) => {
  const lines = body.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  const line = lines[lines.length - 1] ?? ''
  return line.length > 200 ? `${line.slice(0, 199)}…` : line
}

/** «What happened» of one check-in row. */
export const checkInNote = (c: CronCheckIn, m: CronMonitor, now: number): string => {
  switch (runStatus(c.status)) {
    case 'failed':
      return lastLine(c.body) || 'The job reported a failure'
    case 'timeout':
      return `No finish within the max runtime of ${m.max_runtime} min`
    case 'missed': {
      const slot = Date.parse(c.expected_at ?? c.started_at)
      const by = Number.isNaN(slot) ? '' : new Date(slot + m.checkin_margin * 60_000).toISOString()
      return by ? `No check-in by ${formatClock(by, m.timezone, now)}` : 'No check-in'
    }
    case 'unknown':
      return 'Buggregator was not running at that time, so this may not be a real miss'
    case 'running':
      return `Running, max ${m.max_runtime} min`
    default:
      return lastLine(c.body)
  }
}

/** The four numbers of the job page, from the loaded check-ins. */
export const runStats = (checkins: CronCheckIn[]) => {
  // A run not finished yet, or a slot of unknown fate («Missed?»: Buggregator
  // was down), is neither OK nor not: left out of the count.
  const done = checkins.filter((c) => c.status !== 'in_progress' && c.status !== 'unknown')
  const ok = done.filter((c) => c.status === 'ok').length
  const durations = checkins
    .filter((c) => (c.status === 'ok' || c.status === 'error') && c.duration_ms !== null)
    .map((c) => c.duration_ms as number)
    .sort((a, b) => a - b)
  const median = durations.length ? durations[Math.floor((durations.length - 1) / 2)] : null
  const slowest = durations.length ? durations[durations.length - 1] : null
  return { ok, total: done.length, median, slowest }
}

export type CronBar = {
  key: string
  status: CronDisplayStatus
  tone: CronTone
  // % of the tallest bar; null draws a hollow box (no run). A run without
  // a duration (a single ping) is a short stub.
  height: number | null
  title: string
}

/** Bars of the newest `size` runs, oldest first: height = duration. */
export const durationBars = (checkins: CronCheckIn[], m: CronMonitor, now: number, size = 24): CronBar[] => {
  const runs = checkins.slice(0, size).reverse()
  const max = Math.max(1, ...runs.map((c) => c.duration_ms ?? 0))
  return runs.map((c) => {
    const status = runStatus(c.status)
    const noRun = status === 'missed' || status === 'unknown'
    const when = formatClock(c.started_at, m.timezone, now)
    let height: number | null = null
    if (!noRun) height = c.duration_ms === null ? 8 : Math.max(4, Math.round((c.duration_ms / max) * 100))
    let duration = ''
    if (!noRun && status !== 'running') duration = c.duration_ms === null ? ' · no duration' : ` · ${formatDuration(c.duration_ms, { unit: 'ms', style: 'compact' })}`
    return {
      key: c.id,
      status,
      tone: CRON_STATUS[status].tone,
      height,
      title: `${when} · ${CRON_STATUS[status].label}${duration}`
    }
  })
}

export type CronExplain = { tone: CronTone; title: string; text: string }

/** The framed line on top of the job page; null when all is well. */
export const explainMonitor = (m: CronMonitor, now: number): CronExplain | null => {
  const status = monitorStatus(m, now)
  const last = m.recent[0]
  const rel = last ? formatRelative(last.started_at, now) : ''
  const at = last ? formatClock(last.started_at, m.timezone, now) : ''
  switch (status) {
    case 'failed': {
      const recent = m.recent.slice(0, 5)
      const failed = recent.filter((r) => r.status === 'error').length
      return {
        tone: 'err',
        title: `Last run failed ${rel}.`,
        text:
          recent.length > 1
            ? `${failed} of the last ${recent.length} runs failed. The reason is in the check-ins below.`
            : 'The reason is in the check-ins below.'
      }
    }
    case 'timeout':
      return {
        tone: 'err',
        title: `The run started ${rel} did not finish.`,
        text: `It sent no finish within the max runtime of ${m.max_runtime} min: it hung, or died without a word.`
      }
    case 'missed':
      return {
        tone: 'miss',
        title: `Missed the run expected at ${at}.`,
        text: `No check-in came within the ${m.checkin_margin} min margin while Buggregator was running, so the job did not start, or its check-in did not reach Buggregator. Check the scheduler and the DSN / ping URL.`
      }
    case 'late':
      return {
        tone: 'miss',
        title: `The run expected at ${formatClock(m.next_expected_at, m.timezone, now)} has not checked in.`,
        text: `Its ${m.checkin_margin} min margin has passed: it will be marked missed shortly.`
      }
    case 'unknown':
      return {
        tone: 'wait',
        title: `The run expected at ${at} is unknown.`,
        text: 'Buggregator was not running at that time, so this may not be a real miss.'
      }
    case 'waiting':
      return {
        tone: 'wait',
        title: 'Waiting for the first check-in.',
        text: 'The job shows its runs here after it first reports.'
      }
    default:
      return null
  }
}
