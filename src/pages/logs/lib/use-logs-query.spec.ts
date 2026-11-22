import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { useLogsQuery } from './use-logs-query'

const page = { template: '<div/>' }
const setup = async (path: string) => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/logs', component: page }]
  })
  await router.push(path)
  let api!: ReturnType<typeof useLogsQuery>
  mount(
    defineComponent({
      setup() {
        api = useLogsQuery(100)
        return () => h('div')
      }
    }),
    { global: { plugins: [router] } }
  )
  return { router, api }
}

describe('useLogsQuery', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('reads the filters from the URL', async () => {
    const { api } = await setup('/logs?q=order&level=error&channel=app&window=3h')
    expect(api.filters.value).toEqual({
      q: 'order',
      levels: ['error'],
      channels: ['app'],
      window: '3h',
      trace: ''
    })
    expect(api.search.value).toBe('order')
  })

  it('puts a pick into the URL, keeping the rest', async () => {
    const { router, api } = await setup('/logs?q=order&foo=1')
    await api.setFilters({ levels: ['error', 'warning'], window: '1h' })
    expect(router.currentRoute.value.query).toEqual({
      q: 'order',
      foo: '1',
      level: ['error', 'warning']
    })
  })

  it('the search reaches the URL after a pause in typing', async () => {
    const { router, api } = await setup('/logs')
    api.search.value = 'car'
    await flushPromises()
    api.search.value = 'card '
    await flushPromises()
    vi.advanceTimersByTime(50)
    expect(router.currentRoute.value.query.q).toBeUndefined()
    vi.advanceTimersByTime(100)
    await flushPromises()
    expect(router.currentRoute.value.query.q).toBe('card')
  })

  it('the box follows the URL (Back, a link)', async () => {
    const { router, api } = await setup('/logs?q=one')
    await router.replace('/logs?q=two')
    await flushPromises()
    expect(api.search.value).toBe('two')
  })
})
