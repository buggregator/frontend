import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'
import { useEventsStore } from '../../stores'
import { useFeedFiltersRoute } from './use-feed-filters-route'

const Feed = defineComponent({ setup: () => { useFeedFiltersRoute(); return () => h('div') } })

const start = async (url: string) => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:type?', component: Feed }],
  })
  await router.push(url)
  mount(RouterView, { global: { plugins: [router] } })
  await flushPromises()
  return router
}

describe('useFeedFiltersRoute', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    setActivePinia(createPinia())
  })

  it('a link with filters sets them', async () => {
    await start('/monolog?host=anna-mbp&not.channel=doctrine&period=24h')
    expect(useEventsStore().filters).toEqual([
      { key: 'host', value: 'anna-mbp', not: false },
      { key: 'channel', value: 'doctrine', not: true },
    ])
  })

  it('writes new filters into the address, keeping other parameters', async () => {
    const router = await start('/monolog?period=24h')
    useEventsStore().setFilters([{ key: 'tag:feature', value: 'checkout', not: false }])
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/monolog?period=24h&tag=feature:checkout')
  })

  it('keeps the filters on another page opened without them', async () => {
    const router = await start('/monolog?host=anna-mbp')
    await router.push('/sentry')
    await flushPromises()

    expect(useEventsStore().filters).toEqual([{ key: 'host', value: 'anna-mbp', not: false }])
    expect(router.currentRoute.value.fullPath).toBe('/sentry?host=anna-mbp')
  })

  it('Back to the same page without filters clears them', async () => {
    const router = await start('/monolog')
    await router.push('/monolog?host=anna-mbp')
    await flushPromises()
    router.back()
    await flushPromises()
    await new Promise((r) => setTimeout(r, 0))
    await flushPromises()

    expect(useEventsStore().filters).toEqual([])
  })
})
