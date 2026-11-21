import { describe, expect, it } from 'vitest'
import {
  broadcastMocks,
  broadcastMultiChannelMock,
  broadcastOrderStatusMock,
  broadcastOrderStatusPrevMock,
  broadcastProductsMocks
} from '../mocks'
import type { BroadcastEvent } from '../types'
import { buildChannelList, compareChannel, eventsOfChannel, matchesQuery, previousSameEvent } from './channels'

const ev = (uuid: string, timestamp: number, name: string, channels: string[], data = '{}'): BroadcastEvent => ({
  uuid,
  type: 'broadcast',
  project: null,
  timestamp,
  payload: { app_id: 'a', name, channels, channel_kinds: [], data, signature: 'not_checked', size: data.length, warnings: [] }
})

describe('buildChannelList', () => {
  it('makes one row per channel, newest activity first, with event counts', () => {
    const list = buildChannelList([ev('1', 10, 'A', ['x']), ev('2', 30, 'B', ['y', 'x']), ev('3', 20, 'C', ['z'])])
    expect(list.map((c) => [c.id, c.count, c.last.uuid])).toEqual([
      ['x', 2, '2'],
      ['y', 1, '2'],
      ['z', 1, '3']
    ])
  })

  it('gives each row the kind of its channel', () => {
    const list = buildChannelList([
      ev('1', 1, 'A', ['private-encrypted-p.1', 'private-o.1', 'presence-r.1', '#server-to-user-7', 'news'])
    ])
    expect(Object.fromEntries(list.map((c) => [c.id, c.kind]))).toEqual({
      'private-encrypted-p.1': 'encrypted',
      'private-o.1': 'private',
      'presence-r.1': 'presence',
      '#server-to-user-7': 'user',
      news: 'public'
    })
  })

  it('folds a family of numbered channels into one row and counts an event once', () => {
    const many = ev('m', 50, 'StockChanged', ['products.1', 'products.2', 'products.3', 'products.4', 'products.5'])
    const list = buildChannelList([many, ev('o', 40, 'StockChanged', ['products.9']), ev('p', 10, 'A', ['orders.1'])])
    expect(list.map((c) => [c.id, c.count])).toEqual([
      ['products.*', 2],
      ['orders.1', 1]
    ])
    expect(list[0].channels).toHaveLength(6)
  })

  it('keeps a small family as separate rows', () => {
    const list = buildChannelList(broadcastProductsMocks.slice(0, 4))
    expect(list.map((c) => c.id)).toEqual(['products.121', 'products.120', 'products.119', 'products.118'])
  })

  it('folds the mock shop data as the design shows it', () => {
    const ids = buildChannelList(broadcastMocks).map((c) => c.id)
    expect(ids).toContain('products.*')
    expect(ids[0]).toBe('private-orders.42')
  })
})

describe('stream helpers', () => {
  const events = [ev('1', 1, 'A', ['x']), ev('2', 2, 'A', ['y']), ev('3', 3, 'A', ['x', 'y']), ev('4', 4, 'B', ['x'])]

  it('takes the events of a channel, or all of them', () => {
    const [x] = buildChannelList(events).filter((c) => c.id === 'x')
    expect(eventsOfChannel(events, x).map((e) => e.uuid)).toEqual(['1', '3', '4'])
    expect(eventsOfChannel(events, null)).toHaveLength(4)
  })

  it('compares on the selected channel, or the first channel in All', () => {
    const [y] = buildChannelList(events).filter((c) => c.id === 'y')
    expect(compareChannel(events[2], y)).toBe('y')
    expect(compareChannel(events[2], null)).toBe('x')
  })

  it('finds the previous event with the same name on the same channel', () => {
    expect(previousSameEvent(events, events[2], 'x')?.uuid).toBe('1')
    expect(previousSameEvent(events, events[2], 'y')?.uuid).toBe('2')
    // first of its name on the channel: nothing to compare with
    expect(previousSameEvent(events, events[0], 'x')).toBeNull()
    expect(previousSameEvent(events, events[3], 'x')).toBeNull()
    expect(previousSameEvent(events, events[2], null)).toBeNull()
  })

  it('finds the previous OrderStatusUpdated of the mock order', () => {
    expect(previousSameEvent(broadcastMocks, broadcastOrderStatusMock, 'private-orders.42')).toBe(
      broadcastOrderStatusPrevMock
    )
  })

  it('matches a query in the name, a channel or the data', () => {
    const e = ev('q', 1, 'OrderShipped', ['private-orders.42'], '{"carrier":"UPS"}')
    expect(matchesQuery(e, 'ordership')).toBe(true)
    expect(matchesQuery(e, 'orders.42')).toBe(true)
    expect(matchesQuery(e, 'ups')).toBe(true)
    expect(matchesQuery(e, 'fedex')).toBe(false)
    expect(matchesQuery(broadcastMultiChannelMock, '')).toBe(true)
  })
})
