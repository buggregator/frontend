<script lang="ts" setup>
import { useTitle, watchDebounced } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref, watch } from 'vue'
import { useSentryMetrics } from '@/entities/sentry/lib'
import { onSentryEvent } from '@/entities/sentry/lib/use-sentry-events-bus'
import { SentryEmptyState } from '@/entities/sentry/ui/sentry-empty-state'
import { SentryMetricsList } from '@/entities/sentry/ui/sentry-metrics-list'
import { SentrySubNav } from '@/entities/sentry/ui/sentry-sub-nav'
import { useEventsStore } from '@/shared/stores'

useTitle('Sentry Metrics | Buggregator')

const { metrics, hasLoaded, isInitialLoading, total, page, filters, fetchList } = useSentryMetrics()

const activeType = ref('all')
const search = ref('')
const hasFilter = computed(() => activeType.value !== 'all' || search.value.trim() !== '')

const applyFilters = () => {
  filters.type = activeType.value === 'all' ? null : activeType.value
  filters.search = search.value.trim() || null
  page.value = 1
  fetchList()
}

watch(activeType, applyFilters)
watchDebounced(search, applyFilters, { debounce: 300 })

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
})
</script>

<template>
  <div class="sentry-metrics-page">
    <SentrySubNav />

    <SentryEmptyState
      v-if="!isInitialLoading && metrics.length === 0 && !hasFilter"
      type="metrics"
    />

    <SentryMetricsList
      v-else
      v-model:type="activeType"
      v-model:search="search"
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
  @apply text-center py-3 text-xs text-gray-400;
  @apply border-t border-gray-100 dark:border-gray-800;
}
</style>
