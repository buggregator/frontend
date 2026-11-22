import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SentryLog } from '../../types'
import TraceRelatedLogs from './trace-related-logs.vue'

const getLogs = vi.fn()
vi.mock('../../lib/use-sentry-requests', () => ({
  useSentryRequests: () => ({ getTraceLogs: (trace_id: string, page: number) => getLogs({ trace_id, page: String(page) }) })
}))

const log = (id: string, ts: string, span_id: string | null, over: Partial<SentryLog> = {}): SentryLog => ({
  id,
  level: 'info',
  severity_number: 9,
  body: `body ${id}`,
  trace_id: 't1',
  trace_exists: true,
  span_id,
  service_name: 'checkout-api',
  log_ts: `2026-11-20T10:00:0${ts}Z`,
  attributes: { 'http.route': '/orders' },
  ...over
})

const render = () =>
  mount(TraceRelatedLogs, {
    props: { traceId: 't1', spanIds: new Set(['s1']) },
    global: { stubs: { RouterLink: true } }
  })

describe('TraceRelatedLogs (#6533 related-logs)', () => {
  beforeEach(() => getLogs.mockReset())

  it('lists the trace logs oldest first, with level, service and body; expands attributes', async () => {
    getLogs.mockResolvedValue({ data: [log('b', '2', 's1'), log('a', '1', null, { level: 'error' })], meta: { total: 2 } })
    const w = render()
    await flushPromises()
    expect(getLogs).toHaveBeenCalledWith({ trace_id: 't1', page: '1' })
    const rows = w.findAll('.log-row')
    expect(rows.map((r) => r.find('.log-row__body').text())).toEqual(['body a', 'body b'])
    expect(rows[0].text()).toContain('ERROR')
    expect(rows[0].text()).toContain('checkout-api')
    await rows[0].get('[data-test="expandable-row-toggle"]').trigger('keydown', { key: 'Enter' })
    expect(w.text()).toContain('http.route')
    expect(w.find('[data-test="trace-logs-more"]').exists()).toBe(false)
  })

  it('«span →» only for a span of this trace, and it asks for that span; no link to the same trace', async () => {
    getLogs.mockResolvedValue({ data: [log('a', '1', 's1'), log('b', '2', 'elsewhere')], meta: { total: 2 } })
    const w = render()
    await flushPromises()
    const buttons = w.findAll('[data-test="log-span"]')
    expect(buttons).toHaveLength(1)
    await buttons[0].trigger('click')
    expect(w.emitted('span')).toEqual([['s1']])
    expect(w.find('routerlink-stub').exists()).toBe(false)
  })

  it('loads the next page on demand', async () => {
    getLogs
      .mockResolvedValueOnce({ data: [log('a', '1', null)], meta: { total: 2 } })
      .mockResolvedValueOnce({ data: [log('b', '2', null)], meta: { total: 2 } })
    const w = render()
    await flushPromises()
    await w.get('[data-test="trace-logs-more"]').trigger('click')
    await flushPromises()
    expect(getLogs).toHaveBeenLastCalledWith({ trace_id: 't1', page: '2' })
    expect(w.findAll('.log-row')).toHaveLength(2)
    expect(w.find('[data-test="trace-logs-more"]').exists()).toBe(false)
  })

  it('says so on an error and retries', async () => {
    getLogs.mockRejectedValueOnce(new Error('Request failed: 500')).mockResolvedValueOnce({ data: [], meta: { total: 0 } })
    const w = render()
    await flushPromises()
    expect(w.text()).toContain('Could not load the logs')
    await w.get('.trace-logs__link').trigger('click')
    await flushPromises()
    expect(w.text()).toContain('No logs for this trace.')
  })
})
