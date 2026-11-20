import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSentryFilters } from './use-sentry-filters'
import type { ViewIcon } from './view-icons'

// The view of a Sentry list (#6543): in the URL (?view=…) so a link and
// back/forward open the same view; without it, the last view of that tab.

export type SentryViewTabName = 'traces' | 'exceptions'
export type SentryViewOption = { id: string; label: string; icon: ViewIcon }

export const SENTRY_VIEWS: Record<SentryViewTabName, SentryViewOption[]> = {
  traces: [
    { id: 'list', label: 'List', icon: 'list' },
    { id: 'map', label: 'Service map', icon: 'map' }
  ],
  exceptions: [
    { id: 'timeline', label: 'Timeline', icon: 'timeline' },
    { id: 'grouped', label: 'Grouped', icon: 'grouped' }
  ]
}

const KEY = { traces: 'tracesView', exceptions: 'exceptionsView' } as const

export const useSentryView = (tab: SentryViewTabName) => {
  const route = useRoute()
  const router = useRouter()
  const state = useSentryFilters()
  const key = KEY[tab]
  const allowed = (v: unknown): v is string => typeof v === 'string' && SENTRY_VIEWS[tab].some((o) => o.id === v)

  watch(
    () => [route.query.view, route.query.service],
    ([view, service]) => {
      if (allowed(view)) state[key] = view
      // «Traces» from a map service opens the list filtered by it.
      else if (tab === 'traces' && service) state[key] = 'list'
      // No view in the URL: write the current one in, so Back from another
      // view comes back to it (#6549) instead of keeping the newer one.
      if (!allowed(view)) router.replace({ query: { ...route.query, view: state[key] } })
    },
    { immediate: true }
  )

  const current = computed(() => state[key])

  const select = (id: string) => {
    if (!allowed(id) || (id === state[key] && route.query.view === id)) return
    state[key] = id
    router.push({ query: { ...route.query, view: id } })
  }

  return { views: SENTRY_VIEWS[tab], current, select }
}

// The trace page (#6543): the views of one trace and its related lists in the
// same row. Graph views are remembered for the next trace; related lists not.
export type TraceView = 'waterfall' | 'flame' | 'graph' | 'sequence' | 'errors' | 'logs'
const TRACE_VIEWS: TraceView[] = ['waterfall', 'flame', 'graph', 'sequence', 'errors', 'logs']
const REMEMBERED: TraceView[] = ['waterfall', 'flame', 'graph', 'sequence']
export const TRACE_VIEW_STORAGE = 'sentry_trace_view_mode'

const isTraceView = (v: unknown): v is TraceView => typeof v === 'string' && TRACE_VIEWS.includes(v as TraceView)

const storedTraceView = (): TraceView => {
  try {
    const v = window.localStorage.getItem(TRACE_VIEW_STORAGE)
    return isTraceView(v) && REMEMBERED.includes(v) ? v : 'waterfall'
  } catch {
    return 'waterfall'
  }
}

export const useTraceView = () => {
  const route = useRoute()
  const router = useRouter()
  const view = ref<TraceView>(isTraceView(route.query.view) ? route.query.view : storedTraceView())

  watch(
    () => route.query.view,
    (v) => {
      if (isTraceView(v)) view.value = v
      else router.replace({ query: { ...route.query, view: view.value } })
    },
    { immediate: true }
  )

  const select = (id: string) => {
    if (!isTraceView(id) || (id === view.value && route.query.view === id)) return
    view.value = id
    if (REMEMBERED.includes(id)) {
      try {
        window.localStorage.setItem(TRACE_VIEW_STORAGE, id)
      } catch {
        // Storage blocked: the choice lasts for this page.
      }
    }
    router.push({ query: { ...route.query, view: id } })
  }

  return { view, select }
}
