import { describe, expect, it } from 'vitest'
import type { CronCheckIn, CronMonitor, CronRunStatus } from '../../types'
import {
  checkInNote,
  durationBars,
  explainMonitor,
  groupMonitors,
  historyStrip,
  isLate,
  lastRun,
  monitorStatus,
  needsAttention,
  nextRun,
  runStats,
  runStatus,
  summarizeMonitors
} from './cron-status'

const now = Date.parse('2026-11-21T14:12:00Z')
const ago = (min: number) => new Date(now - min * 60_000).toISOString()

const monitor = (over: Partial<CronMonitor> = {}): CronMonitor => ({
  project: 'default',
  slug: 'orders-sync',
  source: 'sentry',
  schedule: { type: 'crontab', value: '*/5 * * * *' },
  timezone: 'UTC',
  checkin_margin: 1,
  max_runtime: 30,
  last_status: 'ok',
  last_checkin_at: ago(2),
  next_expected_at: ago(-3),
  created_at: ago(600),
  recent: [{ status: 'ok', started_at: ago(2) }],
  ...over
})

const checkIn = (over: Partial<CronCheckIn> = {}): CronCheckIn => ({
  id: Math.random().toString(16).slice(2),
  status: 'ok',
  started_at: ago(5),
  finished_at: ago(4),
  duration_ms: 2000,
  environment: 'local',
  trace_id: '',
  source: 'sentry',
  body: '',
  server_made: false,
  expected_at: null,
  ...over
})

describe('monitorStatus', () => {
  it.each<[CronRunStatus | '', string]>([
    ['ok', 'ok'],
    ['error', 'failed'],
    ['timeout', 'timeout'],
    ['missed', 'missed'],
    ['unknown', 'unknown'],
    ['in_progress', 'running'],
    ['', 'waiting']
  ])('last %s → %s', (last, shown) => {
    expect(monitorStatus(monitor({ last_status: last }), now)).toBe(shown)
  })

  it('late: the expected run is past its margin, the server has not marked it yet', () => {
    const m = monitor({ next_expected_at: ago(2), checkin_margin: 1 })
    expect(isLate(m, now)).toBe(true)
    expect(monitorStatus(m, now)).toBe('late')
  })

  it('not late inside the margin, nor while a run is going', () => {
    expect(isLate(monitor({ next_expected_at: ago(0.5), checkin_margin: 1 }), now)).toBe(false)
    expect(isLate(monitor({ next_expected_at: ago(10), last_status: 'in_progress' }), now)).toBe(false)
    expect(isLate(monitor({ next_expected_at: null }), now)).toBe(false)
  })

  it('an unknown run status shows as unknown', () => {
    expect(runStatus('weird')).toBe('unknown')
  })
})

describe('groups and summary', () => {
  const list = [
    monitor({ slug: 'a' }),
    monitor({ slug: 'b', last_status: 'error' }),
    monitor({ slug: 'c', last_status: 'in_progress' }),
    monitor({ slug: 'd', last_status: 'missed' }),
    monitor({ slug: 'e', last_status: 'unknown' }),
    monitor({ slug: 'f', last_status: '', recent: [] })
  ]

  it('problems first, the server order inside', () => {
    const { attention, rest } = groupMonitors(list, now)
    expect(attention.map((m) => m.slug)).toEqual(['b', 'd'])
    expect(rest.map((m) => m.slug)).toEqual(['a', 'c', 'e', 'f'])
  })

  it('counts', () => {
    expect(summarizeMonitors(list, now)).toEqual({ total: 6, attention: 2, running: 1, ok: 1 })
  })

  it('«Missed?» (Buggregator was down) is not a problem of the job', () => {
    expect(needsAttention('unknown')).toBe(false)
    expect(needsAttention('late')).toBe(true)
  })
})

describe('historyStrip', () => {
  it('oldest first, with the count of bad runs', () => {
    const m = monitor({
      recent: [
        { status: 'error', started_at: ago(1) },
        { status: 'missed', started_at: ago(6) },
        { status: 'ok', started_at: ago(11) },
        { status: 'error', started_at: ago(16) }
      ]
    })
    const { cells, summary, bad } = historyStrip(m, now)
    expect(cells.map((c) => c.tone)).toEqual(['err', 'ok', 'miss', 'err'])
    expect(cells[3].title).toBe('Failed · 14:11')
    expect(summary).toBe('2 failed, 1 missed of last 4')
    expect(bad).toBe(true)
  })

  it('all OK, one run, none', () => {
    const two = [{ status: 'ok' as const, started_at: ago(1) }, { status: 'ok' as const, started_at: ago(6) }]
    expect(historyStrip(monitor({ recent: two }), now).summary).toBe('2 runs, all OK')
    expect(historyStrip(monitor({ recent: two.slice(0, 1) }), now).summary).toBe('1 run, OK')
    expect(historyStrip(monitor({ recent: [] }), now).summary).toBe('no runs yet')
    expect(historyStrip(monitor({ recent: [{ status: 'in_progress', started_at: ago(1) }, two[0]] }), now).summary).toBe(
      '2 runs, no failures'
    )
  })
})

