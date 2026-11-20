<script lang="ts" setup>
import { useTitle } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { onMounted, watch } from 'vue'
import {
  useSentryTraces,
  onSentryEvent,
  SentryEmptyState,
  ServiceMap,
  TracePreviewCard,
  useSentryFilters
} from '@/entities/sentry'
import { useEventsStore } from '@/shared/stores'
import { StatusPanel } from '@/shared/ui'

useTitle('Sentry Traces | Buggregator')

const { traces, hasLoaded, error, isInitialLoading, total, filters, fetchList } = useSentryTraces()

// Waterfall list or service map: the filter button in the Sentry header (#5980).
const sentryFilters = useSentryFilters()
// Sentry SDK / OpenTelemetry / both: the same filter button (#6523).
filters.source = sentryFilters.source || null
watch(
  () => sentryFilters.source,
  (source) => {
    filters.source = source || null
    hasLoaded.value = false
    fetchList()
  }
)

// The period is mixed into the request in use-sentry-requests and does not
// trigger reactivity on its own, so refetch the list explicitly. The project
// is not: the server keeps no project for traces, logs and metrics.
const { period } = storeToRefs(useEventsStore())

watch(period, () => {
  hasLoaded.value = false // a filter change is a user action: show the loading state
  fetchList()
})

onMounted(() => {
  fetchList()
})

onSentryEvent(() => {
  fetchList()
}, ['trace'])
</script>

<template>
  <div class="sentry-traces-page">
    <div
      v-if="sentryFilters.tracesView !== 'map'"
      class="sentry-traces-page__list"
    >
      <div
        v-if="isInitialLoading"
        class="sentry-traces-page__loading"
      >
        Loading...
      </div>

      <StatusPanel
        v-else-if="error"
        tone="error"
        title="Could not load traces"
        :text="error"
        action-label="Try again"
        @action="fetchList"
      />

      <template v-else-if="traces.length > 0">
        <TracePreviewCard
          v-for="trace in traces"
          :key="trace.trace_id"
          :trace="trace"
        />
      </template>

      <div
        v-else-if="sentryFilters.source"
        class="sentry-traces-page__loading"
        data-test="traces-none-for-source"
      >
        No traces from this source.
      </div>

      <SentryEmptyState
        v-else
        type="traces"
      />

      <div
        v-if="!isInitialLoading && total > 0"
        class="sentry-traces-page__footer"
      >
        {{ total }} trace{{ total !== 1 ? 's' : '' }}
      </div>
    </div>

    <div
      v-else
      class="sentry-traces-page__map"
    >
      <ServiceMap :window-minutes="60" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.sentry-traces-page {
  @apply flex flex-col h-full;
}
.sentry-traces-page__list {
  @apply flex-1 overflow-auto divide-y divide-gray-200 dark:divide-gray-700;
}
.sentry-traces-page__map {
  @apply flex-1;
}
.sentry-traces-page__loading,
.sentry-traces-page__empty {
  @apply flex items-center justify-center py-12 text-sm text-gray-500 dark:text-gray-400;
}
.sentry-traces-page__footer {
  @apply text-center py-3 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700;
}
</style>
