import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, reactive, ref } from 'vue'
import type { BroadcastEvent } from '@/entities/broadcast'
import { broadcastMocks, broadcastOrderStatusMock } from '@/entities/broadcast/mocks'
import { useEventsStore } from '@/shared/stores'
import { useConnectionStore } from '@/shared/stores/connections'
import BroadcastPage from './broadcast-page.vue'

const items = ref<BroadcastEvent[]>([])
const idsByType = ref<Record<string, string[]>>({ broadcast: [] })
const getAll = vi.fn()
const route = reactive<{ query: Record<string, string> }>({ query: {} })
const replace = vi.fn()

vi.mock('vue-router', () => ({ useRoute: () => route, useRouter: () => ({ replace }) }))
vi.mock('@/shared/lib/use-events', () => ({
  useEvents: () => ({ events: { items, getAll, getItem: vi.fn() }, cachedEvents: { idsByType } })
}))
// The page's frame and the setup help have tests of their own.
vi.mock('@/widgets/ui', () => ({
  LayoutBase: { template: '<div><slot name="header" /><slot /></div>' },
  LayoutSidebar: { template: '<nav />' },
  PageHeader: { template: '<header class="header-stub" />' },
  SetupHelpPanel: { props: ['sectionId'], template: '<div class="help-stub" :data-section="sectionId" />' },
  useSetupValues: () => ({ values: computed(() => ({ host: 'localhost', http_port: '8000' })) })
}))

// The console's parts are async components.
const settle = async () => {
  await flushPromises()
  await vi.dynamicImportSettled()
  await flushPromises()
}

const render = async () => {
  const wrapper = mount(BroadcastPage, { attachTo: document.body })
  await settle()
  return wrapper
}

describe('BroadcastPage (channel console)', () => {
  let warn: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    setActivePinia(createPinia())
    items.value = []
    idsByType.value = { broadcast: [] }
    route.query = {}
    replace.mockReset()
    getAll.mockReset()
    useEventsStore().listState = 'ready'
    useConnectionStore().addWSConnection()
    warn = vi.spyOn(console, 'warn')
  })

  afterEach(() => {
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
    document.body.innerHTML = ''
  })

  it('loading: a skeleton while the first list loads', async () => {
    useEventsStore().listState = 'loading'
    const wrapper = await render()
    expect(wrapper.find('[aria-label="Loading broadcasts"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="bc-empty"]').exists()).toBe(false)
  })

  it('error: says so and loads again on request', async () => {
    useEventsStore().listState = 'error'
    useEventsStore().listError = 'HTTP 500'
    const wrapper = await render()
    expect(wrapper.text()).toContain('Could not load broadcasts')
    await wrapper.find('button').trigger('click')
    expect(getAll).toHaveBeenCalled()
  })

  it('empty: where to point the app, and the setup help', async () => {
    const wrapper = await render()
    const empty = wrapper.find('[data-test="bc-empty"]')
    expect(empty.text()).toContain('No broadcasts yet')
    expect(empty.text()).toContain('Waiting for broadcasts on http://localhost:8000')
    expect(empty.find('pre').text()).toContain('REVERB_PORT=8000')
    await wrapper.find('[data-test="bc-setup-help"]').trigger('click')
    expect(wrapper.find('.help-stub').attributes('data-section')).toBe('broadcast')
  })

  it('no channel selected: a hint and a way to all channels', async () => {
    items.value = broadcastMocks
    const wrapper = await render()
    expect(wrapper.find('[data-test="bc-no-channel"]').text()).toContain('Pick a channel')
    await wrapper.find('[data-test="bc-no-channel"] button').trigger('click')
    await settle()
    expect(wrapper.findAll('.bc-row')).toHaveLength(broadcastMocks.length)
    expect(replace).toHaveBeenLastCalledWith({ query: { channel: '*', event: undefined } })
  })

  it('a picked channel streams its events; a row unfolds with its changes', async () => {
    items.value = broadcastMocks
    const wrapper = await render()
    const row = wrapper.findAll('[data-channel-row]').find((r) => r.text().includes('private-orders.42'))!
    await row.trigger('click')
    await settle()

    const rows = wrapper.findAll('.bc-row')
    expect(rows.map((r) => r.find('.bc-row__name').text())).toEqual([
      'OrderStatusUpdated',
      'OrderShipped',
      'OrderStatusUpdated'
    ])
    expect(wrapper.find('.bc-page__toolbar').text()).toContain('private · 3 events · 1 sent with toOthers')

    await rows[0].trigger('click')
    await settle()
    expect(rows[0].attributes('aria-expanded')).toBe('true')
    expect(wrapper.find('[data-test="bc-changes"]').text()).toContain('order.status')
  })

  it('?event= opens the console on that event, unfolded', async () => {
    items.value = broadcastMocks
    route.query = { event: broadcastOrderStatusMock.uuid }
    const wrapper = await render()
    await settle()
    expect(wrapper.find('.bc-page__stream-title').text()).toBe('private-orders.42')
    expect(wrapper.find('.bc-row--open .bc-row__name').text()).toBe('OrderStatusUpdated')
    expect(wrapper.find(`#bc-detail-${broadcastOrderStatusMock.uuid}`).exists()).toBe(true)
  })

  it('phone: the select picks a channel too', async () => {
    items.value = broadcastMocks
    const wrapper = await render()
    await wrapper.find('#bc-channel-select').setValue('private-cart.9f2c1a')
    await settle()
    expect(wrapper.find('.bc-page__stream-title').text()).toBe('private-cart.9f2c1a')
    expect(wrapper.findAll('.bc-row')).toHaveLength(1)
  })

  it('paused: shows only the events kept when the pause began', async () => {
    items.value = broadcastMocks
    idsByType.value = { broadcast: [broadcastOrderStatusMock.uuid] }
    route.query = { channel: '*' }
    const wrapper = await render()
    expect(wrapper.findAll('.bc-row')).toHaveLength(1)
    expect(wrapper.find('.bc-page__live').text()).toBe('Paused')
  })
})
