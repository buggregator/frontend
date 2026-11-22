import { mount, RouterLinkStub } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import type { QueueJob } from '../../types'
import SentryQueueTable from './sentry-queue-table.vue'

const push = vi.fn()
const resolve = vi.fn(() => ({ href: '/sentry/queues/m1' }))
vi.mock('vue-router', () => ({ useRouter: () => ({ push, resolve }) }))

const now = Date.parse('2026-11-21T14:12:00Z')
const ago = (min: number) => new Date(now - min * 60_000).toISOString()

const job = (id: string, over: Partial<QueueJob> = {}): QueueJob => ({
  id,
  message_id: id,
  job: 'App\\Jobs\\SendInvoice',
  queue: 'emails',
  connection: 'redis',
  status: 'ok',
  failed: false,
  attempts: 1,
  failed_attempts: 0,
  retried: false,
  duration_ms: 400,
  latency_ms: 20,
  started_at: ago(3),
  finished_at: ago(2),
  trace_id: 'tr',
  transaction_id: 'tx',
  project: 'shop',
  ...over
})

const render = (jobs: QueueJob[]) =>
  mount(SentryQueueTable, { props: { jobs, now }, global: { stubs: { RouterLink: RouterLinkStub } } })

describe('SentryQueueTable', () => {
  it('a row: class name, status in words, queue chip, attempts, duration, finished', () => {
    const row = render([job('m1')]).get('[data-test="queue-row"]')
    const text = row.text()
    expect(row.get('a').text()).toBe('SendInvoice')
    expect(text).toContain('App\\Jobs')
    expect(row.get('[data-status]').text()).toContain('Done')
    expect(row.get('.queue-table__chip').text()).toBe('emails')
    expect(text).toContain('400 ms')
    expect(text).toContain('2 min ago')
  })

  it('failed and retried jobs: the word, the icon, how many attempts failed', () => {
    const w = render([
      job('a', { failed: true, status: 'internal_error', attempts: 3, failed_attempts: 3 }),
      job('b', { attempts: 2, failed_attempts: 1, retried: true })
    ])
    const [a, b] = w.findAll('[data-test="queue-row"]')
    expect(a.get('[data-status]').text()).toBe('✕Failed')
    expect(a.get('.queue-table__attempts').text()).toBe('33 failed')
    expect(b.get('[data-status]').text()).toBe('↻Retried')
    expect(b.get('.queue-table__attempts').text()).toBe('21 failed')
  })

  it('the duration bar is a share of the slowest job shown', () => {
    const w = render([job('a', { duration_ms: 1000 }), job('b', { duration_ms: 250 }), job('c', { duration_ms: null })])
    const widths = w.findAll('.queue-table__bar').map((b) => b.attributes('style'))
    expect(widths).toEqual(['width: 100%;', 'width: 25%;', 'width: 0%;'])
    expect(w.findAll('[data-test="queue-row"]')[2].text()).toContain('—')
  })

  it('the job name is a link to its page (Tab + Enter open it)', () => {
    const link = render([job('m1')]).getComponent(RouterLinkStub)
    expect(link.props('to')).toEqual({ name: 'sentry-queue-job', params: { id: 'm1' } })
  })

  it('a click anywhere on the row opens the job; Ctrl opens a new tab', async () => {
    push.mockClear()
    const w = render([job('m1')])
    await w.get('.queue-table__duration').trigger('click')
    expect(push).toHaveBeenCalledWith({ name: 'sentry-queue-job', params: { id: 'm1' } })

    push.mockClear()
    const openTab = vi.spyOn(window, 'open').mockReturnValue(null)
    await w.get('.queue-table__duration').trigger('click', { ctrlKey: true })
    expect(push).not.toHaveBeenCalled()
    expect(openTab).toHaveBeenCalledWith('/sentry/queues/m1', '_blank', 'noopener')
    openTab.mockRestore()
  })
})
