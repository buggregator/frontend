import { computed, onBeforeUnmount, onUpdated, ref, type Ref, watch } from 'vue'
import { PAGE_TYPES } from '@/shared/constants'
import type { TUseEventsApi } from '@/shared/lib/use-events/use-events-api'
import { useEventsStore } from '@/shared/stores'
import type { TEventsCachedIdsMap } from '@/shared/stores/events/types'
import { type EventType, EventTypes, type PageEventTypes } from '@/shared/types'

type UsePreviewEventsLazyLoadingParams = {
  type: Ref<PageEventTypes>
  events: TUseEventsApi
  cachedEvents: {
    idsByType: Ref<TEventsCachedIdsMap>
  }
  listEl: Ref<HTMLElement | null>
}

/**
 * Notes (data loading & scroll handling)
 * - Uses ResizeObserver to recompute scroll availability after DOM size changes.
 * - If the first page fully fits the viewport (no scroll), schedules an autoload of the next page.
 * - If the content is scrollable but very short (maxScrollTop < 200px), forces one extra load.
 * - Uses a temporary lock to prevent duplicate loads caused by intermediate ResizeObserver callbacks.
 */
export const useEventsPagination = ({
  type,
  events,
  cachedEvents,
  listEl
}: UsePreviewEventsLazyLoadingParams) => {
  const eventsStore = useEventsStore()

  const isLoadingMore = ref(false)
  const hasScrollableOverflow = ref(false)

  // If there is no scroll, debounce the autoload:
  // the first page may fully fit the viewport, so we fetch the next page.
  const noScrollAutoLoadTimer = { id: undefined as number | undefined }

  // Debounces ResizeObserver work so layout can settle before recomputing scroll state.
  const resizeDebounceTimer = { id: undefined as number | undefined }

  // Temporarily blocks resize handling after a forced load on short scroll ranges.
  const unlockResizeHandlingTimer = { id: undefined as number | undefined }

  // Delays bottom-gap correction to avoid fighting with ongoing loading/layout.
  const ensureBottomGapTimer = { id: undefined as number | undefined }

  // Prevents back-to-back loadMore calls for the same page type (double triggers).
  const lastLoadAtByType = new Map<PageEventTypes, number>()
  const LOAD_THROTTLE_MS = 200

  const canLoadMore = computed(() => {
    if (type.value === PAGE_TYPES.ALL_EVENT_TYPES) {
      return Object.values(EventTypes).some(
        (eventType) => eventsStore.previewPagination[eventType]?.hasMore
      )
    }

    return eventsStore.previewPagination[type.value as EventTypes]?.hasMore ?? false
  })

  const getDocumentScroller = (): HTMLElement | null => {
    return document.scrollingElement as HTMLElement | null
  }

  const getMaxScrollTop = (el: HTMLElement): number => el.scrollHeight - el.clientHeight

  /**
   * Sometimes events move up due to sorting, leaving the user stuck at the very bottom.
   * If loading is still available, keep a gap from the bottom to ensure the infinite trigger can fire.
   */
  const ensureBottomGap = (): void => {
    const gapPx = 500
    const el = getDocumentScroller()
    if (!el) return

    const maxScrollTop = getMaxScrollTop(el)
    if (maxScrollTop === 0) {
      return
    }

    const distanceToBottom = maxScrollTop - el.scrollTop
    if (distanceToBottom >= gapPx) {
      return
    }

    el.scrollTop = Math.max(0, maxScrollTop - gapPx)
  }

  /**
   * When `force` is false, `loadMore()` won't run if there is no scroll at all.
   * When `force` is true, it bypasses the "no-scroll" guard (used for bootstrap loads).
   */
  const loadMore = async (force = false): Promise<void> => {
    const pageType = type.value
    const now = Date.now()
    const lastLoadAt = lastLoadAtByType.get(pageType)

    // Throttle rapid repeated loads per page type to avoid duplicate fetches
    if (lastLoadAt !== undefined && now - lastLoadAt < LOAD_THROTTLE_MS) {
      return
    }

    if (!force) {
      const el = getDocumentScroller()
      if (!el) return

      const maxScrollTop = getMaxScrollTop(el)
      if (maxScrollTop <= 0) {
        return
      }
    }

    if (isLoadingMore.value || !canLoadMore.value) {
      return
    }

    isLoadingMore.value = true
    lastLoadAtByType.set(pageType, now)

    try {
      if (pageType === PAGE_TYPES.ALL_EVENT_TYPES) {
        const responses = await Promise.all(
          Object.values(EventTypes).map(async (eventType) => await events.loadMoreByType(eventType))
        )

        if (cachedEvents.idsByType.value[PAGE_TYPES.ALL_EVENT_TYPES]?.length) {
          const loadedIds = responses.flatMap(({ data }) => data.map(({ uuid }) => uuid))
          eventsStore.appendCachedIds(PAGE_TYPES.ALL_EVENT_TYPES, loadedIds)
        }

        setManagedTimeout(ensureBottomGapTimer, () => {
          if (canLoadMore.value && hasScrollableOverflow.value) {
            ensureBottomGap()
          }
        }, 200)

        return
      }

      await events.loadMoreByType(type.value as EventType)
    } finally {
      isLoadingMore.value = false
    }
  }

  /**
   * Prevent duplicate loads caused by intermediate ResizeObserver callbacks
   * while the DOM is still settling (e.g., placeholder height, fonts, etc.).
   */
  let isResizeHandlingLocked = false

  const scheduleAutoLoadWhenNoScroll = (el: HTMLElement): void => {
    setManagedTimeout(noScrollAutoLoadTimer, async () => {
      const maxScrollTop = getMaxScrollTop(el)

      // Still no scroll after debounce => likely first page fully fits the viewport.
      if (maxScrollTop <= 0) {
        hasScrollableOverflow.value = false
        await loadMore(true)
      }
    }, 200)
  }

  const computeScrollStateAndMaybeLoad = async (): Promise<void> => {
    const el = getDocumentScroller()
    if (!el) {
      hasScrollableOverflow.value = false
      return
    }

    const maxScrollTop = getMaxScrollTop(el)

    if (maxScrollTop <= 0) {
      // No scroll at all.
      hasScrollableOverflow.value = false

      // Autoload next page if the first page fits the viewport.
      scheduleAutoLoadWhenNoScroll(el)
      return
    }

    hasScrollableOverflow.value = true

    // Scroll exists but is too small: force one more load.
    if (maxScrollTop < 200) {
      isResizeHandlingLocked = true
      await loadMore(true)

      // Keep current behavior: unlock after a short delay.
      setManagedTimeout(unlockResizeHandlingTimer, () => {
        isResizeHandlingLocked = false
      }, 1000)
    }
  }

  let resizeObserver: ResizeObserver | null = null

  let rafId = 0
  const RESIZE_DEBOUNCE_MS = 100

  const setupResizeObserver = (): void => {
    resizeObserver?.disconnect()

    resizeObserver = new ResizeObserver(() => {
      // We intentionally add a small delay (RESIZE_DEBOUNCE_MS)
      // to allow the browser to finish layout and render the scroll state.
      setManagedTimeout(resizeDebounceTimer, () => {
        cancelAnimationFrame(rafId)

        rafId = requestAnimationFrame(() => {
          if (isResizeHandlingLocked) return
          void computeScrollStateAndMaybeLoad()
        })
      }, RESIZE_DEBOUNCE_MS)
    })

    if (listEl.value) {
      resizeObserver.observe(listEl.value)
    }
  }

  const clearManagedTimeout = (timerRef: { id: number | undefined }): void => {
    if (timerRef.id !== undefined) {
      clearTimeout(timerRef.id)
      timerRef.id = undefined
    }
  }

  const setManagedTimeout = (
    timerRef: { id: number | undefined },
    cb: () => void | Promise<void>,
    delayMs: number
  ): void => {
    clearManagedTimeout(timerRef)

    timerRef.id = window.setTimeout(() => {
      timerRef.id = undefined
      void cb()
    }, delayMs)
  }

  const teardownResizeObserver = (): void => {
    hasScrollableOverflow.value = false

    clearManagedTimeout(resizeDebounceTimer)
    clearManagedTimeout(noScrollAutoLoadTimer)
    clearManagedTimeout(unlockResizeHandlingTimer)
    clearManagedTimeout(ensureBottomGapTimer)

    cancelAnimationFrame(rafId)
    rafId = 0

    resizeObserver?.disconnect()
    resizeObserver = null
  }

  watch(
    () => type.value,
    () => {
      teardownResizeObserver()
      setManagedTimeout(ensureBottomGapTimer, () => {
        if (canLoadMore.value) {
          ensureBottomGap()
        }
      }, 200)
    },
  )

  onUpdated(() => {
    setupResizeObserver()
  })

  onBeforeUnmount(() => {
    teardownResizeObserver()
  })

  return {
    canLoadMore,
    isLoadingMore,
    hasScrollableOverflow,
    loadMore
  }
}
