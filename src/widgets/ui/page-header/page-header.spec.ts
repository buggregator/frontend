import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { ALL_EVENT_TYPES } from '@/shared/constants'
import { EventTypes } from '@/shared/types'
import PageHeader from './page-header.vue'

const removeAll = vi.fn()
const removeByType = vi.fn()

vi.mock('@/shared/lib/use-events', () => ({
  useEvents: () => ({
    events: {
      items: computed(() => [
        { uuid: 'a', type: 'smtp' },
        { uuid: 'b', type: 'smtp' },
        { uuid: 'c', type: 'sentry' },
      ]),
      removeAll,
      removeByType,
    },
    cachedEvents: {
      idsByType: ref({}),
      stopUpdatesByType: vi.fn(),
      runUpdatesByType: vi.fn(),
    },
  }),
}))

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/', name: 'home', component: { template: '<div/>' } }],
})

const clickClear = (type: string) =>
  mount(PageHeader, {
    props: { type, title: 'SMTP' } as never,
    global: { plugins: [router] },
  })
    .get('button[aria-label^="Clear"]')
    .trigger('click')

describe('PageHeader: Clear', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    removeAll.mockClear()
    removeByType.mockClear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('does not delete anything when the person cancels', async () => {
    const confirm = vi.fn(() => false)
    vi.stubGlobal('confirm', confirm)

    await clickClear(ALL_EVENT_TYPES)

    expect(confirm).toHaveBeenCalledOnce()
    expect(removeAll).not.toHaveBeenCalled()
  })

  it('clears all events after confirmation, naming how many', async () => {
    const confirm = vi.fn(() => true)
    vi.stubGlobal('confirm', confirm)

    await clickClear(ALL_EVENT_TYPES)

    expect(confirm).toHaveBeenCalledWith(expect.stringContaining('3 events'))
    expect(removeAll).toHaveBeenCalledOnce()
  })

  it('clears one type after confirmation, naming the type and its count', async () => {
    const confirm = vi.fn(() => true)
    vi.stubGlobal('confirm', confirm)

    await clickClear(EventTypes.Smtp)

    expect(confirm).toHaveBeenCalledWith(expect.stringMatching(/2 SMTP events/))
    expect(removeByType).toHaveBeenCalledWith('smtp')
  })
})
