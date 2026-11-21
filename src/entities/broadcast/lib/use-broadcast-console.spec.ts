import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { broadcastMocks, broadcastMultiChannelMock, broadcastOrderStatusMock, broadcastOrderStatusPrevMock } from '../mocks'
import { ALL_CHANNELS, listKeyTarget, useBroadcastConsole } from './use-broadcast-console'

describe('useBroadcastConsole', () => {
  it('starts with no channel selected and an empty stream', () => {
    const c = useBroadcastConsole(ref(broadcastMocks))
    expect(c.hasSelection.value).toBe(false)
    expect(c.stream.value).toEqual([])
    expect(c.channels.value.length).toBeGreaterThan(3)
  })

  it('streams the selected channel newest first, or oldest first', () => {
    const c = useBroadcastConsole(ref(broadcastMocks))
    c.select('private-orders.42')
    expect(c.stream.value.map((e) => e.uuid)).toEqual(['bc-0002', 'bc-0003', 'bc-0001'])
    c.order.value = 'oldest'
    expect(c.stream.value.map((e) => e.uuid)).toEqual(['bc-0001', 'bc-0003', 'bc-0002'])
  })

  it('streams every event for All channels and narrows by the search', () => {
    const query = ref('')
    const c = useBroadcastConsole(ref(broadcastMocks), query)
    c.select(ALL_CHANNELS)
    expect(c.stream.value).toHaveLength(broadcastMocks.length)
    query.value = 'StockChanged'
    expect(c.stream.value.every((e) => e.payload.name === 'StockChanged')).toBe(true)
  })

  it('filters the channel list by name, also inside a folded family', () => {
    const c = useBroadcastConsole(ref(broadcastMocks))
    c.channelFilter.value = 'products.120'
    expect(c.visibleChannels.value.map((ch) => ch.id)).toEqual(['products.*'])
  })

  it('drops the selection when the channel goes away', () => {
    const events = ref(broadcastMocks)
    const c = useBroadcastConsole(events)
    c.select('private-cart.9f2c1a')
    expect(c.hasSelection.value).toBe(true)
    events.value = []
    expect(c.hasSelection.value).toBe(false)
  })

  it('opens an event on its first channel, unfolded', () => {
    const c = useBroadcastConsole(ref(broadcastMocks))
    expect(c.openEvent('missing')).toBe(false)
    expect(c.openEvent(broadcastMultiChannelMock.uuid)).toBe(true)
    expect(c.selectedId.value).toBe('private-orders.42')
    expect(c.expandedId.value).toBe(broadcastMultiChannelMock.uuid)
    c.toggle(broadcastMultiChannelMock.uuid)
    expect(c.expandedId.value).toBeNull()
  })

  it('compares an event with the previous one of its name on the channel', () => {
    const c = useBroadcastConsole(ref(broadcastMocks))
    c.select('private-orders.42')
    expect(c.previousOf(broadcastOrderStatusMock)?.uuid).toBe(broadcastOrderStatusPrevMock.uuid)
    expect(c.previousOf(broadcastOrderStatusPrevMock)).toBeNull()
  })
})

describe('listKeyTarget', () => {
  it('moves with the arrows and jumps with Home and End, within the list', () => {
    expect(listKeyTarget('ArrowDown', 0, 3)).toBe(1)
    expect(listKeyTarget('ArrowDown', 2, 3)).toBe(2)
    expect(listKeyTarget('ArrowUp', 0, 3)).toBe(0)
    expect(listKeyTarget('Home', 2, 3)).toBe(0)
    expect(listKeyTarget('End', 0, 3)).toBe(2)
    expect(listKeyTarget('Enter', 0, 3)).toBeNull()
    expect(listKeyTarget('ArrowDown', 0, 0)).toBeNull()
  })
})
