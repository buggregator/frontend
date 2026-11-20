import { reactive, watch } from 'vue'

// What each Sentry tab shows, set from the filter button in the header
// (#5980) and read by the tab's page. One state for the whole app, kept in
// this browser.
export type SentryTab = 'exceptions' | 'traces' | 'logs' | 'metrics'

export type SentryFilterState = {
  exceptionsView: string
  exceptionsLevel: string
  tracesView: string
  logsLevel: string
  // Traces and logs: Sentry SDK, OpenTelemetry or both (#6523). One choice for both tabs.
  source: string
  metricsType: string
  metricsName: string
}
type Key = keyof SentryFilterState

export type SentryFilterOption = { value: string; label: string; hint?: string; level?: string }
export type SentryFilterGroup = {
  key: Key
  title: string
  // A view mode changes the layout, not what is shown: not counted, kept by Reset.
  view?: boolean
  // No options: a text box.
  options?: SentryFilterOption[]
}

const DEFAULTS: SentryFilterState = {
  exceptionsView: 'timeline',
  exceptionsLevel: '',
  tracesView: 'list',
  logsLevel: '',
  source: '',
  metricsType: '',
  metricsName: ''
}

// The two view keys predate the header and keep their names and values.
const STORAGE: Record<Key, string> = {
  exceptionsView: 'sentry_exceptions_view_mode',
  exceptionsLevel: 'sentry_exceptions_level',
  tracesView: 'sentry_traces_view_mode',
  logsLevel: 'sentry_logs_level',
  source: 'sentry_source',
  metricsType: 'sentry_metrics_type',
  metricsName: 'sentry_metrics_name'
}

const ALLOWED: Partial<Record<Key, string[]>> = {
  exceptionsView: ['timeline', 'grouped'],
  tracesView: ['list', 'map', 'flow'],
  source: ['', 'sentry', 'otel']
}

const level = (value: string, label: string): SentryFilterOption => ({ value, label, level: value })

const SOURCE_GROUP: SentryFilterGroup = {
  key: 'source',
  title: 'Source',
  options: [
    { value: '', label: 'All sources' },
    { value: 'sentry', label: 'Sentry SDK' },
    { value: 'otel', label: 'OpenTelemetry', hint: 'OTLP' }
  ]
}

export const SENTRY_FILTER_GROUPS: Record<SentryTab, SentryFilterGroup[]> = {
  exceptions: [
    {
      key: 'exceptionsView',
      title: 'View',
      view: true,
      options: [
        { value: 'timeline', label: 'Timeline', hint: 'each event' },
        { value: 'grouped', label: 'Group by type', hint: 'like Issues' }
      ]
    },
    {
      key: 'exceptionsLevel',
      title: 'Level',
      options: [
        { value: '', label: 'All levels' },
        level('fatal', 'Fatal'),
        level('error', 'Error'),
        level('warning', 'Warning'),
        level('info', 'Info'),
        level('debug', 'Debug')
      ]
    }
  ],
  traces: [
    {
      key: 'tracesView',
      title: 'View',
      view: true,
      options: [
        { value: 'list', label: 'Waterfall list' },
        { value: 'map', label: 'Service map' },
        { value: 'flow', label: 'Flow' }
      ]
    },
    SOURCE_GROUP
  ],
  logs: [
    {
      key: 'logsLevel',
      title: 'Level',
      options: [
        { value: '', label: 'All levels' },
        level('fatal', 'Fatal'),
        level('error', 'Error'),
        level('warn', 'Warn'),
        level('info', 'Info'),
        level('debug', 'Debug')
      ]
    },
    SOURCE_GROUP
  ],
  metrics: [
    {
      key: 'metricsType',
      title: 'Type',
      options: [
        { value: '', label: 'All types' },
        { value: 'counter', label: 'Counter' },
        { value: 'gauge', label: 'Gauge' },
        { value: 'distribution', label: 'Distribution' }
      ]
    },
    { key: 'metricsName', title: 'Name' }
  ]
}

const read = (key: Key): string => {
  try {
    const value = window.localStorage.getItem(STORAGE[key])
    if (value === null) return DEFAULTS[key]
    const allowed = ALLOWED[key]
    return allowed && !allowed.includes(value) ? DEFAULTS[key] : value
  } catch {
    return DEFAULTS[key]
  }
}

const write = (key: Key, value: string) => {
  try {
    if (value === DEFAULTS[key] && !ALLOWED[key]) window.localStorage.removeItem(STORAGE[key])
    else window.localStorage.setItem(STORAGE[key], value)
  } catch {
    // Storage blocked: the choice lasts until the page reloads.
  }
}

const load = () =>
  Object.fromEntries((Object.keys(DEFAULTS) as Key[]).map((k) => [k, read(k)])) as SentryFilterState

const state = reactive<SentryFilterState>(load())

for (const key of Object.keys(DEFAULTS) as Key[]) {
  watch(
    () => state[key],
    (value) => write(key, value)
  )
}

const narrowing = (tab: SentryTab) => SENTRY_FILTER_GROUPS[tab].filter((g) => !g.view)

// How many filters of the tab narrow what is shown (the button's badge).
export const activeSentryFilters = (tab: SentryTab) =>
  narrowing(tab).filter((g) => state[g.key].trim() !== DEFAULTS[g.key]).length

export const resetSentryFilters = (tab: SentryTab) => {
  for (const g of narrowing(tab)) state[g.key] = DEFAULTS[g.key]
}

// For tests: the state as a fresh page would read it.
export const reloadSentryFilters = () => Object.assign(state, load())

export const useSentryFilters = () => state
