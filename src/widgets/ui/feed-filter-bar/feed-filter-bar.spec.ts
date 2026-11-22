import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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

  it('removes one filter with its ✕ and all with Clear', async () => {
    const store = useEventsStore()
    store.setFilters([
      { key: 'host', value: 'anna-mbp', not: false },
      { key: 'channel', value: 'doctrine', not: true },
    ])
    const bar = mountBar()

    // One or two chips: «Copy link» and «Clear» are in the row, no «+N» needed.
    expect(bar.find('[data-test="feed-filter-more"]').exists()).toBe(false)
    expect(bar.findAll('.ffb__action').map((b) => b.text())).toEqual(['Copy link', 'Clear'])

    await bar.get('[aria-label="Remove filter Host is anna-mbp"]').trigger('click')
    expect(store.filters).toEqual([{ key: 'channel', value: 'doctrine', not: true }])

    await bar.findAll('.ffb__action').find((b) => b.text() === 'Clear')!.trigger('click')
    await flushPromises()
    expect(store.filters).toEqual([])
    expect(bar.find('.ffb__action').exists()).toBe(false)
    // Clear is gone: the focus goes to «+ Add filter», not to <body>.
    expect(document.activeElement).toBe(bar.get('.ffb__add').element)
    bar.unmount()
  })

  it('a page\'s own chip without feed filters: Clear, no Copy link', () => {
    const bar = mountBar({ facets: false, extra: [{ id: 'level', name: 'level', value: 'error' }] })
    expect(bar.findAll('.ffb__action').map((b) => b.text())).toEqual(['Clear'])
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
    // «+N» went with its last chip: the focus is on «+ Add filter».
    expect(document.activeElement).toBe(bar.get('.ffb__add').element)

    store.setFilters(four)
    await flushPromises()
    await bar.get('[data-test="feed-filter-more"]').trigger('click')
    await flushPromises()
    await bar.findAll('.ffc__btn').find((b) => b.text() === 'Clear all')!.trigger('click')
    await flushPromises()
    expect(store.filters).toEqual([])
    expect(document.activeElement).toBe(bar.get('.ffb__add').element)
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

    const none = mount(FeedFilterBar, { props: { facets: false } })
    expect(none.find('[data-test="feed-filter-phone"]').exists()).toBe(false)
  })

  it('#add: after the chips; on a phone inside the «Filters N» sheet', async () => {
    const own = mount(FeedFilterBar, {
      props: { facets: false },
      slots: { add: '<button class="own">Level</button>' },
      global: { stubs: { FeedFilterChips } },
    })
    expect(own.findAll('.own')).toHaveLength(1)
    await own.get('[data-test="feed-filter-phone"]').trigger('click')
    await flushPromises()
    expect(own.get('[data-test="feed-filter-chips"]').find('.own').exists()).toBe(true)
  })

  it('without facets the last chip gone: focus on the page\'s own add, else on the bar', async () => {
    const extra = [{ id: 'level', name: 'level', value: 'error' }]
    const own = mountBar({
      facets: false,
      extra,
      'onRemove-extra': () => own.setProps({ extra: [] }),
    })
    // no #add slot: the bar itself takes the focus
    await own.get('[aria-label="Remove filter level is error"]').trigger('click')
    await flushPromises()
    expect(document.activeElement).toBe(own.get('[data-test="feed-filter-bar"]').element)
    own.unmount()

    const withAdd = mount(FeedFilterBar, {
      props: { facets: false, extra, 'onRemove-extra': () => withAdd.setProps({ extra: [] }) },
      slots: { add: '<button class="own">Level</button>' },
      attachTo: document.body,
    })
    await withAdd.get('[aria-label="Remove filter level is error"]').trigger('click')
    await flushPromises()
    expect(document.activeElement).toBe(withAdd.get('.own').element)
    withAdd.unmount()
  })

  it('phone sheet is modal: aria-modal, Tab stays inside', async () => {
    useEventsStore().setFilters(four)
    const bar = mountBar()
    await bar.get('[data-test="feed-filter-phone"]').trigger('click')
    await flushPromises()
    const sheet = bar.get('[data-test="feed-filter-chips"]')
    expect(sheet.attributes('aria-modal')).toBe('true')
    const buttons = sheet.findAll('button')
    buttons.at(-1)!.element.focus()
    await buttons.at(-1)!.trigger('keydown', { key: 'Tab' })
    expect(document.activeElement).toBe(buttons[0]!.element)
    await buttons[0]!.trigger('keydown', { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(buttons.at(-1)!.element)
    bar.unmount()
  })

  it('«+N» is not modal', async () => {
    useEventsStore().setFilters(four)
    const bar = mountBar()
    await bar.get('[data-test="feed-filter-more"]').trigger('click')
    await flushPromises()
    expect(bar.get('[data-test="feed-filter-chips"]').attributes('aria-modal')).toBeUndefined()
    bar.unmount()
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

// The row's layout through a fake ResizeObserver and fixed element widths:
// a chip 120 px, «+N» 40, «+ Add filter» 90, «Copy link · Clear» 130.
describe('FeedFilterBar: chips that do not fit go under «+N»', () => {
  let barWidth = 400
  const observers: FakeObserver[] = []
  class FakeObserver {
    constructor(public cb: ResizeObserverCallback) {
      observers.push(this)
    }
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  const resize = async (w: number) => {
    barWidth = w
    observers.forEach((o) => o.cb([], o as unknown as ResizeObserver))
    await flushPromises()
  }
  const widthOf = (el: HTMLElement) => {
    if (el.classList.contains('ffb')) return barWidth
    if (el.classList.contains('ffb__chip')) return 120
    if (el.classList.contains('ffb__phone')) return 0
    if (el.classList.contains('ffb__actions')) return 130
    if (el.querySelector('.ffb__more')) return 40
    if (el.querySelector('.ffb__add')) return 90
    return 0
  }

  beforeEach(() => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    vi.stubGlobal('ResizeObserver', FakeObserver)
    observers.length = 0
    barWidth = 400
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (this: HTMLElement) {
      return widthOf(this)
    })
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (this: HTMLElement) {
      return widthOf(this)
    })
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  const visibleValues = (bar: ReturnType<typeof mountBar>) =>
    bar.findAll('.ffb__chip:not(.ffb__chip--out) .filter-chip__value').map((v) => v.text())

  it('a narrow row keeps whole chips only, the rest under «+N»; a wide one shows up to three', async () => {
    useEventsStore().setFilters([
      { key: 'host', value: 'anna-mbp', not: false },
      { key: 'env', value: 'local', not: false },
      { key: 'level', value: 'error', not: false },
    ])
    const bar = mountBar()
    await resize(400)

    // 400 − Add 96 − actions 136 = 168: one chip, then «+N» takes 46 more.
    expect(visibleValues(bar)).toEqual(['anna-mbp'])
    expect(bar.get('[data-test="feed-filter-more"]').text()).toBe('+2')
    // The hidden ones are out of the tab order and the a11y tree.
    expect(bar.findAll('.ffb__chip--out')).toHaveLength(2)
    // Copy link and Clear stay in the row.
    expect(bar.findAll('.ffb__action').map((b) => b.text())).toEqual(['Copy link', 'Clear'])

    await bar.get('[data-test="feed-filter-more"]').trigger('click')
    await flushPromises()
    expect(bar.get('[data-test="feed-filter-chips"]').findAll('.filter-chip__value').map((v) => v.text())).toEqual(['local', 'error'])

    await resize(1200)
    expect(visibleValues(bar)).toEqual(['anna-mbp', 'local', 'error'])
    expect(bar.find('[data-test="feed-filter-more"]').exists()).toBe(false)
    bar.unmount()
  })

  it('room for more than three still shows three, the rest under «+N»', async () => {
    useEventsStore().setFilters(four)
    const bar = mountBar()
    await resize(1600)
    expect(visibleValues(bar)).toHaveLength(3)
    expect(bar.get('[data-test="feed-filter-more"]').text()).toBe('+1')
    bar.unmount()
  })

  it('no room for a chip: all under «+N»', async () => {
    useEventsStore().setFilters([{ key: 'host', value: 'anna-mbp', not: false }])
    const bar = mountBar()
    await resize(300)
    expect(visibleValues(bar)).toEqual([])
    expect(bar.get('[data-test="feed-filter-more"]').text()).toBe('+1')
    await resize(400)
    expect(visibleValues(bar)).toEqual(['anna-mbp'])
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
