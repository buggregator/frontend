import { storeToRefs } from 'pinia'
import { watch } from 'vue'
import { useRoute, useRouter, type LocationQuery, type LocationQueryRaw } from 'vue-router'
import { useEventsStore } from '../../stores'
import { filtersFromQuery, filtersKey, filtersToParams, isFilterParam, type FeedFilter } from './feed-filters'

// The address with these filters, other parameters kept: a link to the same
// selection (`/monolog?host=anna-mbp&not.channel=doctrine`).
export const queryWithFilters = (query: LocationQuery, filters: FeedFilter[]): LocationQueryRaw => {
  const next: Record<string, string | (string | null)[] | null> = {}
  for (const [key, value] of Object.entries(query)) {
    if (!isFilterParam(key)) next[key] = value
  }
  for (const [key, value] of filtersToParams(filters)) {
    const had = next[key]
    next[key] = had === undefined ? value : [...(Array.isArray(had) ? had : [had]), value]
  }
  return next
}

// The feed filters live in the store (they survive moving between feed
// pages) and are mirrored in the page address. A link or Back/Forward with
// filters in it sets them; a page opened without any (a sidebar link) gets
// the current ones written in.
export const useFeedFiltersRoute = () => {
  const route = useRoute()
  const router = useRouter()
  const store = useEventsStore()
  const { filters } = storeToRefs(store)

  let lastPath: string | null = null

  const writeAddress = () => {
    if (filtersKey(filtersFromQuery(route.query)) === filtersKey(filters.value)) return
    router.replace({ query: queryWithFilters(route.query, filters.value), hash: route.hash })
  }

  watch(
    () => route.fullPath,
    () => {
      const fromAddress = filtersFromQuery(route.query)
      const samePage = route.path === lastPath
      lastPath = route.path

      if (fromAddress.length || samePage) {
        store.setFilters(fromAddress)
      } else {
        writeAddress()
      }
    },
    { immediate: true },
  )

  watch(() => filtersKey(filters.value), writeAddress)
}
