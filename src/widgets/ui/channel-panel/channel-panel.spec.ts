import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { useConnectionStore, useEventsStore, useSettingsStore } from '@/shared/stores'
import type { ServerEvent } from '@/shared/types'
import ChannelPanel from './channel-panel.vue'

vi.mock('@/entities/xdebug/lib', () => ({ useXdebugEnabled: () => ref(false) }))

const router = createRouter({
  history: createMemoryHistory(),
  routes: ['/mock-server', '/xdebug', '/sentry/exceptions', '/:type'].map((path) => ({
    path,
    name: path === '/:type' ? 'event-list' : path.slice(1),
    component: { template: '<div />' }
  }))
})

const event = (uuid: string, type = 'sentry') =>
  ({ uuid, type, project: 'shop', timestamp: 1, payload: {} }) as unknown as ServerEvent<unknown>

// The transport sets the connection status when it starts: set ours after.
const render = async (connected = true) => {
  const wrapper = mount(ChannelPanel, { global: { plugins: [router] }, attachTo: document.body })
  if (connected) useConnectionStore().addWSConnection()
  else useConnectionStore().removeWSConnection()
  await flushPromises()
  return wrapper
}

describe('ChannelPanel', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    const settings = useSettingsStore()
    settings.availableEvents = ['sentry', 'profiler', 'inspector', 'ray', 'http-dump', 'var-dump', 'smtp', 'sms', 'monolog']
    settings.ports = { http: 8000, smtp: 1025, monolog: 9913, var_dumper: 9912, proxy: 8080 }
    useEventsStore().setAvailableProjects([{ key: 'shop', name: 'Shop backend', is_default: false }])
    useEventsStore().setActiveProjectKey('shop')
    document.body.innerHTML = ''
  })

  it('names the project and counts the listening channels', async () => {
    const wrapper = await render()
    expect(wrapper.text()).toContain('Listening · project Shop backend (shop)')
    // 9 event channels + proxy + mock server listen; Xdebug is off.
    expect(wrapper.get('h1').text()).toBe('Listening on 11 channels')
    expect(wrapper.text()).toContain('Nothing has arrived in Shop backend yet.')
    expect(wrapper.get('[data-test="channel-xdebug"] [data-test="channel-status"]').text()).toBe('Off on this server')
    expect(wrapper.get('[data-test="channel-xdebug"]').text()).toContain('Turn it on with XDEBUG_PROXY_ENABLED')
    wrapper.unmount()
  })

  it('leaves out a section hidden in Settings › Menu', async () => {
    useSettingsStore().hiddenMenuItems = ['sms']
    const wrapper = await render()
    expect(wrapper.find('[data-test="channel-sms"]').exists()).toBe(false)
    expect(wrapper.get('h1').text()).toBe('Listening on 10 channels')
    wrapper.unmount()
  })

  it('fills counts in as events come, says it once, and offers the list', async () => {
    const wrapper = await render()
    expect(wrapper.get('[data-test="channel-sentry"] [data-test="channel-count"]').text()).toBe('0 events')
    expect(wrapper.find('[data-test="channel-panel-open-list"]').exists()).toBe(false)

    useEventsStore().addList([event('a')])
    await flushPromises()

    const sentry = wrapper.get('[data-test="channel-sentry"]')
    expect(sentry.get('[data-test="channel-count"]').text()).toBe('1 event · just now')
    expect(sentry.classes()).toContain('channel-card--events')
    expect(wrapper.get('[aria-live="polite"]').text()).toBe('1 new Sentry event')
    expect(wrapper.text()).toContain('1 event so far.')

    await wrapper.get('[data-test="channel-panel-open-list"]').trigger('click')
    expect(wrapper.emitted('open-list')).toHaveLength(1)
    wrapper.unmount()
  })

  it('offline: every card «Not connected», a waiting title', async () => {
    const wrapper = await render(false)
    expect(wrapper.find('[data-test="channel-panel-offline"]').exists()).toBe(true)
    expect(wrapper.get('h1').text()).toBe('Waiting for the server')
    const states = wrapper.findAll('[data-test="channel-status"]').map((s) => s.text())
    expect(new Set(states)).toEqual(new Set(['Not connected']))
    wrapper.unmount()
  })

  it('links a card to its page and opens its setup help from the book button', async () => {
    const wrapper = await render()
    const smtp = wrapper.get('[data-test="channel-smtp"]')
    expect(smtp.get('a').attributes('href')).toBe('/smtp')
    expect(smtp.text()).toContain('smtp://localhost:1025')
    expect(wrapper.get('[data-test="channel-http-proxy"]').find('a').exists()).toBe(false)

    const help = smtp.get('[data-test="channel-help"]')
    expect(help.attributes('aria-label')).toBe('How to set up SMTP')
    await help.trigger('click')
    await vi.waitFor(() => expect(document.body.querySelector('[role="dialog"]')).not.toBeNull())
    wrapper.unmount()
  })
})
