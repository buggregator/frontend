import { describe, expect, it } from 'vitest'
import { RouteName, type ServerEvent } from '@/shared/types'
import { traceMarkers } from './trace-markers'

const START = '2026-11-22T10:00:00.000Z'
const at = (ms: number) => Date.parse(START) / 1000 + ms / 1000

const event = (type: string, payload: object, ms: number): ServerEvent<unknown> => ({
  uuid: `${type}-1`,
  type,
  payload,
  project: null,
  timestamp: at(ms)
})

describe('traceMarkers', () => {
  it('places a Monolog record by its own datetime, with its level as tone', () => {
    const [m] = traceMarkers(
      START,
      [event('monolog', { level_name: 'ERROR', message: 'OrderFailed', channel: 'app', datetime: '2026-11-22T10:00:00.362Z' }, 400)],
      [],
      []
    )
    expect(m).toMatchObject({
      lane: 'logs',
      atMs: 362,
      label: 'ERROR OrderFailed',
      tone: 'error',
      details: ['Monolog · app'],
      to: { name: RouteName.EventPage, params: { type: 'monolog', id: 'monolog-1' } }
    })
  })

  it('places a mail and an HTTP dump by the time they were received', () => {
    const [mail, dump] = traceMarkers(
      START,
      [
        event('smtp', { subject: 'OpsAlert', to: [{ email: 'ops@example.com' }], from: [{ name: 'Shop', email: 'shop@example.com' }] }, 366),
        event('http-dump', { request: { method: 'POST', uri: '/hook' } }, 20)
      ],
      [],
      []
    )
    expect(mail).toMatchObject({ lane: 'mail', label: 'OpsAlert → ops@example.com', details: ['From: Shop <shop@example.com>', 'To: ops@example.com'] })
    expect(mail.atMs).toBeCloseTo(366, 0)
    expect(dump).toMatchObject({ lane: 'dumps', label: 'POST /hook' })
  })

  it('adds the trace errors and Sentry logs', () => {
    const markers = traceMarkers(
      START,
      [],
      [{ id: 'e1', exception_type: 'OrderFailedException', received_at: '2026-11-22T10:00:00.364Z' }],
      [{ id: 'l1', level: 'warn', body: 'slow', severity_number: null, trace_id: 't', span_id: null, log_ts: '2026-11-22T10:00:00.010Z', attributes: null }]
    )
    expect(markers).toMatchObject([
      { lane: 'events', atMs: 364, tone: 'error', label: 'OrderFailedException', to: { name: RouteName.SentryExceptionDetail, params: { id: 'e1' } } },
      { lane: 'logs', atMs: 10, tone: 'warning', label: 'WARN slow' }
    ])
  })
})
