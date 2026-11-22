import { useDebounceFn } from '@vueuse/core'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { parseLogsQuery, sameFilters, toLogsQuery, type LogsFilters } from './logs-filters'

// The Logs page's filters, kept in the URL query (shareable, Back works).
// The search box is typed into `search`; it reaches the URL after a pause in
// typing, so the list is not fetched on every key.
export const useLogsQuery = (searchDelay = 300) => {
  const route = useRoute()
  const router = useRouter()

  const filters = computed<LogsFilters>(() => parseLogsQuery(route.query))

  const setFilters = (patch: Partial<LogsFilters>) => {
    const next = { ...filters.value, ...patch }
    if (sameFilters(next, filters.value)) return Promise.resolve()
    // Keys of other pages' features (none today) stay as they are.
    const { q: _q, level: _l, channel: _c, window: _w, trace: _t, ...rest } = route.query
    return router.replace({ query: { ...rest, ...toLogsQuery(next) } })
  }

  const search = ref(filters.value.q)
  const pushSearch = useDebounceFn(() => setFilters({ q: search.value.trim() }), searchDelay)
  watch(search, () => {
    if (search.value.trim() !== filters.value.q) pushSearch()
  })
  // The URL changed by itself (Back, a link): the box follows.
  watch(
    () => filters.value.q,
    (q) => {
      if (q !== search.value.trim()) search.value = q
    }
  )

  return { filters, search, setFilters }
}
