import type { Ref } from 'vue'
import { computed, nextTick, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import { buildLayout, visibleRange, type VirtualLayout } from './virtual-layout'

type Options = {
  // px rendered above and below the viewport
  overscan?: number
  // height assumed for an item not measured yet, until one is measured
  estimate?: number
  // items rendered before the scroller has a height
  firstPage?: number
}

// Renders only the items near the viewport of a scrolling list whose items
// have different heights. Each rendered item needs `id = key` and the
// `data-virtual-item` attribute.
//
// Owns: item heights (measured with ResizeObserver, kept by key), scroll
// position, and the scroll anchor. Items added, removed or resized above the
// first visible one would move it, so the scroll position is corrected to
// keep it where it was; at the very top nothing is corrected, so new items
// show.
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
  const range = computed(() =>
    visibleRange(layout.value, scrollTop.value, viewport.value, overscan, firstPage)
  )
  const padTop = computed(() => layout.value.offsets[range.value.start] ?? 0)
  const padBottom = computed(() => {
    const { end } = range.value
    const { offsets, total } = layout.value
    return end < offsets.length ? total - offsets[end] : 0
  })

  // What the screen shows now: the keys and layout of the last render.
  let shown: { keys: string[]; layout: VirtualLayout } = { keys: keys.value, layout: layout.value }

  // The anchor: the first item on screen and how far the screen top is into
  // it. Taken from the live scrollTop just before keys or heights change, and
  // put back once the change has rendered. An anchor item that leaves the
  // list hands over to the next one that stays.
  let anchor: { key: string; delta: number } | null = null

  const takeAnchor = () => {
    anchor = null
    const top = scroller.value?.scrollTop ?? 0
    if (top <= 0) return
    const { offsets, heights: hs } = shown.layout
    const first = offsets.findIndex((o, i) => o + hs[i] > top)
    if (first < 0) return
    const stays = new Set(keys.value)
    for (let i = first; i < shown.keys.length; i++) {
      if (stays.has(shown.keys[i])) {
        anchor = { key: shown.keys[i], delta: top - offsets[i] }
        return
      }
    }
  }

  const restoreAnchor = () => {
    const el = scroller.value
    const kept = anchor
    anchor = null
    if (!el || !kept) return
    const i = keys.value.indexOf(kept.key)
    if (i < 0) return
    const wanted = Math.max(0, Math.round(layout.value.offsets[i] + kept.delta))
    if (Math.abs(el.scrollTop - wanted) >= 1) {
      el.scrollTop = wanted
    }
    scrollTop.value = el.scrollTop
  }

  // Before the change renders: anchor on what the screen shows.
  watch([keys, heights], takeAnchor, { flush: 'pre' })
  // After it rendered with the new padding: put the anchor back.
  watch(
    layout,
    (next) => {
      restoreAnchor()
      shown = { keys: keys.value, layout: next }
    },
    { flush: 'post' }
  )

  // Heights of items that left the list: kept while the list is filtered
  // (a search narrows it, clearing the search brings them back), dropped once
  // they outnumber the list, so a long session does not grow the map.
  watch(keys, (list) => {
    const map = heights.value
    if (map.size <= list.length * 2 + 100) return
    const present = new Set(list)
    const next = new Map<string, number>()
    map.forEach((h, key) => present.has(key) && next.set(key, h))
    heights.value = next
  })

  let frame = 0
  const onScroll = () => {
    if (frame) return
    frame = requestAnimationFrame(() => {
      frame = 0
      if (scroller.value) scrollTop.value = scroller.value.scrollTop
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
    el.querySelectorAll('[data-virtual-item]').forEach((item) => {
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
  // then let the browser align the rendered element. Resolves once the item
  // is in the DOM.
  const scrollToKey = async (key: string, behavior: ScrollBehavior = 'smooth') => {
    const el = scroller.value
    const i = keys.value.indexOf(key)
    if (!el || i < 0) return
    const rendered = document.getElementById(key)
    if (rendered) {
      rendered.scrollIntoView({ block: 'nearest', behavior })
      return
    }
    const { offsets, heights: hs } = layout.value
    const top = offsets[i]
    const bottom = top + hs[i]
    el.scrollTop = top < el.scrollTop ? top : Math.max(0, bottom - el.clientHeight)
    scrollTop.value = el.scrollTop
    await nextTick()
    document.getElementById(key)?.scrollIntoView({ block: 'nearest' })
  }

  return { scroller, range, padTop, padBottom, scrollToKey }
}
