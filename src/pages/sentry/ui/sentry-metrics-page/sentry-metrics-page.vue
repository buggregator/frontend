<script lang="ts" setup>
import { useTitle, watchDebounced } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, onMounted, watch } from 'vue'
import {
  useSentryMetrics,
  onSentryEvent,
  SentryEmptyState,
  SentryMetricsList,
  useSentryFilters
} from '@/entities/sentry'
import { useEventsStore } from '@/shared/stores'
import { StatusPanel } from '@/shared/ui'

useTitle('Sentry Metrics | Buggregator')

const { metrics, hasLoaded, error, isInitialLoading, total, page, filters, fetchList } =
  useSentryMetrics()

// Type and name come from the filter button in the Sentry header (#5980).
const sentryFilters = useSentryFilters()
const hasFilter = computed(
  () => !!sentryFilters.metricsType || sentryFilters.metricsName.trim() !== ''
)

const setFilters = () => {
  filters.type = sentryFilters.metricsType || null
  filters.search = sentryFilters.metricsName.trim() || null
}
setFilters()

const applyFilters = () => {
  setFilters()
  page.value = 1
  fetchList()
}

watch(() => sentryFilters.metricsType, applyFilters)
watchDebounced(() => sentryFilters.metricsName, applyFilters, { debounce: 300 })

// Refetch on a project or period change: both are mixed into the request in
// use-sentry-requests (`withProject`), but neither triggers reactivity on its
// own. The server keeps traces, logs and metrics per project (frontend#383).
const { activeProjectKey, period } = storeToRefs(useEventsStore())

watch([activeProjectKey, period], () => {
  page.value = 1
  hasLoaded.value = false // a filter change is a user action: show the loading state
  fetchList()
})

onMounted(() => {
  fetchList()
})

onSentryEvent(() => {
  fetchList()
}, ['metric'])
</script>

<template>
  <div class="sentry-metrics-page">
    <StatusPanel
      v-if="error"
      tone="error"
      title="Could not load metrics"
      :text="error"
      action-label="Try again"
      @action="fetchList"
    />

    <!-- The list and its filters stay under an error: a retry may need
         another filter. -->
    <SentryEmptyState
      v-if="!error && !isInitialLoading && metrics.length === 0 && !hasFilter"
      type="metrics"
    />

    <SentryMetricsList
      v-else
      :metrics="metrics"
      :loading="isInitialLoading"
    />

    <div
      v-if="!isInitialLoading && total > 0"
      class="sentry-metrics-page__footer"
    >
      {{ total }} metric{{ total !== 1 ? 's' : '' }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
.sentry-metrics-page {
  @apply flex flex-col h-full;
}

.sentry-metrics-page__footer {
  @apply text-center py-3 text-xs text-gray-500 dark:text-gray-400;
  @apply border-t border-gray-100 dark:border-gray-800;
}
</style>
