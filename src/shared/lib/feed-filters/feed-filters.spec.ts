import { describe, expect, it } from 'vitest'
import {
  filtersFromQuery,
  filtersKey,
  filtersToParams,
  isFilterParam,
  matchesFilters,
  withFilter,
  withoutFilter,
  type FeedFilter,
} from './feed-filters'

const host = (value: string, not = false): FeedFilter => ({ key: 'host', value, not })

describe('feed filters: page address', () => {
  it('writes the server parameters: repeated keys, not.<key>, tag=name:value', () => {
    expect(filtersToParams([
      host('anna-mbp'),
      host('max-xps'),
      { key: 'channel', value: 'doctrine', not: true },
      { key: 'tag:feature', value: 'checkout_v2', not: false },
    ])).toEqual([
      ['host', 'anna-mbp'],
      ['host', 'max-xps'],
      ['not.channel', 'doctrine'],
      ['tag', 'feature:checkout_v2'],
    ])
  })

  it('reads them back and ignores other parameters, unknown keys and empty values', () => {
    expect(filtersFromQuery({
      host: ['anna-mbp', 'max-xps'],
      'not.channel': 'doctrine',
      tag: 'browser:Chrome 131',
      period: '24h',
      colour: 'red',
      env: '',
      'not.tag': 'broken',
    })).toEqual([
      host('anna-mbp'),
      host('max-xps'),
      { key: 'channel', value: 'doctrine', not: true },
      { key: 'tag:browser', value: 'Chrome 131', not: false },
    ])
  })

  it('round-trips through the address', () => {
    const filters = [host('web-1'), { key: 'tag:queue', value: 'payments', not: true }]
    const query = Object.fromEntries(filtersToParams(filters))
    expect(filtersFromQuery(query)).toEqual(filters)
  })

  it('tells filter parameters from the page’s own', () => {
    expect(['host', 'not.level', 'tag', 'not.tag'].every(isFilterParam)).toBe(true)
    expect(['period', 'q', 'project'].some(isFilterParam)).toBe(false)
  })

  it('gives the same key whatever the order', () => {
    expect(filtersKey([host('b'), host('a')])).toBe(filtersKey([host('a'), host('b')]))
    expect(filtersKey([host('a')])).not.toBe(filtersKey([host('a', true)]))
  })
})

describe('feed filters: editing', () => {
  it('does not add the same filter twice', () => {
    expect(withFilter([host('a')], host('a'))).toEqual([host('a')])
  })

  it('the other sign of a value replaces it', () => {
    expect(withFilter([host('a'), host('b')], host('a', true))).toEqual([host('b'), host('a', true)])
  })

  it('removes one filter', () => {
    expect(withoutFilter([host('a'), host('b')], host('a'))).toEqual([host('b')])
  })
})

describe('feed filters: live events', () => {
  const facets = { host: ['anna-mbp'], channel: ['security'], level: ['warning'] }

  it('passes everything without filters, even an event without facets', () => {
    expect(matchesFilters(undefined, [])).toBe(true)
  })

  it('any value of one key matches (OR)', () => {
    expect(matchesFilters(facets, [host('max-xps'), host('anna-mbp')])).toBe(true)
    expect(matchesFilters(facets, [host('max-xps')])).toBe(false)
  })

  it('different keys all have to match (AND)', () => {
    expect(matchesFilters(facets, [host('anna-mbp'), { key: 'channel', value: 'app', not: false }])).toBe(false)
  })

  it('an include hides events without the key; an exclude keeps them', () => {
    expect(matchesFilters({}, [host('anna-mbp')])).toBe(false)
    expect(matchesFilters({}, [{ key: 'channel', value: 'doctrine', not: true }])).toBe(true)
    expect(matchesFilters(facets, [{ key: 'channel', value: 'security', not: true }])).toBe(false)
  })

  it('compares levels without case, like the server', () => {
    expect(matchesFilters(facets, [{ key: 'level', value: 'WARNING', not: false }])).toBe(true)
  })
})
