import { mount, RouterLinkStub } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import type { CronMonitor } from '../../types'
import SentryCronTable from './sentry-cron-table.vue'

const push = vi.fn()
const resolve = vi.fn(() => ({ href: '/sentry/crons/backup?project=shop' }))
vi.mock('vue-router', () => ({ useRouter: () => ({ push, resolve }) }))

const now = Date.parse('2026-11-21T14:12:00Z')
const ago = (min: number) => new Date(now - min * 60_000).toISOString()

const monitor = (slug: string, over: Partial<CronMonitor> = {}): CronMonitor => ({
  project: 'shop',
  slug,
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

const render = (monitors: CronMonitor[]) =>
  mount(SentryCronTable, {
    props: { monitors, now },
    global: { stubs: { RouterLink: RouterLinkStub } }
  })

describe('SentryCronTable', () => {
  it('problems first, under their own heading', () => {
    const w = render([
      monitor('horizon-snapshot'),
      monitor('orders-sync', { last_status: 'error', recent: [{ status: 'error', started_at: ago(2) }] })
    ])

    expect(w.get('[data-test="cron-group-attention"]').text()).toContain('Needs attention · 1')
    expect(w.get('[data-test="cron-group-attention"]').text()).toContain('orders-sync')
    expect(w.get('[data-test="cron-group-rest"]').text()).toContain('Running and OK · 1')
    expect(w.findAll('[data-test="cron-row"]').map((r) => r.get('a').text())).toEqual(['orders-sync', 'horizon-snapshot'])
  })

  it('no group heading when nothing needs attention', () => {
    const w = render([monitor('a'), monitor('b')])
    expect(w.find('.cron-table__group').exists()).toBe(false)
  })

  it('a row: status in words, schedule, last and next run, the strip, the source', () => {
    const row = render([monitor('cleanup-tmp', { source: 'ping' })]).get('[data-test="cron-row"]')
    const text = row.text()
    expect(row.get('[data-status]').attributes('data-status')).toBe('ok')
    expect(text).toContain('OK')
    expect(text).toContain('Every 5 minutes')
    expect(text).toContain('*/5 * * * *')
    expect(text).toContain('2 min ago')
    expect(text).toContain('in 3 min')
    expect(text).toContain('1 run, OK')
    expect(text).toContain('ping URL')
  })

  it('the job name is a link to its page, with the project (Tab + Enter open it)', () => {
    const link = render([monitor('backup')]).getComponent(RouterLinkStub)
    expect(link.props('to')).toEqual({ name: 'sentry-cron-job', params: { slug: 'backup' }, query: { project: 'shop' } })
  })

  it('a click anywhere on the row opens the job', async () => {
    push.mockClear()
    const w = render([monitor('backup')])
    await w.get('.cron-table__schedule').trigger('click')
    expect(push).toHaveBeenCalledWith({ name: 'sentry-cron-job', params: { slug: 'backup' }, query: { project: 'shop' } })
  })

  it.each([
    ['Ctrl', { ctrlKey: true }, 'click'],
    ['Cmd', { metaKey: true }, 'click'],
    ['Shift', { shiftKey: true }, 'click'],
    ['the middle button', { button: 1 }, 'auxclick']
  ] as const)('%s on the row opens the job in a new tab, not here', async (_, init, type) => {
    push.mockClear()
    const openTab = vi.spyOn(window, 'open').mockReturnValue(null)
    const w = render([monitor('backup')])
    await w.get('.cron-table__schedule').trigger(type, init)
    expect(push).not.toHaveBeenCalled()
    expect(openTab).toHaveBeenCalledWith('/sentry/crons/backup?project=shop', '_blank', 'noopener')
    openTab.mockRestore()
  })

  it('the right button does nothing', async () => {
    push.mockClear()
    const w = render([monitor('backup')])
    await w.get('.cron-table__schedule').trigger('auxclick', { button: 2 })
    expect(push).not.toHaveBeenCalled()
  })
})
