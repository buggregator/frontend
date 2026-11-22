import { describe, expect, it } from 'vitest'
import {
  hasNarrowing,
  isLevelOn,
  parseLogsQuery,
  searchWords,
  toLogsQuery,
  toggleLevel,
  windowSeconds
} from './logs-filters'

describe('logs filters ↔ URL query', () => {
  it('reads the query, repeated keys as lists, the last hour by default', () => {
    expect(
      parseLogsQuery({
        q: ' order  ',
        level: ['ERROR', 'warning', 'warning'],
        channel: 'payments',
        trace: 'abc'
      })
    ).toEqual({
      q: 'order',
      levels: ['error', 'warning'],
      channels: ['payments'],
      window: '1h',
      trace: 'abc'
    })
    expect(parseLogsQuery({})).toEqual({ q: '', levels: [], channels: [], window: '1h', trace: '' })
  })

  it('writes only what differs from the defaults', () => {
    expect(toLogsQuery({ q: '', levels: [], channels: [], window: '1h', trace: '' })).toEqual({
      q: undefined,
      level: undefined,
      channel: undefined,
      window: undefined,
      trace: undefined
    })
    const f = { q: 'card', levels: ['error'], channels: ['a', 'b'], window: '24h', trace: 't1' }
    expect(toLogsQuery(f)).toEqual({
      q: 'card',
      level: ['error'],
      channel: ['a', 'b'],
      window: '24h',
      trace: 't1'
    })
    // A round trip gives the same filters back.
    expect(parseLogsQuery(toLogsQuery(f) as never)).toEqual(f)
  })

  it('level chips: all on without a pick, the rest on after turning one off', () => {
    const all = ['debug', 'info', 'error']
    expect(isLevelOn([], 'debug')).toBe(true)
    expect(toggleLevel([], 'debug', all)).toEqual(['info', 'error'])
    expect(toggleLevel(['info', 'error'], 'debug', all)).toEqual([])
    expect(toggleLevel(['error'], 'info', all)).toEqual(['info', 'error'])
  })

  it('splits the search into distinct words', () => {
    expect(searchWords('  Order  FAILED order ')).toEqual(['order', 'failed'])
    expect(searchWords('')).toEqual([])
  })

  it('reads a window in seconds, all time as none', () => {
    expect(windowSeconds('1h')).toBe(3600)
    expect(windowSeconds('7d')).toBe(604800)
    expect(windowSeconds('all')).toBeNull()
  })

  it('narrowing: a search or a pick, not the window or a trace', () => {
    const base = { q: '', levels: [], channels: [], window: '3h', trace: 't' }
    expect(hasNarrowing(base)).toBe(false)
    expect(hasNarrowing({ ...base, channels: ['a'] })).toBe(true)
  })
})
