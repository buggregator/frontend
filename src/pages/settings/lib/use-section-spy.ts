import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

export type SectionBox = {
  id: string
  // The section's top, in px from the top of the visible area.
  top: number
}

// The section to mark (#5874): the last one whose top passed a line. The
// page is short, so the last sections never reach the top: the line moves
// down as the page scrolls, from a quarter of the view at the start to its
// bottom at the end. Every section gets its turn, the last one at the end.
export const pickSection = (
  boxes: readonly SectionBox[],
  view: { height: number; progress: number }
): string | undefined => {
  if (!boxes.length) return undefined
  const line = view.height * (0.25 + 0.75 * Math.min(1, Math.max(0, view.progress)))
  const passed = boxes.filter((box) => box.top < line)
  return (passed.at(-1) ?? boxes[0]).id
}

const scrollerOf = (el: HTMLElement | null): HTMLElement | null => {
  for (let node = el?.parentElement ?? null; node; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node)
    if (overflowY === 'auto' || overflowY === 'scroll') return node
  }
  return null
}

// Keys that scroll the page: they end a pin, like the wheel or a touch.
const SCROLL_KEYS = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '])

// The section the reader is in. A section picked from the list or named in the
// address (#updates) stays marked until the person scrolls on their own.
export const useSectionSpy = (ids: () => string[], hash: () => string = () => '') => {
  const active = ref(ids()[0] ?? '')
  let pinned = ''
  let scroller: HTMLElement | null = null

  const update = () => {
    if (pinned || !scroller) return
    const view = scroller.getBoundingClientRect()
    const boxes = ids()
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el)
      .map((el) => ({ id: el.id, top: el.getBoundingClientRect().top - view.top }))
    const range = scroller.scrollHeight - scroller.clientHeight
    const id = pickSection(boxes, {
      height: scroller.clientHeight,
      progress: range > 0 ? scroller.scrollTop / range : 0
    })
    if (id) active.value = id
  }

  const setActive = (id: string) => {
    active.value = id
    pinned = id
  }

  const unpin = () => {
    pinned = ''
  }
  const unpinOnKey = (e: KeyboardEvent) => {
    if (SCROLL_KEYS.has(e.key)) unpin()
  }

  watch(
    hash,
    (value) => {
      const id = value.slice(1)
      if (ids().includes(id)) setActive(id)
    },
    { immediate: true }
  )

  onMounted(() => {
    scroller = scrollerOf(document.getElementById(ids()[0] ?? ''))
    if (!scroller) return
    scroller.addEventListener('scroll', update, { passive: true })
    scroller.addEventListener('wheel', unpin, { passive: true })
    scroller.addEventListener('touchstart', unpin, { passive: true })
    // Dragging the scrollbar.
    scroller.addEventListener('pointerdown', unpin, { passive: true })
    document.addEventListener('keydown', unpinOnKey)
    update()
  })

  onBeforeUnmount(() => {
    scroller?.removeEventListener('scroll', update)
    scroller?.removeEventListener('wheel', unpin)
    scroller?.removeEventListener('touchstart', unpin)
    scroller?.removeEventListener('pointerdown', unpin)
    document.removeEventListener('keydown', unpinOnKey)
  })

  return { active, setActive }
}
