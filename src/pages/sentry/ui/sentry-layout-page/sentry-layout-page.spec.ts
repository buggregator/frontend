import { mount, RouterLinkStub } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'
import { reloadSentryFilters, useSentryFilters } from '@/entities/sentry'
import SentryLayoutPage from './sentry-layout-page.vue'

const sentryCount = ref(0)
const routeName = ref('sentry-exceptions')

vi.mock('@/shared/lib/use-events', () => ({
  useEvents: () => ({ getItemsCount: computed(() => () => sentryCount.value) })
}))
vi.mock('vue-router', () => ({ useRoute: () => ({ get name() { return routeName.value } }) }))
// The real button is an async wrapper: replaced so the test sees it at once.
vi.mock('@/widgets/ui', async (orig) => ({
  ...(await orig<object>()),
  SetupHelpButton: { props: ['sectionId'], template: '<button class="help-stub" :data-section="sectionId" />' },
}))
// The filter bar too: it shows what it is given.
vi.mock('@/widgets/ui/feed-filter-bar', () => ({
  FeedFilterBar: {
    name: 'FeedFilterBar',
    props: ['facets', 'extra'],
    emits: ['remove-extra'],
    template: `<div class="bar-stub" :data-facets="String(facets)">
      <button v-for="c in extra" :key="c.id" class="chip-stub" @click="$emit('remove-extra', c.id)">{{ c.name }} = {{ c.value }}</button>
      <slot name="add" />
    </div>`
  }
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

const flush = () => new Promise((r) => setTimeout(r))

describe('SentryLayoutPage header (#6737 A)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    reloadSentryFilters()
    sentryCount.value = 0
    routeName.value = 'sentry-exceptions'
  })
  afterEach(() => vi.clearAllMocks())

  it('row 1: crumbs, the sections, «How to set up»; row 2: view, filters, period once', async () => {
    sentryCount.value = 3
    const header = render().get('header')
    await flush()

    const row1 = header.get('.app-header__row')
    expect(row1.find('.tabs-stub').attributes('data-current')).toBe('exceptions')
    // «Ask agents» (every header, #7116), then the page's own «How to set up».
    expect(
      row1.get('.app-header__actions').findAll('button, select').map((e) => e.attributes('data-test') ?? e.classes()[0])
    ).toEqual(['assist-toggle', 'help-stub'])

    const row2 = header.get('[data-test="app-header-toolbar"]')
    expect(row2.findAll('.views-stub, .bar-stub, .period-stub').map((e) => e.classes()[0])).toEqual([
      'views-stub',
      'bar-stub',
      'period-stub'
    ])
    expect(header.findAll('.period-stub')).toHaveLength(1)
    // The level button adds the tab's own filters, inside the bar.
    expect(row2.get('.bar-stub .filter-stub').attributes('data-tab')).toBe('exceptions')
  })

  it('the sections stay in row 1 on every width (no second copy under the header)', () => {
    const w = render()
    expect(w.findAll('.tabs-stub')).toHaveLength(1)
    expect(w.find('.sentry-layout__phone-tabs').exists()).toBe(false)
  })

  it('feed filters only on the exceptions timeline (the event feed)', async () => {
    const filters = useSentryFilters()
    const w = render()
    await flush()
    expect(w.get('.bar-stub').attributes('data-facets')).toBe('true')

    filters.exceptionsView = 'grouped'
    await flush()
    expect(w.get('.bar-stub').attributes('data-facets')).toBe('false')

    routeName.value = 'sentry-traces'
    await flush()
    expect(w.get('.bar-stub').attributes('data-facets')).toBe('false')
  })

  it('traces: the source is a filter chip «source = OpenTelemetry»; ✕ shows all sources again', async () => {
    routeName.value = 'sentry-traces'
    const filters = useSentryFilters()
    filters.source = 'otel'
    const w = render()
    await flush()

    const chip = w.get('.chip-stub')
    expect(chip.text()).toBe('source = OpenTelemetry')
    await chip.trigger('click')
    expect(filters.source).toBe('')
    expect(w.text()).not.toContain('Source')
  })

  it('no Sentry events: no «How to set up»; trace page: row 2 is left to the trace page', async () => {
    routeName.value = 'sentry-trace-detail'
    const header = render().get('header')
    await flush()

    expect(header.find('.help-stub').exists()).toBe(false)
    expect(header.find('.filter-stub').exists()).toBe(false)
    expect(header.find('.views-stub').exists()).toBe(false)
    expect(header.find('.period-stub').exists()).toBe(false)
    expect(header.find('[data-test="app-header-toolbar"]').exists()).toBe(true)
    expect(header.find('.tabs-stub').attributes('data-current')).toBe('traces')
  })

  it('view switch on Traces and Exceptions, none on Logs', () => {
    routeName.value = 'sentry-traces'
    expect(render().get('.views-stub').attributes('data-tab')).toBe('traces')
    routeName.value = 'sentry-exceptions'
    expect(render().get('.views-stub').attributes('data-tab')).toBe('exceptions')
    routeName.value = 'sentry-logs'
    expect(render().find('.views-stub').exists()).toBe(false)
  })

  it('Crons and a cron job: the Crons tab, its own setup help even before any Sentry event, no filters', () => {
    for (const name of ['sentry-crons', 'sentry-cron-job']) {
      routeName.value = name
      const header = render().get('header')
      expect(header.find('.tabs-stub').attributes('data-current')).toBe('crons')
      expect(header.get('.help-stub').attributes('data-section')).toBe('crons')
      expect(header.find('.filter-stub').exists()).toBe(false)
      expect(header.find('.period-stub').exists()).toBe(true)
    }
  })

  it('Queues and a queue job: the Queues tab, its own setup help, no filters in the header', () => {
    for (const name of ['sentry-queues', 'sentry-queue-job']) {
      routeName.value = name
      const header = render().get('header')
      expect(header.find('.tabs-stub').attributes('data-current')).toBe('queues')
      expect(header.get('.help-stub').attributes('data-section')).toBe('queues')
      expect(header.find('.filter-stub').exists()).toBe(false)
    }
  })
})
