import { mount, RouterLinkStub } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import Tabs from './tab-bar.vue'
import { tabIdOf, type TabItem } from './types'

const tabs: TabItem[] = [
  { id: 'list', label: 'List', icon: 'events' },
  { id: 'map', label: 'Service map' },
  { id: 'off', label: 'Off', disabled: true },
  { id: 'errors', label: 'Related errors', count: 2 }
]

const render = (props: Record<string, unknown> = {}) =>
  mount(Tabs, { props: { tabs, modelValue: 'list', label: 'Traces view', ...props }, attachTo: document.body })

const settle = () => new Promise((r) => setTimeout(r))

describe('Tabs', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('a tablist: the selected tab is the only tab stop, counts and icons inside the tab', () => {
    const w = render({ modelValue: 'map' })
    expect(w.get('[role="tablist"]').attributes('aria-label')).toBe('Traces view')
    const all = w.findAll('[role="tab"]')
    expect(all.map((t) => t.attributes('aria-selected'))).toEqual(['false', 'true', 'false', 'false'])
    expect(all.map((t) => t.attributes('tabindex'))).toEqual(['-1', '0', '-1', '-1'])
    expect(all[3].get('.ui-tabs__count').text()).toBe('2')
    expect(all[0].find('.ui-tabs__icon').exists()).toBe(true)
    expect(all[2].attributes('aria-disabled')).toBe('true')
    expect(all[1].attributes('data-test')).toBe('tab-map')
  })

  it('with a panel id every tab controls the panel and has an id for its label', () => {
    const w = render({ panelId: 'p1', testPrefix: 'view-tab-' })
    const all = w.findAll('[role="tab"]')
    expect(all.map((t) => t.attributes('aria-controls'))).toEqual(['p1', 'p1', 'p1', 'p1'])
    expect(all[1].attributes('id')).toBe(tabIdOf('p1', 'map'))
    expect(all[1].attributes('data-test')).toBe('view-tab-map')
  })

  it('automatic: an arrow selects the next enabled tab and moves focus; v-model and select both fire', async () => {
    const w = render()
    const all = w.findAll('[role="tab"]')
    ;(all[0].element as HTMLElement).focus()
    await all[0].trigger('keydown', { key: 'ArrowLeft' })
    await settle()
    expect(w.emitted('update:modelValue')).toEqual([['errors']])
    expect(w.emitted('select')).toEqual([['errors']])
    expect(document.activeElement).toBe(all[3].element)
  })

  it('manual: arrows move focus without selecting; a click selects; a disabled tab does not', async () => {
    const w = render({ activation: 'manual' })
    const all = w.findAll('[role="tab"]')
    ;(all[0].element as HTMLElement).focus()
    await all[0].trigger('keydown', { key: 'End' })
    await settle()
    expect(document.activeElement).toBe(all[3].element)
    expect(w.emitted('select')).toBeUndefined()

    await all[2].trigger('click')
    expect(w.emitted('select')).toBeUndefined()
    await all[1].trigger('click')
    expect(w.emitted('select')).toEqual([['map']])
  })

  it('`current` without v-model works the same', () => {
    const w = mount(Tabs, { props: { tabs, current: 'errors', label: 'x' } })
    expect(w.get('[aria-selected="true"]').text()).toContain('Related errors')
  })

  it('focusSelected() puts focus on the selected tab', async () => {
    const w = render({ modelValue: 'map' })
    ;(w.vm as unknown as { focusSelected: () => void }).focusSelected()
    await settle()
    expect(document.activeElement).toBe(w.findAll('[role="tab"]')[1].element)
  })

  it('the #info slot sits beside the tabs', () => {
    const w = mount(Tabs, { props: { tabs, current: 'list', label: 'x' }, slots: { info: '<b>Period 1h</b>' } })
    expect(w.get('.ui-tabs__info').text()).toBe('Period 1h')
  })

  it('as="link": a nav of links, the current one aria-current="page", no tab roles', () => {
    const links: TabItem[] = [
      { id: 'exceptions', label: 'Exceptions', to: '/sentry/exceptions', count: 21 },
      { id: 'logs', label: 'Logs', to: '/sentry/logs' }
    ]
    const w = mount(Tabs, {
      props: { tabs: links, current: 'logs', label: 'Sentry', as: 'link' },
      global: { stubs: { RouterLink: RouterLinkStub } }
    })
    expect(w.get('nav').attributes('aria-label')).toBe('Sentry')
    expect(w.find('[role="tablist"]').exists()).toBe(false)
    const all = w.findAllComponents(RouterLinkStub)
    expect(all.map((a) => a.props('to'))).toEqual(['/sentry/exceptions', '/sentry/logs'])
    expect(all[1].attributes('aria-current')).toBe('page')
    expect(all[0].attributes('aria-current')).toBeUndefined()
    expect(all[0].text()).toBe('Exceptions 21')
  })
})
