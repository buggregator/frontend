import { useEventListener, useResizeObserver, useDebounceFn } from '@vueuse/core'
import { computed, ref, watch, type Ref } from 'vue'
import { fitContent, zoomAt, type PanZoom, type Size, type ZoomLimits } from './pan-zoom'

// Wheel zoom at the pointer, drag to pan, keyboard (+ − 0 and arrows) and
// fit-to-view on open and on resize until the person moves the view.
// Same gestures as the Vue Flow graphs (Call graph): wheel zooms, drag pans.

const STEP = 1.2
const PAN = 40

export const usePanZoom = (
  box: Ref<HTMLElement | undefined>,
  content: Ref<Size | null>,
  limits: ZoomLimits = { min: 0.2, max: 2 }
) => {
  const view = ref<PanZoom>({ x: 0, y: 0, k: 1 })
  // Moved by the person: a resize no longer refits.
  const touched = ref(false)

  const boxSize = (): Size => ({ width: box.value?.clientWidth ?? 0, height: box.value?.clientHeight ?? 0 })

  const fit = () => {
    if (!content.value) return
    view.value = fitContent(boxSize(), content.value, limits)
    touched.value = false
  }

  const zoomBy = (factor: number, px?: number, py?: number) => {
    const { width, height } = boxSize()
    view.value = zoomAt(view.value, factor, px ?? width / 2, py ?? height / 2, limits)
    touched.value = true
  }
  const panBy = (dx: number, dy: number) => {
    view.value = { ...view.value, x: view.value.x + dx, y: view.value.y + dy }
    touched.value = true
  }

  const zoomIn = () => zoomBy(STEP)
  const zoomOut = () => zoomBy(1 / STEP)

  useEventListener(
    box,
    'wheel',
    (e: WheelEvent) => {
      e.preventDefault()
      const rect = box.value!.getBoundingClientRect()
      // Trackpad pinch arrives as ctrl+wheel with small deltas.
      const factor = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.002))
      zoomBy(factor, e.clientX - rect.left, e.clientY - rect.top)
    },
    { passive: false }
  )

  const drag = ref<{ id: number; x: number; y: number } | null>(null)
  useEventListener(box, 'pointerdown', (e: PointerEvent) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest('button, a')) return
    drag.value = { id: e.pointerId, x: e.clientX, y: e.clientY }
    box.value?.setPointerCapture?.(e.pointerId)
  })
  useEventListener(box, 'pointermove', (e: PointerEvent) => {
    if (!drag.value || drag.value.id !== e.pointerId) return
    panBy(e.clientX - drag.value.x, e.clientY - drag.value.y)
    drag.value = { id: e.pointerId, x: e.clientX, y: e.clientY }
  })
  const endDrag = (e: PointerEvent) => {
    if (drag.value?.id === e.pointerId) drag.value = null
  }
  useEventListener(box, 'pointerup', endDrag)
  useEventListener(box, 'pointercancel', endDrag)

  const onKeydown = (e: KeyboardEvent) => {
    if (e.altKey || e.metaKey || e.ctrlKey) return
    const keys: Record<string, () => void> = {
      '+': zoomIn,
      '=': zoomIn,
      '-': zoomOut,
      '0': fit,
      ArrowLeft: () => panBy(PAN, 0),
      ArrowRight: () => panBy(-PAN, 0),
      ArrowUp: () => panBy(0, PAN),
      ArrowDown: () => panBy(0, -PAN)
    }
    const run = keys[e.key]
    if (!run) return
    e.preventDefault()
    run()
  }

  useResizeObserver(
    box,
    useDebounceFn(() => {
      if (!touched.value) fit()
    }, 60)
  )
  watch(content, (next, prev) => {
    if (next && (!prev || next.width !== prev.width || next.height !== prev.height)) fit()
  })

  const transform = computed(() => `translate(${view.value.x} ${view.value.y}) scale(${view.value.k})`)
  const percent = computed(() => Math.round(view.value.k * 100))
  const dragging = computed(() => drag.value !== null)

  return { view, transform, percent, dragging, zoomIn, zoomOut, fit, onKeydown }
}
