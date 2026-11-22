/* eslint-disable vue/one-component-per-file -- test pages */
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import AppHeader from './app-header.vue'
import HeaderToolbarPortal from './header-toolbar-portal.vue'
import { APP_HEADER_TOOLBAR_ID, provideHeaderToolbar } from './toolbar'

describe('AppHeader', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('one row without #toolbar', () => {
    const w = mount(AppHeader, { slots: { default: 'Home', controls: '<button>Clear</button>' } })
    expect(w.get('nav[aria-label="Breadcrumb"]').text()).toBe('Home')
    expect(w.get('.app-header__actions').text()).toBe('Clear')
    expect(w.find('[data-test="app-header-toolbar"]').exists()).toBe(false)
    expect(w.classes()).not.toContain('app-header--two-rows')
  })

  it('#toolbar is row 2, under the crumbs and actions', () => {
    const w = mount(AppHeader, { slots: { default: 'Home', toolbar: '<select aria-label="Period"></select>' } })
    expect(w.classes()).toContain('app-header--two-rows')
    const bar = w.get('[data-test="app-header-toolbar"]')
    expect(bar.attributes('id')).toBe(APP_HEADER_TOOLBAR_ID)
    expect(bar.find('select[aria-label="Period"]').exists()).toBe(true)
    // Row 2 is not inside row 1.
    expect(w.get('.app-header__row').find('select').exists()).toBe(false)
  })

  it('row 2 stays when its slot draws nothing (nothing moves when a filter comes)', () => {
    const w = mount(AppHeader, { slots: { toolbar: () => [] } })
    expect(w.find('[data-test="app-header-toolbar"]').exists()).toBe(true)
  })

  it('#tabs: the section tabs between the crumbs and the actions, apart from the crumbs', () => {
    const w = mount(AppHeader, { slots: { default: 'Home', tabs: '<nav aria-label="Sentry">x</nav>' } })
    expect(w.get('.app-header__tabs-sep').attributes('aria-hidden')).toBe('true')
    expect(w.get('.app-header__tabs nav').attributes('aria-label')).toBe('Sentry')
  })
})

describe('HeaderToolbarPortal', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('moves its content into row 2 of the page header', async () => {
    const Page = defineComponent({
      setup() {
        provideHeaderToolbar()
        return () => [
          h(AppHeader, null, { default: () => 'Home', toolbar: () => [] }),
          h('main', [h(HeaderToolbarPortal, null, () => h('button', { id: 'tab' }, 'Raw'))])
        ]
      }
    })
    mount(Page, { attachTo: document.body })
    await nextTick()
    expect(document.querySelector(`#${APP_HEADER_TOOLBAR_ID} #tab`)).not.toBeNull()
    expect(document.querySelector('main #tab')).toBeNull()
  })

  it('without a header row 2 the content stays in place', () => {
    const w = mount(defineComponent({ render: () => h('main', [h(HeaderToolbarPortal, null, () => h('b', 'Raw'))]) }))
    expect(w.get('main b').text()).toBe('Raw')
  })
})
