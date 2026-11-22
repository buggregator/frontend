import { describe, expect, it } from 'vitest'
import type { QueueAttempt } from '../../types'
import {
  attemptScale,
  attemptsLabel,
  attemptStatus,
  durationShare,
  formatMs,
  jobName,
  jobStatus,
  QUEUE_STATUS,
  statusLine
} from './queue-status'

const attempt = (n: number, start: string, end: string, over: Partial<QueueAttempt> = {}): QueueAttempt => ({
  transaction_id: `t${n}`,
  trace_id: `tr${n}`,
  attempt: n,
  status: 'internal_error',
  failed: true,
  duration_ms: Date.parse(end) - Date.parse(start),
  latency_ms: 5,
  started_at: start,
  finished_at: end,
  gap_ms: null,
  errors: [],
  ...over
})

describe('jobStatus', () => {
  it.each([
    [{ failed: false, attempts: 1 }, 'done', 'Done'],
    [{ failed: false, attempts: 3 }, 'retried', 'Retried'],
    [{ failed: true, attempts: 1 }, 'failed', 'Failed'],
    [{ failed: true, attempts: 3 }, 'failed', 'Failed']
  ])('%o → %s', (job, status, label) => {
    const s = jobStatus(job)
    expect(s).toBe(status)
    expect(QUEUE_STATUS[s].label).toBe(label)
  })

  it('each status has an icon and a tone, not colour alone', () => {
    expect(QUEUE_STATUS.done).toMatchObject({ icon: '✓', tone: 'ok' })
    expect(QUEUE_STATUS.failed).toMatchObject({ icon: '✕', tone: 'err' })
    expect(QUEUE_STATUS.retried).toMatchObject({ icon: '↻', tone: 'miss' })
  })

  it('an attempt is done or failed', () => {
    expect(attemptStatus({ failed: true })).toBe('failed')
    expect(attemptStatus({ failed: false })).toBe('done')
  })
})

describe('statusLine', () => {
  it.each([
    [{ failed: true, attempts: 3 }, 'Failed after 3 attempts'],
    [{ failed: true, attempts: 1 }, 'Failed'],
    [{ failed: false, attempts: 2 }, 'Done after 2 attempts'],
    [{ failed: false, attempts: 1 }, 'Done']
  ])('%o → %s', (job, line) => {
    expect(statusLine(job)).toBe(line)
  })
})

describe('attemptsLabel', () => {
  it('the number, and how many failed when any', () => {
    expect(attemptsLabel({ attempts: 1, failed_attempts: 0 })).toEqual({ text: '1', note: '' })
    expect(attemptsLabel({ attempts: 3, failed_attempts: 2 })).toEqual({ text: '3', note: '2 failed' })
  })
})

describe('formatMs and durationShare', () => {
  it('compact durations, a dash without one', () => {
    expect(formatMs(340)).toBe('340 ms')
    expect(formatMs(8400)).toBe('8.4 s')
    expect(formatMs(null)).toBe('—')
    expect(formatMs(-1)).toBe('—')
  })

  it('a share of the slowest, a sliver at least, none without a duration', () => {
    expect(durationShare(500, 1000)).toBe(50)
    expect(durationShare(1, 1000)).toBe(2)
    expect(durationShare(null, 1000)).toBe(0)
    expect(durationShare(10, 0)).toBe(0)
  })
})

describe('jobName', () => {
  it('the class name, the namespace apart', () => {
    expect(jobName('App\\Jobs\\SendInvoice')).toEqual({ short: 'SendInvoice', ns: 'App\\Jobs' })
    expect(jobName('send_invoice')).toEqual({ short: 'send_invoice', ns: '' })
    expect(jobName('')).toEqual({ short: 'Unnamed job', ns: '' })
  })
})

describe('attemptScale', () => {
  it('attempts and the pauses between them on one scale', () => {
    const list = [
      attempt(1, '2026-11-21T10:00:00.000Z', '2026-11-21T10:00:01.000Z'),
      attempt(2, '2026-11-21T10:00:10.000Z', '2026-11-21T10:00:11.000Z', { gap_ms: 9000 }),
      attempt(3, '2026-11-21T10:00:19.000Z', '2026-11-21T10:00:20.000Z', { gap_ms: 8000, failed: false, status: 'ok' })
    ]
    const { bars, gaps, span } = attemptScale(list)
    expect(span).toBe(20_000)
    expect(bars.map((b) => [b.label, b.left, b.width, b.tone])).toEqual([
      ['#1', 0, 5, 'err'],
      ['#2', 50, 5, 'err'],
      ['#3', 95, 5, 'ok']
    ])
    expect(gaps.map((g) => [g.left, g.width, g.label])).toEqual([
      [5, 45, '9.0 s'],
      [55, 40, '8.0 s']
    ])
    expect(bars[0].title).toBe('Attempt #1 · Failed · 1.0 s')
  })

  it('a short attempt next to a long pause still shows', () => {
    const { bars } = attemptScale([
      attempt(1, '2026-11-21T10:00:00.000Z', '2026-11-21T10:00:00.010Z'),
      attempt(2, '2026-11-21T10:10:00.000Z', '2026-11-21T10:10:00.010Z', { gap_ms: 599_990 })
    ])
    expect(bars[0].width).toBe(1.5)
    expect(bars[1].left).toBe(98.5)
  })

  it('attempts without times are left out', () => {
    const none = attemptScale([attempt(1, '', '', { started_at: null, finished_at: null })])
    expect(none.bars).toEqual([])
    expect(none.span).toBe(0)
  })
})
