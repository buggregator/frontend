import { storeToRefs } from 'pinia'
import { computed, ref, watch, type Ref } from 'vue'
import { useEventsRequests } from '@/shared/lib/io'
import { DEFAULT_PERIOD, useEventsStore } from '@/shared/stores'

// Whether Home shows the channel panel (#6012): only while the project has no
// event at all. A period or a search that hides events keeps the usual page.
// Once shown it stays while the person is on it, so the page does not swap
// under the cursor when the first event comes; `openList` leaves it.
export const useEmptyHome = (
  isHome: Ref<boolean>,
  hasAny: () => Promise<boolean> = () => useEventsRequests().hasAny()
) => {
  const { events, listState, searchQuery, period, activeProjectKey } = storeToRefs(useEventsStore())

  const listEmpty = computed(
    () => listState.value === 'ready' && events.value.length === 0 && !searchQuery.value.trim()
  )

  // A narrowed period: ask the server whether older events exist.
  const noneAtAll = ref<boolean | null>(null)
  watch(
    () => [listEmpty.value, period.value, activeProjectKey.value] as const,
    ([empty, p, project]) => {
      noneAtAll.value = null
      if (!empty || p === DEFAULT_PERIOD) return
      hasAny()
        .then((any) => {
          if (period.value === p && activeProjectKey.value === project) noneAtAll.value = !any
        })
        .catch(() => {
          // Unknown: keep the usual page.
        })
    },
    { immediate: true }
  )

  const isEmpty = computed(
    () => listEmpty.value && (period.value === DEFAULT_PERIOD || noneAtAll.value === true)
  )

  const show = ref(false)
  watch(
    () => isHome.value && isEmpty.value,
    (empty) => {
      if (empty) show.value = true
    },
    { immediate: true }
  )
  // Another project or page: decide again.
  watch([activeProjectKey, isHome], () => {
    show.value = isHome.value && isEmpty.value
  })

  return { show, openList: () => (show.value = false) }
}
