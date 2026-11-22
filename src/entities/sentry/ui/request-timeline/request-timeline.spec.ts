import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { SentrySpan, SentryTraceDetail } from '../../types'
import RequestTimeline from './request-timeline.vue'

const query = (id: string, at: number): SentrySpan => ({
  span_id: id,
  parent_span_id: 'root',
  op: 'db.sql.query',
  description: 'select * from products where id = ?',
  status: 'ok',
  start_offset_ms: at,
  duration_ms: 4,
  peer_type: 'db',
  peer_address: null,
  is_error: false
})

const ids = Array.from({ length: 6 }, (_, i) => `q${i}`)
const detail: SentryTraceDetail = {
  trace_id: 't1',
  transaction: {
    id: 'tx1',
    transaction_name: 'POST /cart/checkout',
    op: 'http.server',
    status: 'ok',
    start_ts: '2026-11-22T10:00:00.000Z',
    end_ts: '2026-11-22T10:00:00.100Z',
    duration_ms: 100,
    span_id: 'root'
  },
  spans: ids.map((id, i) => query(id, 10 + i * 5)),
  related_errors: [],
  related_log_count: 0,
  n_plus_one: [
    { transaction_id: 'tx1', query: 'select * from products where id = ?', count: 6, total_ms: 24, origin: '', span_ids: ids }
  ]
}

const mountIt = (markersError = '') =>
  mount(RequestTimeline, {
    props: { detail, markers: [{ id: 'm1', lane: 'mail', atMs: 90, label: 'OpsAlert', details: ['To: ops@example.com'] }], markersError },
    global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
    attachTo: document.body
  })

describe('RequestTimeline (#6715)', () => {
  it('shows the summary, the N+1 hint without a missing origin, and one row per item', () => {
    const w = mountIt()
    expect(w.find('[aria-label="What the request did"]').text()).toContain('6 queries · 24 ms')
    const hint = w.find('[data-test="trace-n-plus-one"]').text()
    expect(hint).toContain('6 identical queries')
    expect(hint).toContain('took 24 ms. Load them')
    const cells = (b: ReturnType<typeof w.find>) => b.findAll('span').map((s) => s.text()).join(' | ')
    expect(w.findAll('[data-test="timeline-list"] button').map(cells)).toEqual([
      '0 ms | req | POST /cart/checkout | 100 ms',
      '10 ms | query ×6 | select * from products where id = ? | 24 ms',
      '90 ms | mail | OpsAlert | —'
    ])
    w.unmount()
  })

  it('«Show the queries» opens the N+1 block and focuses its row', async () => {
    const w = mountIt()
    await w.find('[data-test="trace-n-plus-one"] button').trigger('click')
    await flushPromises()
    expect(w.find('[data-test="timeline-details"]').text()).toContain('Run 6 times, 24 ms in total.')
    expect(document.activeElement?.getAttribute('data-test')).toBe('timeline-row-db')
    w.unmount()
  })

  it('a moment shows its lines; closing returns focus to its row', async () => {
    const w = mountIt()
    await w.find('[data-test="timeline-row-mail"]').trigger('click')
    expect(w.find('[data-test="timeline-details"]').text()).toContain('To: ops@example.com')
    await w.find('[aria-label="Close details"]').trigger('click')
    await flushPromises()
    expect(w.find('[data-test="timeline-details"]').exists()).toBe(false)
    expect(document.activeElement?.getAttribute('data-test')).toBe('timeline-row-mail')
    w.unmount()
  })

  it('says when the other modules\' events could not load', () => {
    expect(mountIt('The server answered 500').find('[role="alert"]').text()).toContain('could not load: The server answered 500')
  })
})
