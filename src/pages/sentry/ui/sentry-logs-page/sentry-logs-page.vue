<script lang="ts" setup>
import { useTitle } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { onMounted, watch } from 'vue'
import {
  useSentryLogs,
  onSentryEvent,
  SentryEmptyState,
  SentryLogsList,
  useSentryFilters
} from '@/entities/sentry'
import { useEventsStore } from '@/shared/stores'
import { StatusPanel } from '@/shared/ui'

useTitle('Sentry Logs | Buggregator')

const { logs, hasLoaded, error, isInitialLoading, total, page, filters, fetchList } =
  useSentryLogs()

// A chip stands for the levels SDKs send for it
const levelsOfChip: Record<string, string | null> = {
  all: null,
  warn: 'warn,warning',
  error: 'error,fatal'
}

// The level comes from the filter button in the Sentry header (#5980).
const sentryFilters = useSentryFilters()
const toQuery = (level: string) => (level in levelsOfChip ? levelsOfChip[level] : level)
filters.level = toQuery(sentryFilters.logsLevel || 'all')

watch(
  () => sentryFilters.logsLevel,
  (level) => {
    filters.level = toQuery(level || 'all')
    page.value = 1
    fetchList()
  }
)

// The period is mixed into the request in use-sentry-requests and does not
// trigger reactivity on its own, so refetch the list explicitly. The project
// is not: the server keeps no project for traces, logs and metrics.
const { period } = storeToRefs(useEventsStore())

watch(period, () => {
  page.value = 1
  hasLoaded.value = false // a filter change is a user action: show the loading state
  fetchList()
})

onMounted(() => {
  fetchList()
})

onSentryEvent(() => {
  fetchList()
}, ['log'])
</script>

<template>
  <div class="sentry-logs-page">
    <StatusPanel
      v-if="error"
      tone="error"
      title="Could not load logs"
      :text="error"
      action-label="Try again"
      @action="fetchList"
    />

    <!-- The list and its filters stay under an error: a retry may need
         another filter. -->
    <SentryEmptyState
      v-if="!error && !isInitialLoading && logs.length === 0 && !sentryFilters.logsLevel"
      type="logs"
    />

    <SentryLogsList
      v-else
      :logs="logs"
      :loading="isInitialLoading"
    />

    <div
      v-if="!isInitialLoading && total > 0"
      class="sentry-logs-page__footer"
    >
      {{ total }} log{{ total !== 1 ? 's' : '' }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
.sentry-logs-page {
  @apply flex flex-col h-full;
}

.sentry-logs-page__footer {
  @apply text-center py-3 text-xs text-gray-500 dark:text-gray-400;
  @apply border-t border-gray-100 dark:border-gray-800;
}
</style>
