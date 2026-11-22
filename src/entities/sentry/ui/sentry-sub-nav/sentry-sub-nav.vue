<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { computed, onMounted, watch } from 'vue'
import { useEventsStore } from '@/shared/stores'
import { Tabs, type TabItem } from '@/shared/ui'
import { useSentryCounts } from '../../lib'
import { useCronMonitors } from '../../lib/crons'
import { onSentryEvent } from '../../lib/use-sentry-events-bus'
import type { SentryTab } from '../../lib/use-sentry-filters'

// The Sentry sections in the header (#5980): link tabs of the kit, the tab
// name and its count.
// `current`: the tab of the page shown (the trace page belongs to Traces).
const props = defineProps<{ current?: SentryTab | '' }>()

const { counts, fetchCounts } = useSentryCounts()
const { activeProjectKey, period } = storeToRefs(useEventsStore())

onMounted(() => {
  fetchCounts()
})

// The counts follow the same project and period as the lists they label.
watch([activeProjectKey, period], () => {
  fetchCounts()
})

onSentryEvent(() => {
  fetchCounts()
})

const TABS: { id: SentryTab; label: string; to: string }[] = [
  { id: 'exceptions', label: 'Exceptions', to: '/sentry/exceptions' },
  { id: 'traces', label: 'Traces', to: '/sentry/traces' },
  { id: 'logs', label: 'Logs', to: '/sentry/logs' },
  { id: 'metrics', label: 'Metrics', to: '/sentry/metrics' },
  { id: 'feedback', label: 'Feedback', to: '/sentry/feedback' },
  { id: 'crons', label: 'Crons', to: '/sentry/crons' }
]

// Cron monitors are not in /counts and not in the period: the tab counts the
// monitors of the project (#6617). It shows on every server with /api/crons,
// also with no monitors (its empty state has the setup help); an older
// server answers 404: no tab.
const {
  monitors: cronMonitors,
  unsupported: cronsUnsupported,
  hasLoaded: cronsLoaded,
  error: cronsError
} = useCronMonitors()
const hasCrons = computed(() => cronsLoaded.value && !cronsUnsupported.value && !cronsError.value)

const countOf = (id: SentryTab) => (id === 'crons' ? cronMonitors.value.length : (counts.value[id] ?? 0))

// Tabs without data stay hidden; Exceptions and the open tab always show.
const isShown = (id: SentryTab) => {
  if (id === 'exceptions') return true
  if (id === 'crons') return !cronsUnsupported.value && (hasCrons.value || id === props.current)
  return id === props.current || countOf(id) > 0
}
const tabs = computed<TabItem[]>(() =>
  TABS.filter((t) => isShown(t.id)).map((t) => ({ ...t, count: countOf(t.id) > 0 ? countOf(t.id) : null }))
)

</script>

<template>
  <Tabs
    as="link"
    :tabs="tabs"
    :current="current || undefined"
    label="Sentry"
    test-prefix="sentry-tab-"
  />
</template>
