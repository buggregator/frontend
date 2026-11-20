import { mount, RouterLinkStub } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'
import SentryLayoutPage from './sentry-layout-page.vue'

const sentryCount = ref(0)
const wide = ref(true)
const routeName = ref('sentry-exceptions')

vi.mock('@/shared/lib/use-events', () => ({
  useEvents: () => ({ getItemsCount: computed(() => () => sentryCount.value) })
}))
vi.mock('vue-router', () => ({ useRoute: () => ({ get name() { return routeName.value } }) }))
// The real button is an async wrapper: replaced so the test sees it at once.
vi.mock('@/widgets/ui', async (orig) => ({
  ...(await orig<object>()),
  SetupHelpButton: { template: '<button class="help-stub" />' },
}))
vi.mock('@vueuse/core', async (orig) => ({
  ...(await orig<object>()),
  useMediaQuery: () => wide
}))

const render = () =>
  mount(SentryLayoutPage, {
    global: {
      stubs: {
        LayoutBase: { template: '<div><slot name="header" /><slot /></div>' },
        LayoutSidebar: true,
        RouterView: true,
        RouterLink: RouterLinkStub,
        SentrySubNav: { props: ['current'], template: '<nav class="tabs-stub" :data-current="current" />' },
        SentryFilterButton: { props: ['tab'], template: '<button class="filter-stub" :data-tab="tab" />' },
        PeriodSelect: { template: '<select class="period-stub" />' },
        SentryListViews: { props: ['tab'], template: '<div class="views-stub" :data-tab="tab" />' }
      }
    }
  })

describe('SentryLayoutPage header (#5980)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    sentryCount.value = 0
    wide.value = true
    routeName.value = 'sentry-exceptions'
  })
  afterEach(() => vi.clearAllMocks())

  it('one row: tabs in the header, then Period, the filter button and «How to set up» last', () => {
    sentryCount.value = 3
    const header = render().get('header')

    expect(header.find('.tabs-stub').attributes('data-current')).toBe('exceptions')
    const controls = header.get('.header__actions').findAll('button, select').map((e) => e.classes()[0])
    expect(controls).toEqual(['period-stub', 'filter-stub', 'help-stub'])
    expect(header.find('.header__tabs-sep').attributes('aria-hidden')).toBe('true')
  })

  it('phone: the tabs leave the header for a second row; «How to set up» stays in the bar', () => {
    sentryCount.value = 3
    wide.value = false
    const wrapper = render()

    expect(wrapper.get('header').find('.tabs-stub').exists()).toBe(false)
    expect(wrapper.find('.sentry-layout__phone-tabs').exists()).toBe(true)
    expect(wrapper.get('header').find('.help-stub').exists()).toBe(true)
    expect(wrapper.get('header').find('.nav__current').element.tagName).toBe('SPAN')
  })

  it('no Sentry events: no «How to set up»; trace page: no filter button', () => {
    routeName.value = 'sentry-trace-detail'
    const header = render().get('header')

    expect(header.find('.help-stub').exists()).toBe(false)
    expect(header.find('.filter-stub').exists()).toBe(false)
    expect(header.find('.tabs-stub').attributes('data-current')).toBe('traces')
  })

  it('view tabs under the header (#6543 B) on Traces and Exceptions, none on Logs or the trace page', () => {
    routeName.value = 'sentry-traces'
    expect(render().get('.views-stub').attributes('data-tab')).toBe('traces')
    routeName.value = 'sentry-exceptions'
    expect(render().get('.views-stub').attributes('data-tab')).toBe('exceptions')
    routeName.value = 'sentry-logs'
    expect(render().find('.views-stub').exists()).toBe(false)
    routeName.value = 'sentry-trace-detail'
    expect(render().find('.views-stub').exists()).toBe(false)
  })
})