describe('lastRun and nextRun', () => {
  it('last run: when and a note', () => {
    expect(lastRun(monitor(), now)).toEqual({ when: '2 min ago', note: 'finished', bad: false })
    expect(lastRun(monitor({ source: 'ping' }), now).note).toBe('ping')
    expect(lastRun(monitor({ recent: [{ status: 'timeout', started_at: ago(300) }] }), now)).toEqual({
      when: 'started 5 h ago',
      note: 'no finish within 30 min',
      bad: true
    })
    expect(lastRun(monitor({ recent: [] }), now).when).toBe('never')
  })

  it('next run: in, due, none', () => {
    expect(nextRun(monitor(), now)).toEqual({ text: 'in 3 min', clock: '14:15' })
    expect(nextRun(monitor({ next_expected_at: ago(2) }), now).text).toBe('due 2 min ago')
    expect(nextRun(monitor({ schedule: null, next_expected_at: null }), now).text).toBe('no schedule')
  })
})

describe('check-ins', () => {
  const m = monitor({ checkin_margin: 5, max_runtime: 30 })

  it('what happened', () => {
    expect(checkInNote(checkIn({ status: 'error', body: 'step 1\ncURL error 28: timed out\n' }), m, now)).toBe(
      'cURL error 28: timed out'
    )
    expect(checkInNote(checkIn({ status: 'error' }), m, now)).toBe('The job reported a failure')
    expect(checkInNote(checkIn({ status: 'timeout' }), m, now)).toBe('No finish within the max runtime of 30 min')
    expect(
      checkInNote(checkIn({ status: 'missed', server_made: true, expected_at: '2026-11-21T02:30:00.000Z' }), m, now)
    ).toBe('No check-in by 02:35')
    expect(checkInNote(checkIn({ status: 'unknown' }), m, now)).toContain('may not be a real miss')
    expect(checkInNote(checkIn({ status: 'ok' }), m, now)).toBe('')
  })

  it('stats: OK of finished runs, median and slowest duration', () => {
    const stats = runStats([
      checkIn({ duration_ms: 1000 }),
      checkIn({ duration_ms: 3000 }),
      checkIn({ status: 'error', duration_ms: 8000 }),
      checkIn({ status: 'missed', duration_ms: null }),
      checkIn({ status: 'in_progress', duration_ms: null }),
      checkIn({ status: 'unknown', duration_ms: null })
    ])
    // A «Missed?» slot (Buggregator was down) counts neither way.
    expect(stats).toEqual({ ok: 2, total: 4, median: 3000, slowest: 8000 })
    expect(runStats([])).toEqual({ ok: 0, total: 0, median: null, slowest: null })
  })

  it('bars: oldest first, height of the slowest, hollow without a run, a stub without a duration', () => {
    const bars = durationBars(
      [
        checkIn({ status: 'error', duration_ms: null }),
        checkIn({ duration_ms: 1000 }),
        checkIn({ status: 'missed', duration_ms: null }),
        checkIn({ duration_ms: 4000 })
      ],
      m,
      now
    )
    expect(bars.map((b) => b.height)).toEqual([100, null, 25, 8])
    expect(bars[1].tone).toBe('miss')
    expect(bars[3]).toMatchObject({ tone: 'err', title: expect.stringContaining('Failed · no duration') })
    expect(bars[2].title).toContain('OK · 1.0 s')
  })
})

describe('explainMonitor', () => {
  it('nothing when all is well', () => {
    expect(explainMonitor(monitor(), now)).toBeNull()
  })

  it('failed: how many of the last runs', () => {
    const e = explainMonitor(
      monitor({
        last_status: 'error',
        recent: [
          { status: 'error', started_at: ago(2) },
          { status: 'ok', started_at: ago(7) },
          { status: 'error', started_at: ago(12) }
        ]
      }),
      now
    )
    expect(e).toMatchObject({ tone: 'err', title: 'Last run failed 2 min ago.' })
    expect(e?.text).toContain('2 of the last 3 runs failed')
  })

  it('missed and unknown are told apart', () => {
    const missed = explainMonitor(
      monitor({ last_status: 'missed', recent: [{ status: 'missed', started_at: '2026-11-21T02:30:00.000Z' }] }),
      now
    )
    expect(missed).toMatchObject({ tone: 'miss', title: 'Missed the run expected at 02:30.' })
    // Honest: the run may have happened with its check-in lost on the way.
    expect(missed?.text).toContain('or its check-in did not reach Buggregator')
    expect(missed?.text).toContain('Check the scheduler and the DSN / ping URL.')
    const unknown = explainMonitor(
      monitor({ last_status: 'unknown', recent: [{ status: 'unknown', started_at: '2026-11-21T02:30:00.000Z' }] }),
      now
    )
    expect(unknown?.text).toContain('not running')
  })

  it('timeout, late, waiting', () => {
    expect(explainMonitor(monitor({ last_status: 'timeout' }), now)?.text).toContain('30 min')
    expect(explainMonitor(monitor({ next_expected_at: ago(3) }), now)?.title).toContain('has not checked in')
    expect(explainMonitor(monitor({ last_status: '', recent: [] }), now)?.title).toBe('Waiting for the first check-in.')
  })
})
