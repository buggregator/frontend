import { useDebounceFn } from '@vueuse/core'
import { computed, ref, shallowRef, watch, type Ref } from 'vue'
import type { Monolog } from '@/entities/monolog'
import type { ServerEvent } from '@/shared/types'
import type { LogsHistogram } from './log-bars'
import { LOGS_PAGE_SIZE, useLogsApi, type LogsFacets } from './logs-api'
import { hasNarrowing, sameFilters, type LogsFilters } from './logs-filters'
import { matchesLog } from './match-log'

export type LogsState = 'loading' | 'ready' | 'error'

// The lines, counts and chart of the Logs page for the filters and project
// given. A new filter or project loads again (an older reply that lands late
// is dropped); live lines are added on top and the counts follow them.
export const useLogsData = (
  filters: Ref<LogsFilters>,
  project: Ref<string | undefined>,
  refreshDelay = 1500
) => {
  const api = useLogsApi()

  const state = ref<LogsState>('loading')
  const error = ref('')
  const rows = shallowRef<ServerEvent<Monolog>[]>([])
  const facets = shallowRef<LogsFacets>({})
  // The window without search and picks: «of N lines», lines per request.
  const baseFacets = shallowRef<LogsFacets | null>(null)
  const histogram = shallowRef<LogsHistogram | null>(null)
  // false: the project has no log at all (the first-run state).
  const hasAnyLogs = ref(true)
  const hasMore = ref(false)
  const loadingMore = ref(false)
  // When the counts were taken: the chart's window ends here.
  const countedAt = ref(Date.now() / 1000)

  let seq = 0
  let fromServer = 0

  const sum = (list: { value: string; count: number }[] | undefined, only: string[] = []) =>
    (list ?? [])
      .filter((x) => !only.length || only.includes(x.value))
      .reduce((n, x) => n + x.count, 0)

  // Lines that match: the level counts ignore the level pick, so they are
  // summed over the picked levels.
  const matchCount = computed(() => sum(facets.value.level, filters.value.levels))
  const totalCount = computed(() =>
    baseFacets.value ? sum(baseFacets.value.level) : matchCount.value
  )
  const traceCounts = computed(
    () => new Map((baseFacets.value ?? facets.value).trace?.map((x) => [x.value, x.count]) ?? [])
  )

  const loadCounts = async (f: LogsFilters, mine: () => boolean) => {
    const [fc, base, hist] = await Promise.all([
      api.facets(f),
      hasNarrowing(f) ? api.facets(f, { search: false }) : Promise.resolve(null),
      api.histogram(f)
    ])
    if (!mine()) return
    facets.value = fc
    baseFacets.value = base
    histogram.value = hist
    countedAt.value = Date.now() / 1000
  }

  const describe = (e: unknown) => (e instanceof Error ? e.message : 'Could not load the logs')

  const load = async () => {
    const id = ++seq
    const f = filters.value
    const mine = () => id === seq
    state.value = 'loading'
    error.value = ''
    try {
      const [list] = await Promise.all([api.list(f), loadCounts(f, mine)])
      if (!mine()) return
      const any = list.length > 0 || hasNarrowing(f) || !!f.trace || (await api.hasAny())
      if (!mine()) return
      hasAnyLogs.value = any
      rows.value = list
      fromServer = list.length
      hasMore.value = list.length >= LOGS_PAGE_SIZE
      state.value = 'ready'
    } catch (e) {
      if (!mine()) return
      error.value = describe(e)
      state.value = 'error'
    }
  }

  const loadMore = async () => {
    if (loadingMore.value || !hasMore.value) return
    const id = seq
    loadingMore.value = true
    try {
      const more = await api.list(filters.value, fromServer)
      if (id !== seq) return
      const known = new Set(rows.value.map((e) => e.uuid))
      rows.value = [...rows.value, ...more.filter((e) => !known.has(e.uuid))]
      fromServer += more.length
      hasMore.value = more.length >= LOGS_PAGE_SIZE
    } catch (e) {
      error.value = describe(e)
    } finally {
      loadingMore.value = false
    }
  }

  // Counts after live lines: once they stop coming for a moment.
  const refreshCounts = useDebounceFn(
    () => {
      const id = seq
      return loadCounts(filters.value, () => id === seq).catch(() => {})
    },
    refreshDelay,
    { maxWait: refreshDelay * 4 }
  )

  // New lines, oldest first: those that match go on top.
  const addLines = (lines: ServerEvent<Monolog>[]) => {
    if (state.value !== 'ready' || !lines.length) return
    const known = new Set(rows.value.map((e) => e.uuid))
    const fresh = lines.filter((e) => !known.has(e.uuid) && matchesLog(e, filters.value)).reverse()
    if (fresh.length) rows.value = [...fresh, ...rows.value]
    hasAnyLogs.value = true
    refreshCounts()
  }

  watch(
    [filters, project],
    ([next, nextProject], old) => {
      if (old?.[0] && nextProject === old[1] && sameFilters(next, old[0])) return
      load()
    },
    { immediate: true }
  )

  return {
    state,
    error,
    rows,
    facets,
    histogram,
    hasAnyLogs,
    hasMore,
    loadingMore,
    countedAt,
    matchCount,
    totalCount,
    traceCounts,
    load,
    loadMore,
    addLines
  }
}
