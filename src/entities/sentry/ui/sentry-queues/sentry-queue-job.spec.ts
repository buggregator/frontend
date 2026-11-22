import { mount, RouterLinkStub } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { QueueAttempt, QueueJobDetail } from '../../types'
import SentryQueueJob from './sentry-queue-job.vue'

const now = Date.parse('2026-11-21T14:12:00Z')

const attempt = (n: number, start: string, end: string, over: Partial<QueueAttempt> = {}): QueueAttempt => ({
  transaction_id: `tx${n}`,
  trace_id: `tr${n}`,
  attempt: n,
  status: 'internal_error',
  failed: true,
  duration_ms: Date.parse(end) - Date.parse(start),
  latency_ms: 30,
  started_at: start,
  finished_at: end,
  gap_ms: null,
  errors: [],
  ...over
})

const detail = (over: Partial<QueueJobDetail> = {}): QueueJobDetail => ({
  id: 'm1',
  message_id: 'm1',
  job: 'App\\Jobs\\SendInvoice',
  queue: 'emails',
  connection: 'redis',
  status: 'internal_error',
  failed: true,
  attempts: 3,
  failed_attempts: 3,
  retried: true,
  duration_ms: 1000,
  latency_ms: 30,
  started_at: '2026-11-21T14:00:00.000Z',
  finished_at: '2026-11-21T14:00:20.000Z',
  trace_id: 'tr3',
  transaction_id: 'tx3',
  project: 'shop',
  attempt_list: [
    attempt(1, '2026-11-21T14:00:00.000Z', '2026-11-21T14:00:01.000Z', {
      errors: [{ id: 'e1', exception_type: 'RuntimeException', exception_value: 'SMTP down', event_ts: '' }]
    }),
    attempt(2, '2026-11-21T14:00:10.000Z', '2026-11-21T14:00:11.000Z', { gap_ms: 9000 }),
    attempt(3, '2026-11-21T14:00:19.000Z', '2026-11-21T14:00:20.000Z', { gap_ms: 8000 })
  ],
  dispatched_by: { transaction_id: 'req', trace_id: 'tr0', transaction_name: 'POST /invoices', start_ts: null },
  ...over
})

const render = (job = detail()) =>
  mount(SentryQueueJob, { props: { job, now }, global: { stubs: { RouterLink: RouterLinkStub } } })

const links = (w: ReturnType<typeof render>) => w.findAllComponents(RouterLinkStub).map((l) => [l.text(), l.props('to')])

describe('SentryQueueJob', () => {
  it('the header: name, status in words, queue and connection', () => {
    const w = render()
    expect(w.get('h2').text()).toBe('SendInvoice')
    expect(w.get('[data-test="queue-headline"]').text()).toBe('✕Failed after 3 attempts')
    expect(w.get('.queue-job__meta').text()).toContain('emails · redis')
    expect(w.get('.queue-job__kpis').text()).toContain('3 · 3 failed')
  })

  it('«Dispatched from» links the request trace; says so when unknown', () => {
    expect(links(render())).toContainEqual([
      'POST /invoices',
      { name: 'sentry-trace-detail', params: { traceId: 'tr0' } }
    ])
    expect(render(detail({ dispatched_by: null })).get('[data-test="queue-dispatched"]').text()).toContain('not known')
  })

  it('the attempts on a scale, the pauses between them, each with its trace and exception', () => {
    const w = render()
    expect(w.findAll('.queue-job__bar')).toHaveLength(3)
    expect(w.findAll('.queue-job__gap').map((g) => g.text())).toEqual(['9.0 s', '8.0 s'])
    expect(w.findAll('[data-test="queue-pause"]').map((p) => p.text())).toEqual([
      'paused 9.0 s before this attempt',
      'paused 8.0 s before this attempt'
    ])
    const all = links(w)
    expect(all).toContainEqual(['Trace of attempt #2', { name: 'sentry-trace-detail', params: { traceId: 'tr2' } }])
    expect(all).toContainEqual(['RuntimeException: SMTP down', { name: 'sentry-exception-detail', params: { id: 'e1' } }])
    // A failed attempt without a stored exception says so.
    expect(w.findAll('[data-test="queue-attempt"]')[1].text()).toContain('No exception of this attempt was stored.')
  })

  it('one attempt: no scale', () => {
    const w = render(
      detail({
        failed: false, status: 'ok', attempts: 1, failed_attempts: 0,
        attempt_list: [attempt(1, '2026-11-21T14:00:00.000Z', '2026-11-21T14:00:01.000Z', { failed: false, status: 'ok' })]
      })
    )
    expect(w.find('[data-test="queue-scale"]').exists()).toBe(false)
    expect(w.get('[data-test="queue-headline"]').text()).toBe('✓Done')
  })

  it('says what Buggregator does not do and what Sentry does not send', () => {
    const w = render()
    expect(w.get('[data-test="queue-retry-note"]').text()).toContain(
      'Retries are run by your queue worker. Buggregator shows them; it does not retry jobs.'
    )
    expect(w.text()).toContain('Sentry does not send the job payload.')
  })
})
