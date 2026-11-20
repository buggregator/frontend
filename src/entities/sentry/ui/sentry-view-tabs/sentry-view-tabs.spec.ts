import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import SentryViewTabs from './sentry-view-tabs.vue'
import { tabIdOf } from './tab-id'

const tabs = [
  { id: 'list', label: 'List', icon: 'list' as const },
  { id: 'map', label: 'Service map', icon: 'map' as const },
  { id: 'errors', label: 'Related errors', count: 2 }
]

const render = (current = 'list') =>
  mount(SentryViewTabs, { props: { tabs, current, label: 'Traces view' }, attachTo: document.body })

describe('SentryViewTabs (#6543 B)', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('is a tablist; the current view is selected and the only tab stop', () => {
    const w = render('map')
    expect(w.get('[role="tablist"]').attributes('aria-label')).toBe('Traces view')
    const all = w.findAll('[role="tab"]')
    expect(all.map((t) => t.attributes('aria-selected'))).toEqual(['false', 'true', 'false'])
    expect(all.map((t) => t.attributes('tabindex'))).toEqual(['-1', '0', '-1'])
    expect(all[2].text()).toContain('2')
    expect(all[0].find('svg').exists()).toBe(true)
  })

  it('#6549: with a panel id, every tab controls that panel and has an id for its label', () => {
    const w = mount(SentryViewTabs, { props: { tabs, current: 'map', label: 'Trace view', panelId: 'p1' } })
    const all = w.findAll('[role="tab"]')
    expect(all.map((t) => t.attributes('aria-controls'))).toEqual(['p1', 'p1', 'p1'])
    expect(all[1].attributes('id')).toBe(tabIdOf('p1', 'map'))
  })

  it('arrows move focus without opening; a click opens', async () => {
    const w = render('list')
    const all = w.findAll('[role="tab"]')
    ;(all[0].element as HTMLElement).focus()
    await all[0].trigger('keydown', { key: 'ArrowRight' })
    await w.vm.$nextTick()
    expect(document.activeElement).toBe(all[1].element)
    await all[0].trigger('keydown', { key: 'ArrowLeft' })
    await w.vm.$nextTick()
    expect(document.activeElement).toBe(all[2].element)
    expect(w.emitted('select')).toBeUndefined()

    await all[1].trigger('click')
    expect(w.emitted('select')).toEqual([['map']])
  })
})
