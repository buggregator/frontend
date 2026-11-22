import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useEventsStore } from '@/shared/stores'
import FeedFilterBar from './feed-filter-bar.vue'
import FeedFilterPopover from './feed-filter-popover.vue'

const getFacets = vi.fn()
vi.mock('@/shared/lib/io', () => ({ useEventsRequests: () => ({ getFacets }) }))

const counts = {
  host: [{ value: 'anna-mbp', count: 142 }, { value: 'max-xps', count: 96 }],
  channel: [{ value: 'doctrine', count: 412 }],
}

const mountBar = () => mount(FeedFilterBar, {
  attachTo: document.body,
  global: { stubs: { FeedFilterPopover } },
})

describe('FeedFilterBar', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    setActivePinia(createPinia())
    getFacets.mockReset().mockResolvedValue(counts)
  })

  it('shows each filter as a chip, an exclude crossed out with ≠', () => {
    useEventsStore().setFilters([
      { key: 'host', value: 'anna-mbp', not: false },
      { key: 'channel', value: 'doctrine', not: true },
    ])
    const chips = mountBar().findAll('.ffb__chip')

    expect(chips.map((c) => c.findAll('span').map((s) => s.text()).join(' '))).toEqual(['Host = anna-mbp', 'Monolog channel ≠ doctrine'])
    expect(chips[1]!.classes()).toContain('ffb__chip--not')
  })

  it('removes one filter with its ✕ and all with Clear', async () => {
    const store = useEventsStore()
    store.setFilters([
      { key: 'host', value: 'anna-mbp', not: false },
      { key: 'channel', value: 'doctrine', not: true },
    ])
    const bar = mountBar()

    await bar.get('[aria-label="Remove filter: Host is anna-mbp"]').trigger('click')
    expect(store.filters).toEqual([{ key: 'channel', value: 'doctrine', not: true }])

    await bar.findAll('.ffb__action').find((b) => b.text() === 'Clear')!.trigger('click')
    expect(store.filters).toEqual([])
    bar.unmount()
  })

  it('says how many new events the filter hid', async () => {
    const store = useEventsStore()
    store.setFilters([{ key: 'host', value: 'anna-mbp', not: false }])
    store.addList([{ uuid: 'x', type: 'sentry', project: null, timestamp: 1, payload: {}, facets: { host: ['max-xps'] } }])
    const bar = mountBar()

    expect(bar.get('.ffb__hidden').text()).toContain('1 new event arrived and is hidden by this filter')
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
