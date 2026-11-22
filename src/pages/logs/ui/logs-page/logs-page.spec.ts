import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { useEventsStore, useSettingsStore } from '@/shared/stores'
import { RouteName } from '@/shared/types'
import { logLine } from '../../lib/test-utils'
import LogsPage from './logs-page.vue'

vi.mock('@/widgets/ui', () => ({
  LayoutBase: { template: '<div><slot name="header" /><slot /></div>' },
  LayoutSidebar: { template: '<nav />' },
  SetupHelpButton: { template: '<button data-test="setup-help">How to set up</button>' },
  useSetupValues: () => ({ values: computed(() => ({ host: 'localhost', monolog_port: '9913' })) })
}))

const json = (body: unknown, status = 200) =>
  Promise.resolve(
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
  )

type Reply = {
  list?: unknown[]
  facets?: unknown
  base?: unknown
  any?: unknown[]
  status?: number
}

describe('LogsPage', () => {
  let reply: Reply
  const fetchMock = vi.fn((url: string) => {
    const u = new URL(url, 'http://x')
    if (reply.status) return json({}, reply.status)
    const narrowed =
      u.searchParams.has('q') || u.searchParams.has('level') || u.searchParams.has('channel')
    if (u.pathname.endsWith('/facets'))
      return json({ data: narrowed ? reply.facets : (reply.base ?? reply.facets) })
    if (u.pathname.endsWith('/histogram')) return json({ bucket: 60, data: [] })
    if (u.searchParams.get('limit') === '1') return json({ data: reply.any ?? [] })
    return json({ data: reply.list ?? [] })
  })

  beforeEach(() => {
    setActivePinia(createPinia())
    useSettingsStore().availableEvents = ['monolog']
    useEventsStore().setActiveProjectKey('default')
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockClear()
    reply = {}
  })
  afterEach(() => vi.unstubAllGlobals())

  const render = async (path = '/logs') => {
    const page = { template: '<div/>' }
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: RouteName.Home, component: page },
        { path: '/logs', name: RouteName.Logs, component: page },
        { path: '/sentry/traces/:traceId', name: RouteName.SentryTraceDetail, component: page }
      ]
    })
    await router.push(path)
    const wrapper = mount(LogsPage, { global: { plugins: [router] }, attachTo: document.body })
    await flushPromises()
    // The row component loads with the page (an async chunk).
    await vi.dynamicImportSettled()
    await flushPromises()
    return { wrapper, router }
  }

  it('lists the lines with the search marked and sums up the matches', async () => {
    reply = {
      list: [
        logLine('a', { message: 'Charging card for order' }),
        logLine('b', { message: 'Order placed' })
      ],
      facets: { level: [{ value: 'info', count: 23 }], channel: [{ value: 'app', count: 23 }] },
      base: {
        level: [
          { value: 'info', count: 1600 },
          { value: 'error', count: 71 }
        ]
      }
    }
    const { wrapper } = await render('/logs?q=order')
    expect(wrapper.findAll('[role="listitem"]')).toHaveLength(2)
    expect(wrapper.get('[data-test="logs-summary"]').text().replace(/\s+/g, ' ')).toBe(
      '23 matches for order in the last hour · of 1,671 lines'
    )
    expect(wrapper.findAll('mark').map((m) => m.text())).toContain('order')
    wrapper.unmount()
  })

  it('a level chip and the channel pick go into the URL', async () => {
    reply = {
      list: [logLine('a')],
      facets: { level: [{ value: 'debug', count: 3 }], channel: [{ value: 'app', count: 1 }] }
    }
    const { wrapper, router } = await render()
    await wrapper.get('[data-level="debug"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.query.level).toEqual([
      'info',
      'notice',
      'warning',
      'error',
      'critical'
    ])
    wrapper.unmount()
  })

  it('a row unfolds on Enter with the lines of its request', async () => {
    reply = { list: [logLine('a', { extra: { trace_id: 'tr1' } })], facets: {} }
    const { wrapper } = await render()
    await wrapper.get('[data-test="expandable-row-toggle"]').trigger('keydown', { key: 'Enter' })
    await flushPromises()
    expect(wrapper.find('[data-test="mlog-same-request"]').exists()).toBe(true)
    expect(wrapper.get('[data-test="mlog-trace-logs"]').attributes('href')).toBe(
      '/logs?trace=tr1&window=all'
    )
    wrapper.unmount()
  })

  it('no log at all: «No logs yet» with how to send them', async () => {
    reply = { list: [], facets: {}, any: [] }
    const { wrapper } = await render()
    const empty = wrapper.get('[data-test="logs-empty"]')
    expect(empty.text()).toContain('No logs yet')
    expect(empty.text()).toContain('localhost:9913')
    expect(empty.find('[data-test="setup-help"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('nothing matches: says so and clears the filters', async () => {
    reply = { list: [], facets: {}, any: [{}] }
    const { wrapper, router } = await render('/logs?q=nope&channel=app')
    const panel = wrapper.get('[data-test="logs-no-match"]')
    expect(panel.text()).toContain('No lines match')
    await panel.get('button').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.query).toEqual({})
    wrapper.unmount()
  })

  it('a failed load shows the error and tries again', async () => {
    reply = { status: 500 }
    const { wrapper } = await render()
    expect(wrapper.get('[role="alert"]').text()).toContain('Could not load the logs')
    reply = { list: [logLine('a')], facets: {} }
    await wrapper.get('[role="alert"] button').trigger('click')
    await flushPromises()
    await flushPromises()
    expect(wrapper.findAll('[role="listitem"]')).toHaveLength(1)
    wrapper.unmount()
  })

  it('paused: counts the new lines and the matching ones, shows them on request', async () => {
    reply = { list: [logLine('a')], facets: {} }
    const { wrapper } = await render('/logs?level=error')
    await wrapper.get('.pause-btn').trigger('click')
    useEventsStore().addList([logLine('n1'), logLine('n2', { level: 400 })])
    await flushPromises()
    const bar = wrapper.get('[data-test="logs-paused"]')
    expect(bar.text()).toContain('2 new lines while paused (1 match)')
    await bar.get('button').trigger('click')
    await flushPromises()
    expect(wrapper.findAll('[role="listitem"]')).toHaveLength(2)
    expect(wrapper.get('[data-test="logs-paused"]').text()).toBe('')
    wrapper.unmount()
  })
})
