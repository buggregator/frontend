<script lang="ts" setup>
import { computed, ref } from 'vue'
import type { SentryMetric } from '../../types'
import SentryMetricRow from './sentry-metric-row.vue'

type Props = {
  metrics: SentryMetric[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const types = ['all', 'counter', 'gauge', 'distribution'] as const
const activeType = ref<string>('all')
const nameFilter = ref('')

const filteredMetrics = computed(() => {
  const needle = nameFilter.value.trim().toLowerCase()

  return props.metrics.filter((m) => {
    if (activeType.value !== 'all' && m.type !== activeType.value) return false
    return needle === '' || m.name.toLowerCase().includes(needle)
  })
})
</script>

<template>
  <div class="metrics-list">
    <div class="metrics-list__filters">
      <button
        v-for="t in types"
        :key="t"
        class="metrics-list__chip"
        :class="{ 'metrics-list__chip--active': activeType === t }"
        @click="activeType = t"
      >
        {{ t }}
      </button>

      <input
        v-model="nameFilter"
        class="metrics-list__search"
        type="search"
        placeholder="Filter by name"
        aria-label="Filter metrics by name"
      >
    </div>

    <div class="metrics-list__rows">
      <SentryMetricRow
        v-for="metric in filteredMetrics"
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
        v-if="!loading && filteredMetrics.length === 0"
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

.metrics-list__filters {
  @apply flex items-center gap-1 px-4 py-2;
  @apply border-b border-gray-200 dark:border-gray-700;
  @apply bg-white dark:bg-gray-800;
}

.metrics-list__chip {
  @apply text-2xs font-semibold uppercase tracking-wide;
  @apply px-2 py-1 rounded cursor-pointer;
  @apply text-gray-500 dark:text-gray-400;
  @apply hover:bg-gray-100 dark:hover:bg-gray-700;
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50;
  @apply transition-colors duration-100;
}

.metrics-list__chip--active {
  @apply bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white;
}

.metrics-list__search {
  @apply ml-auto w-56 px-2 py-1 rounded text-xs font-mono;
  @apply bg-gray-50 dark:bg-gray-900;
  @apply border border-gray-200 dark:border-gray-700;
  @apply text-gray-700 dark:text-gray-200;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500/50;
}

.metrics-list__rows {
  @apply flex-1 overflow-auto;
}

.metrics-list__status {
  @apply flex items-center justify-center py-8 text-xs text-gray-400 dark:text-gray-500;
}
</style>
