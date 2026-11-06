import type { Ref } from 'vue'
import { computed, nextTick, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import { buildLayout, visibleRange } from './virtual-layout'

type Options = {
  // px rendered above and below the viewport
  overscan?: number
  // height assumed for an item not measured yet, until one is measured
  estimate?: number
  // items rendered before the scroller has a height
  firstPage?: number
}

// Renders only the items near the viewport of a scrolling list whose items
// have different heights. The list element must give each item `id = key`.
//
// Owns: item heights (measured with ResizeObserver, kept by key), scroll
// position, and the scroll anchor. Items added or resized above the first
// visible one move it, so the scroll position is corrected to keep that item
// where it was; at the very top nothing is corrected, so new items show.
export function useVirtualFeed(keys: Ref<string[]>, options: Options = {}) {
  const { overscan = 800, estimate = 140, firstPage = 30 } = options

  const scroller = ref<HTMLElement | null>(null)
  const scrollTop = ref(0)
  const viewport = ref(0)
  const heights = shallowRef(new Map<string, number>())

  const averageHeight = computed(() => {
    const map = heights.value
    if (!map.size) return estimate
    let sum = 0
    map.forEach((h) => (sum += h))
    return sum / map.size
  })

  const layout = computed(() => buildLayout(keys.value, heights.value, averageHeight.value))
  const range = computed(() => visibleRange(layout.value, scrollTop.value, viewport.value, overscan, firstPage))
  const padTop = computed(() => layout.value.offsets[range.value.start] ?? 0)
  const padBottom = computed(() => {
    const { end } = range.value
    const { offsets, total } = layout.value
    return end < offsets.length ? total - offsets[end] : 0
  })

  // The anchor: first item on screen and how far the screen top is into it.
  let anchor: { key: string; delta: number } | null = null
  const takeAnchor = () => {
    const top = scrollTop.value
    if (top <= 0) {
      anchor = null
      return
    }
    const { offsets, heights: hs } = layout.value
    const i = offsets.findIndex((o, idx) => o + hs[idx] > top)
    anchor = i < 0 ? null : { key: keys.value[i], delta: top - offsets[i] }
  }

  const restoreAnchor = () => {
    const el = scroller.value
    if (!el || !anchor) return
    const i = keys.value.indexOf(anchor.key)
    if (i < 0) return
    const wanted = Math.round(layout.value.offsets[i] + anchor.delta)
    if (Math.abs(el.scrollTop - wanted) >= 1) {
      el.scrollTop = wanted
      scrollTop.value = el.scrollTop
    }
  }

  // Layout changes (items added or removed, heights measured): render with the
  // new padding, then put the anchor item back where it was.
  watch(layout, () => nextTick(restoreAnchor), { flush: 'post' })

  let frame = 0
  const onScroll = () => {
    if (frame) return
    frame = requestAnimationFrame(() => {
      frame = 0
      if (!scroller.value) return
      scrollTop.value = scroller.value.scrollTop
      takeAnchor()
    })
  }

  let sizeObserver: ResizeObserver | null = null
  const measure = (entries: ResizeObserverEntry[]) => {
    let next: Map<string, number> | null = null
    for (const entry of entries) {
      const el = entry.target as HTMLElement
      if (el === scroller.value) {
        viewport.value = el.clientHeight
        continue
      }
      const h = entry.borderBoxSize?.[0]?.blockSize ?? el.getBoundingClientRect().height
      if (!el.id || !h || heights.value.get(el.id) === h) continue
      next ??= new Map(heights.value)
      next.set(el.id, h)
    }
    if (next) heights.value = next
  }

  // Observe the items now in the DOM; called after each render of the list.
  const observed = new Set<Element>()
  const observeItems = () => {
    const el = scroller.value
    if (!el || !sizeObserver) return
    const present = new Set<Element>()
    el.querySelectorAll(':scope [data-virtual-item]').forEach((item) => {
      present.add(item)
      if (!observed.has(item)) {
        sizeObserver!.observe(item)
        observed.add(item)
      }
    })
    observed.forEach((item) => {
      if (!present.has(item)) {
        sizeObserver!.unobserve(item)
        observed.delete(item)
      }
    })
  }

  watch(range, () => nextTick(observeItems), { flush: 'post' })

  watch(scroller, (el, old) => {
    old?.removeEventListener('scroll', onScroll)
    sizeObserver?.disconnect()
    observed.clear()
    if (!el) return
    el.addEventListener('scroll', onScroll, { passive: true })
    viewport.value = el.clientHeight
    scrollTop.value = el.scrollTop
    if (typeof ResizeObserver !== 'undefined') {
      sizeObserver = new ResizeObserver(measure)
      sizeObserver.observe(el)
      nextTick(observeItems)
    }
  })

  onBeforeUnmount(() => {
    scroller.value?.removeEventListener('scroll', onScroll)
    sizeObserver?.disconnect()
    if (frame) cancelAnimationFrame(frame)
  })

  // Bring an item into view even when it is not rendered: jump to its place,
  // then let the browser align the rendered element.
  const scrollToKey = (key: string, behavior: ScrollBehavior = 'smooth') => {
    const el = scroller.value
    const i = keys.value.indexOf(key)
    if (!el || i < 0) return
    const rendered = document.getElementById(key)
    if (!rendered) {
      const { offsets, heights: hs } = layout.value
      const top = offsets[i]
      const bottom = top + hs[i]
      el.scrollTop = top < el.scrollTop ? top : Math.max(0, bottom - el.clientHeight)
      scrollTop.value = el.scrollTop
      takeAnchor()
      nextTick(() => document.getElementById(key)?.scrollIntoView({ block: 'nearest' }))
      return
    }
    rendered.scrollIntoView({ block: 'nearest', behavior })
  }

  return { scroller, range, padTop, padBottom, scrollToKey }
}
