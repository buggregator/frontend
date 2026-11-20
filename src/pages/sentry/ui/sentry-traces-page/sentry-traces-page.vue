<script lang="ts" setup>
import { useTitle } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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

// List or service map: the view tabs under the header (#6543).
const sentryFilters = useSentryFilters()

// ?service=: traces through one service, from the map's «Traces» button (#6544).
const route = useRoute()
const router = useRouter()
const serviceOf = () => (typeof route.query.service === 'string' && route.query.service ? route.query.service : null)
filters.service = serviceOf()
watch(serviceOf, (service) => {
  if (service === filters.service) return
  filters.service = service
  hasLoaded.value = false
  fetchList()
})
const clearService = () => {
  const query = { ...route.query }
  delete query.service
  router.push({ query })
}
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
        v-if="filters.service"
        class="sentry-traces-page__chip-row"
      >
        <span
          class="sentry-traces-page__chip"
          data-test="traces-service-filter"
        >
          Service <b>{{ filters.service }}</b>
          <button
            type="button"
            class="sentry-traces-page__chip-x"
            :aria-label="`Show traces of all services, not only ${filters.service}`"
            @click="clearService"
          >×</button>
        </span>
      </div>
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
        v-else-if="filters.service"
        class="sentry-traces-page__loading"
        data-test="traces-none-for-service"
      >
        No traces through {{ filters.service }} in this period.
      </div>

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
      <ServiceMap />
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
.sentry-traces-page__chip-row {
  @apply flex px-4 py-2;
}
// Plain CSS: dark variants would double these rules in the first load.
.sentry-traces-page__chip {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding-left: 0.625rem;
  border-radius: 9999px;
  font-size: 12px;
  background: rgb(107 114 128 / 0.15);

  b {
    font: 500 12px ui-monospace, SFMono-Regular, Menlo, monospace;
  }
}
.sentry-traces-page__chip-x {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 9999px;
  font-size: 1rem;
  line-height: 1;
  opacity: 0.7;

  &:hover {
    opacity: 1;
  }

  &:focus-visible {
    outline: 2px solid #2563eb;
  }
}
.sentry-traces-page__loading,
.sentry-traces-page__empty {
  @apply flex items-center justify-center py-12 text-sm text-gray-500 dark:text-gray-400;
}
.sentry-traces-page__footer {
  @apply text-center py-3 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700;
}
</style>
