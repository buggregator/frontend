<script lang="ts" setup>
import type { SentryMetric } from '../../types'
import SentryMetricRow from './sentry-metric-row.vue'

type Props = {
  metrics: SentryMetric[]
  loading?: boolean
}

withDefaults(defineProps<Props>(), {
  loading: false
})

// The type and name filters sit in the Sentry header (#5980); the server applies them.
</script>

<template>
  <div class="metrics-list">
    <div class="metrics-list__rows">
      <SentryMetricRow
        v-for="metric in metrics"
        :key="metric.id"
        :metric="metric"
      />

      <div
        v-if="loading"
        class="metrics-list__status"
      >
        Loading...
      </div>

      <div
        v-if="!loading && metrics.length === 0"
        class="metrics-list__status"
      >
        No metrics match the selected filter.
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.metrics-list {
  @apply flex flex-col;
}

.metrics-list__rows {
  @apply flex-1 overflow-auto;
}

.metrics-list__status {
  @apply flex items-center justify-center py-8 text-xs text-gray-500 dark:text-gray-400;
}
</style>
