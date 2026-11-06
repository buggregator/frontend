// Pure layout math for a list whose items have different heights.

export type VirtualLayout = {
  // top of item i, in px from the top of the list
  offsets: number[]
  heights: number[]
  total: number
}

// Items are stacked in order; an item not measured yet counts as `estimate`.
export const buildLayout = (
  keys: string[],
  measured: Map<string, number>,
  estimate: number
): VirtualLayout => {
  const offsets: number[] = new Array(keys.length)
  const heights: number[] = new Array(keys.length)
  let top = 0
  keys.forEach((key, i) => {
    offsets[i] = top
    heights[i] = measured.get(key) ?? estimate
    top += heights[i]
  })
  return { offsets, heights, total: top }
}

// First item whose bottom is below `y`.
const indexAt = ({ offsets, heights }: VirtualLayout, y: number): number => {
  let lo = 0
  let hi = offsets.length - 1
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (offsets[mid] + heights[mid] <= y) lo = mid + 1
    else hi = mid
  }
  return lo
}

// Items to render: [start, end). They cover the viewport and `overscan` px
// above and below it. Before the viewport has a height (not mounted, or a
// test without layout), the first `firstPage` items.
export const visibleRange = (
  layout: VirtualLayout,
  scrollTop: number,
  viewport: number,
  overscan: number,
  firstPage = 0
): { start: number; end: number } => {
  const count = layout.offsets.length
  if (count === 0) return { start: 0, end: 0 }
  if (viewport <= 0) return { start: 0, end: Math.min(count, firstPage) }

  const start = indexAt(layout, Math.max(0, scrollTop - overscan))
  const last = indexAt(layout, scrollTop + viewport + overscan)
  const end = layout.offsets[last] < scrollTop + viewport + overscan ? last + 1 : last
  return { start, end: Math.min(count, end) }
}
