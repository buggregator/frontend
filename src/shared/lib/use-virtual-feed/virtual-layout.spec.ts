import { describe, expect, it } from 'vitest'
import { buildLayout, visibleRange } from './virtual-layout'

describe('buildLayout', () => {
  it('stacks measured heights and estimates the rest', () => {
    const layout = buildLayout(['a', 'b', 'c'], new Map([['b', 50]]), 100)
    expect(layout.offsets).toEqual([0, 100, 150])
    expect(layout.heights).toEqual([100, 50, 100])
    expect(layout.total).toBe(250)
  })

  it('is empty for no keys', () => {
    expect(buildLayout([], new Map(), 100)).toEqual({ offsets: [], heights: [], total: 0 })
  })
})

describe('visibleRange', () => {
  // ten items of 100 px: item i spans [100 i, 100 i + 100)
  const layout = buildLayout('0123456789'.split(''), new Map(), 100)

  it('covers the viewport plus the overscan on both sides', () => {
    expect(visibleRange(layout, 350, 200, 0)).toEqual({ start: 3, end: 6 })
    expect(visibleRange(layout, 350, 200, 100)).toEqual({ start: 2, end: 7 })
  })

  it('stays inside the list at both ends', () => {
    expect(visibleRange(layout, 0, 250, 500)).toEqual({ start: 0, end: 8 })
    expect(visibleRange(layout, 900, 100, 500)).toEqual({ start: 4, end: 10 })
  })

  it('renders a first page when the viewport is not measured yet', () => {
    expect(visibleRange(layout, 0, 0, 100, 4)).toEqual({ start: 0, end: 4 })
  })

  it('is empty for an empty list', () => {
    expect(visibleRange(buildLayout([], new Map(), 100), 0, 500, 100)).toEqual({ start: 0, end: 0 })
  })
})
