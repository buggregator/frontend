 
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { AppHeader, APP_HEADER_TOOLBAR_ID, provideHeaderToolbar } from '../app-header'
import type { TabItem } from '../tabs'
import EventTabs from './event-tabs.vue'

const tabs: TabItem[] = [
  { id: 'response', label: 'Response' },
  { id: 'request', label: 'Request' },
  { id: 'raw', label: 'Raw', count: 2 }
]

const render = (props: Record<string, unknown> = {}) =>
  mount(EventTabs, {
    props: { tabs, ...props },
    slots: { default: ({ tab }: { tab: string }) => h('p', { class: 'body' }, `body of ${tab}`) },
    attachTo: document.body
  })

const settle = () => new Promise((r) => setTimeout(r))

describe('EventTabs', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    window.history.replaceState(null, '', '/')
  })

  it('a tablist of the shared Tabs; the panel is labelled by the selected tab', () => {
    const w = render()
    const list = w.get('[role="tablist"]')
    expect(list.attributes('aria-label')).toBe('Event sections')
    const all = w.findAll('[role="tab"]')
    expect(all.map((t) => t.attributes('aria-selected'))).toEqual(['true', 'false', 'false'])
    const panel = w.get('[role="tabpanel"]')
    expect(panel.attributes('aria-labelledby')).toBe(all[0].attributes('id'))
    expect(all[0].attributes('aria-controls')).toBe(panel.attributes('id'))
    expect(panel.text()).toBe('body of response')
  })

  it('arrows select at once (automatic), End goes to the last tab', async () => {
    const w = render()
    const all = w.findAll('[role="tab"]')
    ;(all[0].element as HTMLElement).focus()
    await all[0].trigger('keydown', { key: 'ArrowRight' })
    await settle()
    expect(w.get('[role="tabpanel"]').text()).toBe('body of request')
    await w.findAll('[role="tab"]')[1].trigger('keydown', { key: 'End' })
    await settle()
    expect(w.get('[role="tabpanel"]').text()).toBe('body of raw')
    expect(document.activeElement).toBe(w.findAll('[role="tab"]')[2].element)
  })

  it('a tab that goes away falls back to the first one', async () => {
    const w = render()
    await w.findAll('[role="tab"]')[2].trigger('click')
    await w.setProps({ tabs: tabs.slice(0, 2) })
    expect(w.get('[role="tabpanel"]').text()).toBe('body of response')
  })

  it('urlFragment: opens the tab of #hash and writes the hash in place, no history entry', async () => {
    window.history.replaceState(null, '', '/http-dump/1#raw')
    const before = window.history.length
    const w = render({ urlFragment: true })
    expect(w.get('[role="tabpanel"]').text()).toBe('body of raw')
    await w.findAll('[role="tab"]')[1].trigger('click')
    expect(window.location.hash).toBe('#request')
    expect(window.history.length).toBe(before)
  })

  it('in row 2 of the page header when the page has one', async () => {
    const Page = defineComponent({
      setup() {
        provideHeaderToolbar()
        return () => [
          h(AppHeader, null, { toolbar: () => [] }),
          h('main', [h(EventTabs, { tabs }, { default: ({ tab }: { tab: string }) => tab })])
        ]
      }
    })
    mount(Page, { attachTo: document.body })
    await nextTick()
    expect(document.querySelector(`#${APP_HEADER_TOOLBAR_ID} [role="tablist"]`)).not.toBeNull()
    expect(document.querySelector('main [role="tabpanel"]')?.textContent).toBe('response')
  })

  // A page sizes the tabs with a class from its scoped styles (the profiler's
  // panel fills the page). Scoped styles reach only a single root (frontend#391).
  it("the page's class and scoped styles land on one root that holds the panel", () => {
    const Page = defineComponent({
      __scopeId: 'data-v-page',
      render: () => h(EventTabs, { tabs, class: 'page-panel' }, { default: () => h('p', 'x') })
    })
    const w = mount(Page, { attachTo: document.body })
    const root = w.get('.page-panel')
    expect(root.attributes()).toHaveProperty('data-v-page')
    expect(root.find('[role="tabpanel"]').exists()).toBe(true)
  })
})
