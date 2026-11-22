import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import BarHistogram from './bar-histogram.vue'
import { fillBuckets, type BarBucket } from './fill-buckets'

describe('fillBuckets', () => {
  it('fills the minutes the server left out with zero', () => {
    const bars = fillBuckets(
      [
        { t: 120, values: { error: 2 } },
        { t: 300, values: { other: 5 } }
      ],
      60,
      60,
      359
    )
    expect(bars.map((b) => b.t)).toEqual([60, 120, 180, 240, 300])
    expect(bars.map((b) => b.values)).toEqual([{}, { error: 2 }, {}, {}, { other: 5 }])
  })

  it('aligns the range to the bucket and adds up points of one bar', () => {
    const bars = fillBuckets(
      [
        { t: 3600, values: { a: 1 } },
        { t: 3700, values: { a: 2, b: 1 } }
      ],
      1800,
      3500,
      5500
    )
    expect(bars).toEqual([
      { t: 1800, values: {} },
      { t: 3600, values: { a: 3, b: 1 } },
      { t: 5400, values: {} }
    ])
  })

  it('keeps the newest bars past the limit and drops points outside', () => {
    const bars = fillBuckets(
      [
        { t: 0, values: { a: 1 } },
        { t: 540, values: { a: 4 } }
      ],
      60,
      0,
      599,
      3
    )
    expect(bars.map((b) => b.t)).toEqual([420, 480, 540])
    expect(bars[2].values).toEqual({ a: 4 })
  })

  it('gives nothing for a broken range', () => {
    expect(fillBuckets([], 0, 0, 10)).toEqual([])
    expect(fillBuckets([], 60, 100, 10)).toEqual([])
  })
})

describe('BarHistogram', () => {
  const series = [
    { key: 'error', label: 'error', tone: 'error' as const },
    { key: 'warning', label: 'warning', tone: 'warning' as const },
    { key: 'other', label: 'other', tone: 'neutral' as const }
  ]
  // 13:00, 13:01, 13:02 local time
  const at = (min: number) => new Date(2026, 10, 22, 13, min).getTime() / 1000
  const bars: BarBucket[] = [
    { t: at(0), values: { error: 2, other: 2 } },
    { t: at(1), values: {} },
    { t: at(2), values: { warning: 1, other: 3 } }
  ]

  it('draws one stacked column per bar, series bottom up', () => {
    const wrapper = mount(BarHistogram, { props: { bars, series, label: 'Lines per minute' } })
    const cols = wrapper.findAll('[data-test="bar-histogram-bar"]')
    expect(cols).toHaveLength(3)
    expect(cols[0].findAll('[data-series]').map((r) => r.attributes('data-series'))).toEqual([
      'error',
      'other'
    ])
    expect(cols[1].findAll('[data-series]')).toHaveLength(0)
    // The error part sits under the rest: lower in the SVG means a bigger y.
    const [err, other] = cols[0].findAll('[data-series]')
    expect(Number(err.attributes('y'))).toBeGreaterThan(Number(other.attributes('y')))
    expect(cols[0].get('title').text()).toBe('13:00 · 4 (2 error, 2 other)')
  })

  it('names the chart with its totals, shows the legend and the ticks', () => {
    const wrapper = mount(BarHistogram, {
      props: { bars, series, label: 'Lines per minute', endLabel: 'now' },
      slots: { default: '<b>8 lines</b>' }
    })
    expect(wrapper.get('[data-test="bar-histogram-plot"]').attributes('aria-label')).toBe(
      'Lines per minute: 8 in 3 bars, 2 error, 1 warning, 5 other'
    )
    expect(wrapper.findAll('.bar-histogram__legend-item').map((i) => i.text())).toEqual([
      'error',
      'warning',
      'other'
    ])
    expect(wrapper.findAll('.bar-histogram__tick').map((t) => t.text())).toEqual([
      '13:00',
      '13:01',
      'now'
    ])
    expect(wrapper.get('figcaption').text()).toContain('8 lines')
  })
})
