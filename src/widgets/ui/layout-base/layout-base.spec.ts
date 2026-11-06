import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { showToast } from '@/shared/lib/use-keyboard-nav'
import LayoutBase from './layout-base.vue'

vi.mock('@/shared/lib/use-events', () => ({ useEvents: () => ({ events: { getAll: vi.fn() } }) }))

const memoryStorage = () => {
  const items = new Map<string, string>()
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, String(value)),
    removeItem: (key: string) => void items.delete(key),
    clear: () => items.clear(),
  }
}

const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/', component: { template: '<div/>' } }] })

const render = (props = {}) =>
  mount(LayoutBase, {
    props,
    slots: { sidebar: '<nav>side</nav>', header: '<header>head</header>', default: '<div class="page">page</div>' },
    global: { plugins: [router] },
    attachTo: document.body,
  })

// Audit 5.7 and 5.6.
describe('LayoutBase', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage())
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    setActivePinia(createPinia())
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  it('starts with a skip link to the main landmark, which holds the page', () => {
    const wrapper = render()
    const skip = wrapper.get('a')
    expect(skip.text()).toBe('Skip to content')
    const main = wrapper.get('main')
    expect(skip.attributes('href')).toBe(`#${main.attributes('id')}`)
    expect(main.attributes('tabindex')).toBe('-1')
    expect(main.find('.page').exists()).toBe(true)
    wrapper.unmount()
  })

  // Review of #316: following the link left #main-content in the URL.
  it('skip link moves focus to main and leaves the URL as it is', async () => {
    const wrapper = render()
    const before = window.location.href
    await wrapper.get('a').trigger('click')
    expect(document.activeElement).toBe(wrapper.get('main').element)
    expect(window.location.href).toBe(before)
    wrapper.unmount()
  })

  it('gives the page an h1 when it passes a heading', () => {
    expect(render({ heading: 'Settings' }).get('main h1').text()).toBe('Settings')
    expect(render().find('h1').exists()).toBe(false)
  })

  it('announces toasts through a live region that is always there', async () => {
    const wrapper = render()
    const region = document.querySelector('[role="status"][aria-live="polite"]')
    expect(region).not.toBeNull()
    showToast('Event deleted')
    await nextTick()
    expect(region?.textContent).toContain('Event deleted')
    wrapper.unmount()
  })
})
