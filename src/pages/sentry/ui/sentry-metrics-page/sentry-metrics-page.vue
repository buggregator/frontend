<script lang="ts" setup>
import { useTitle } from '@vueuse/core'
import { onMounted } from 'vue'
import { useSentryMetrics } from '@/entities/sentry/lib'
import { onSentryEvent } from '@/entities/sentry/lib/use-sentry-events-bus'
import { SentryEmptyState } from '@/entities/sentry/ui/sentry-empty-state'
import { SentryMetricsList } from '@/entities/sentry/ui/sentry-metrics-list'
import { SentrySubNav } from '@/entities/sentry/ui/sentry-sub-nav'

useTitle('Sentry Metrics | Buggregator')

const { metrics, loading, total, fetchList } = useSentryMetrics()

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
      v-if="!loading && metrics.length === 0"
      type="metrics"
    />

    <SentryMetricsList
      v-else
      :metrics="metrics"
      :loading="loading"
    />

    <div
      v-if="!loading && total > 0"
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
