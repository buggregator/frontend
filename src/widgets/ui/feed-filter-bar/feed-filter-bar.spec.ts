import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useEventsStore } from '@/shared/stores'
import { EventTypes, type PageEventTypes } from '@/shared/types'
import FeedFilterBar from './feed-filter-bar.vue'
import FeedFilterChips from './feed-filter-chips.vue'
import FeedFilterHiddenNote from './feed-filter-hidden-note.vue'
import FeedFilterPopover from './feed-filter-popover.vue'

const getFacets = vi.fn()
vi.mock('@/shared/lib/io', () => ({ useEventsRequests: () => ({ getFacets }) }))

const counts = {
  host: [{ value: 'anna-mbp', count: 142 }, { value: 'max-xps', count: 96 }],
  channel: [{ value: 'doctrine', count: 412 }],
}

const mountBar = (props: Record<string, unknown> = {}) => mount(FeedFilterBar, {
  props,
  attachTo: document.body,
  global: { stubs: { FeedFilterPopover, FeedFilterChips } },
})

const four = [
  { key: 'host', value: 'anna-mbp', not: false },
  { key: 'env', value: 'local', not: false },
  { key: 'channel', value: 'doctrine', not: true },
  { key: 'level', value: 'warning', not: true },
]

describe('FeedFilterBar', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    setActivePinia(createPinia())
    getFacets.mockReset().mockResolvedValue(counts)
  })

  it('shows each filter as a chip, an exclude with ≠ read as «is not»', () => {
    useEventsStore().setFilters([
      { key: 'host', value: 'anna-mbp', not: false },
      { key: 'channel', value: 'doctrine', not: true },
    ])
    const chips = mountBar().findAll('.ffb__chip')

    const visible = (c: (typeof chips)[number]) =>
      ['name', 'op', 'value'].map((part) => c.get(`.filter-chip__${part}`).text()).join(' ')
    expect(chips.map(visible)).toEqual(['Host = anna-mbp', 'Monolog channel ≠ doctrine'])
    expect(chips[1]!.get('.sr-only').text()).toBe('is not')
    expect(chips[1]!.find('.filter-chip--not').exists()).toBe(true)
  })

  it('removes one filter with its ✕; focus moves to the next ✕', async () => {
    const store = useEventsStore()
    store.setFilters([
      { key: 'host', value: 'anna-mbp', not: false },
      { key: 'channel', value: 'doctrine', not: true },
    ])
    const bar = mountBar()

    await bar.get('[aria-label="Remove filter Host is anna-mbp"]').trigger('click')
    await flushPromises()
    expect(store.filters).toEqual([{ key: 'channel', value: 'doctrine', not: true }])
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Remove filter Monolog channel is not doctrine')
    bar.unmount()
  })

  it('three chips in the row; the rest behind «+N», which lists them, removes and clears', async () => {
    const store = useEventsStore()
    store.setFilters(four)
    const bar = mountBar()

    expect(bar.findAll('.ffb__chip')).toHaveLength(3)
    const more = bar.get('[data-test="feed-filter-more"]')
    expect(more.text()).toBe('+1')
    expect(more.attributes('aria-label')).toBe('1 more filter')
    expect(more.attributes('aria-expanded')).toBe('false')

    await more.trigger('click')
    await flushPromises()
    const sheet = bar.get('[data-test="feed-filter-chips"]')
    expect(sheet.attributes('role')).toBe('dialog')
    expect(sheet.findAll('.filter-chip').map((c) => c.get('.filter-chip__value').text())).toEqual(['warning'])

    await sheet.get('[aria-label="Remove filter Level is not warning"]').trigger('click')
    await flushPromises()
    expect(store.filters).toHaveLength(3)
    expect(bar.find('[data-test="feed-filter-more"]').exists()).toBe(false)

    store.setFilters(four)
    await flushPromises()
    await bar.get('[data-test="feed-filter-more"]').trigger('click')
    await flushPromises()
    await bar.findAll('.ffc__btn').find((b) => b.text() === 'Clear all')!.trigger('click')
    expect(store.filters).toEqual([])
    bar.unmount()
  })

  it('«+N» closes on Escape and gives the focus back to it', async () => {
    useEventsStore().setFilters(four)
    const bar = mountBar()
    const more = bar.get('[data-test="feed-filter-more"]')
    await more.trigger('click')
    await flushPromises()
    await bar.get('[data-test="feed-filter-chips"]').trigger('keydown', { key: 'Escape' })
    await flushPromises()
    expect(bar.find('[data-test="feed-filter-chips"]').exists()).toBe(false)
    expect(document.activeElement).toBe(more.element)
    bar.unmount()
  })

  it('a page\'s own filters come first as chips; their ✕ goes back to the page', async () => {
    useEventsStore().setFilters([{ key: 'host', value: 'anna-mbp', not: false }])
    const bar = mountBar({ extra: [{ id: 'source', name: 'source', value: 'OpenTelemetry' }] })
    const values = bar.findAll('.ffb__chip .filter-chip__value').map((v) => v.text())
    expect(values).toEqual(['OpenTelemetry', 'anna-mbp'])
    await bar.get('[aria-label="Remove filter source is OpenTelemetry"]').trigger('click')
    expect(bar.emitted('remove-extra')).toEqual([['source']])
    bar.unmount()
  })

  it('without facets: no feed chips and no «Add filter», the page adds its own (#add)', () => {
    useEventsStore().setFilters([{ key: 'host', value: 'anna-mbp', not: false }])
    const bar = mountBar({ facets: false, extra: [{ id: 'level', name: 'level', value: 'error' }] })
    expect(bar.findAll('.ffb__chip .filter-chip__value').map((v) => v.text())).toEqual(['error'])
    expect(bar.find('.ffb__add').exists()).toBe(false)
    bar.unmount()

    const own = mount(FeedFilterBar, { props: { facets: false }, slots: { add: '<button class="own">Level</button>' } })
    expect(own.find('.own').exists()).toBe(true)
    expect(own.find('[data-test="feed-filter-phone"]').exists()).toBe(false)
  })

  it('phone: «Filters N» opens every chip as a sheet with «Add filter»', async () => {
    useEventsStore().setFilters(four)
    const bar = mountBar()
    const phone = bar.get('[data-test="feed-filter-phone"]')
    expect(phone.attributes('aria-label')).toBe('Filters, 4 on')
    await phone.trigger('click')
    await flushPromises()
    const sheet = bar.get('[data-test="feed-filter-chips"]')
    expect(sheet.findAll('.filter-chip')).toHaveLength(4)

    await sheet.findAll('.ffc__btn').find((b) => b.text().includes('Add filter'))!.trigger('click')
    await flushPromises()
    expect(bar.find('[data-test="feed-filter-chips"]').exists()).toBe(false)
    expect(bar.find('.ffp').exists()).toBe(true)
    bar.unmount()
  })

  it('adds a value from the list: Enter includes, Shift+Enter excludes', async () => {
    const store = useEventsStore()
    const bar = mountBar()

    await bar.get('.ffb__add').trigger('click')
    await flushPromises()
    expect(getFacets).toHaveBeenCalledTimes(1)
    expect(bar.text()).toContain('2 values')

    await bar.findAll('.ffp__field').find((b) => b.text().startsWith('Host'))!.trigger('click')
    const search = bar.get('.ffp__search')
    await search.trigger('keydown', { key: 'ArrowDown' })
    await search.trigger('keydown', { key: 'Enter' })
    expect(store.filters).toEqual([{ key: 'host', value: 'max-xps', not: false }])
    expect(bar.find('.ffp').exists()).toBe(false)

    await bar.get('.ffb__add').trigger('click')
    await flushPromises()
    await bar.findAll('.ffp__field').find((b) => b.text().startsWith('Monolog channel'))!.trigger('click')
    await bar.get('.ffp__search').trigger('keydown', { key: 'Enter', shiftKey: true })
    expect(store.filters).toEqual([
      { key: 'host', value: 'max-xps', not: false },
      { key: 'channel', value: 'doctrine', not: true },
    ])
    bar.unmount()
  })

  it('takes a typed value nobody sent yet', async () => {
    const store = useEventsStore()
    const bar = mountBar()
    await bar.get('.ffb__add').trigger('click')
    await flushPromises()
    await bar.findAll('.ffp__field').find((b) => b.text().startsWith('Host'))!.trigger('click')

    const search = bar.get('.ffp__search')
    await search.setValue('dmitry-thinkpad')
    expect(bar.text()).toContain('Use “dmitry-thinkpad”')
    await search.trigger('keydown', { key: 'Enter' })

    expect(store.filters).toEqual([{ key: 'host', value: 'dmitry-thinkpad', not: false }])
    bar.unmount()
  })

  it('closes on a tap on the phone scrim, not on a tap inside the sheet', async () => {
    const bar = mountBar()
    await bar.get('.ffb__add').trigger('click')
    await flushPromises()

    bar.get('.ffp__field').element.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await flushPromises()
    expect(bar.find('.ffp').exists()).toBe(true)

    bar.get('.ffp__scrim').element.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await flushPromises()
    expect(bar.find('.ffp').exists()).toBe(false)
    expect(bar.find('.ffp__scrim').exists()).toBe(false)
    bar.unmount()
  })

  it('closes on Escape and gives the focus back to «Add filter»', async () => {
    const bar = mountBar()
    const add = bar.get('.ffb__add')
    await add.trigger('click')
    await flushPromises()

    await bar.get('.ffp').trigger('keydown', { key: 'Escape' })
    await flushPromises()
    expect(bar.find('.ffp').exists()).toBe(false)
    expect(document.activeElement).toBe(add.element)
    bar.unmount()
  })
})

describe('FeedFilterHiddenNote', () => {
  const note = (type?: PageEventTypes) => mount(FeedFilterHiddenNote, { props: { type } })

  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('says how many new events the filter hid; Clear filters drops them', async () => {
    const store = useEventsStore()
    store.setFilters([{ key: 'host', value: 'anna-mbp', not: false }])
    store.addList([{ uuid: 'x', type: 'sentry', project: null, timestamp: 1, payload: {}, facets: { host: ['max-xps'] } }])
    const w = note()

    expect(w.get('.ffb-hidden').text()).toContain('1 new event arrived and is hidden by this filter')
    await w.get('button').trigger('click')
    expect(store.filters).toEqual([])
  })

  it('counts only the hidden events of its own page type', () => {
    const store = useEventsStore()
    store.setFilters([{ key: 'host', value: 'anna-mbp', not: false }])
    store.addList([{ uuid: 'x', type: 'sentry', project: null, timestamp: 1, payload: {}, facets: { host: ['max-xps'] } }])

    expect(note(EventTypes.Monolog).find('.ffb-hidden').exists()).toBe(false)
    expect(note(EventTypes.Sentry).get('.ffb-hidden').text()).toContain('1 new event')
  })
})
