<script lang="ts" setup>
import moment from 'moment'
import { computed, ref } from 'vue'
import { RouteName } from '@/shared/types'
import type { SentryMetric } from '../../types'

type Props = {
  metric: SentryMetric
}

const props = defineProps<Props>()

const expanded = ref(false)

const typeClass = computed(() => {
  switch (props.metric.type) {
    case 'counter':
      return 'metric-type--counter'
    case 'gauge':
      return 'metric-type--gauge'
    case 'distribution':
      return 'metric-type--distribution'
    default:
      return 'metric-type--other'
  }
})

const formattedTime = computed(() => {
  if (!props.metric.metric_ts) return ''
  return moment(props.metric.metric_ts).format('HH:mm:ss.SSS')
})

const formattedValue = computed(() => {
  const value = Number.isInteger(props.metric.value)
    ? String(props.metric.value)
    : props.metric.value.toFixed(3).replace(/\.?0+$/, '')

  return props.metric.unit && props.metric.unit !== 'none' ? `${value} ${props.metric.unit}` : value
})

// Sentry sends every attribute as {type, value}; show the plain value.
const attributeValue = (attr: unknown): string => {
  const val = attr !== null && typeof attr === 'object' && 'value' in attr ? (attr as { value: unknown }).value : attr
  if (val === null || val === undefined) return 'null'
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}

const attributes = computed(() =>
  Object.entries(props.metric.attributes ?? {}).map(([key, attr]) => ({ key, value: attributeValue(attr) }))
)

// The SDK adds sentry.* attributes (environment, release, SDK) to every metric;
// the row summary shows only the ones the application set.
const ownAttributes = computed(() => attributes.value.filter((a) => !a.key.startsWith('sentry.')))
</script>

<template>
  <div
    class="metric-row"
    :class="{ 'metric-row--expanded': expanded }"
    @click="expanded = !expanded"
  >
    <div class="metric-row__main">
      <span
        class="metric-row__type"
        :class="typeClass"
      >
        {{ metric.type }}
      </span>

      <span class="metric-row__name">{{ metric.name }}</span>

      <span class="metric-row__value">{{ formattedValue }}</span>

      <span class="metric-row__attrs-inline">
        <span
          v-for="attr in ownAttributes"
          :key="attr.key"
          class="metric-row__attr-chip"
        >{{ attr.key }}={{ attr.value }}</span>
      </span>

      <span class="metric-row__time">{{ formattedTime }}</span>

      <RouterLink
        v-if="metric.trace_id"
        :to="{ name: RouteName.SentryTraceDetail, params: { traceId: metric.trace_id } }"
        class="metric-row__trace-link"
        @click.stop
      >
        trace &rarr;
      </RouterLink>
    </div>

    <div
      v-if="expanded && attributes.length > 0"
      class="metric-row__attrs"
    >
      <div class="metric-row__attrs-header">
        Attributes
      </div>
      <div class="metric-row__attrs-body">
        <div
          v-for="attr in attributes"
          :key="attr.key"
          class="metric-row__attr-row"
        >
          <span class="metric-row__attr-key">{{ attr.key }}</span>
          <span class="metric-row__attr-val">{{ attr.value }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.metric-row {
  @apply px-3 py-2 cursor-pointer;
  @apply bg-white dark:bg-gray-800;
  @apply border-b border-gray-200 dark:border-gray-700;
  @apply transition-colors duration-100;

  &:hover {
    @apply bg-gray-50 dark:bg-gray-900;
  }
}

.metric-row--expanded {
  @apply bg-gray-50 dark:bg-gray-900;
}

.metric-row__main {
  @apply flex items-center gap-2 min-w-0;
}

.metric-row__type {
  @apply inline-flex items-center justify-center px-2 py-0.5 rounded;
  @apply text-2xs font-bold uppercase tracking-wide;
  @apply flex-shrink-0 min-w-[84px] text-center;
}

.metric-type--counter {
  @apply text-blue-600 dark:text-blue-400;
  @apply bg-blue-50 dark:bg-blue-500/10;
}

.metric-type--gauge {
  @apply text-emerald-600 dark:text-emerald-400;
  @apply bg-emerald-50 dark:bg-emerald-500/10;
}

.metric-type--distribution {
  @apply text-violet-600 dark:text-violet-400;
  @apply bg-violet-50 dark:bg-violet-500/10;
}

.metric-type--other {
  @apply text-gray-500 dark:text-gray-400;
  @apply bg-gray-100 dark:bg-gray-600/50;
}

.metric-row__name {
  @apply text-xs font-mono font-semibold flex-shrink-0;
  @apply text-gray-800 dark:text-gray-200;
}

.metric-row__value {
  @apply text-xs font-mono tabular-nums flex-shrink-0;
  @apply text-gray-900 dark:text-white;
}

.metric-row__attrs-inline {
  @apply flex-1 flex gap-1 min-w-0 overflow-hidden;
}

.metric-row__attr-chip {
  @apply text-2xs font-mono px-1.5 py-0.5 rounded truncate;
  @apply bg-gray-100 dark:bg-gray-700;
  @apply text-gray-600 dark:text-gray-300;
}

.metric-row__time {
  @apply text-2xs font-mono text-gray-400 dark:text-gray-500 flex-shrink-0;
}

.metric-row__trace-link {
  @apply text-2xs font-medium flex-shrink-0 px-1.5 py-0.5 rounded;
  @apply text-blue-600 dark:text-blue-400;
  @apply bg-blue-50 dark:bg-blue-500/10;
  @apply hover:bg-blue-100 dark:hover:bg-blue-500/20;
  @apply transition-colors duration-100;
}

/* Expandable attributes block - same as the log row */
.metric-row__attrs {
  @apply mt-2 rounded overflow-hidden;
  @apply border border-gray-200 dark:border-gray-700;
}

.metric-row__attrs-header {
  @apply px-3 py-1.5;
  @apply bg-gray-50 dark:bg-gray-900;
  @apply border-b border-gray-200 dark:border-gray-700;
  @apply text-2xs font-medium text-gray-500 dark:text-gray-400;
}

.metric-row__attrs-body {
  @apply divide-y divide-gray-200 dark:divide-gray-700;
}

.metric-row__attr-row {
  @apply flex py-1.5 px-3 text-2xs;
  @apply bg-white dark:bg-gray-800;

  &:nth-child(even) {
    @apply bg-gray-50 dark:bg-gray-800/50;
  }
}

.metric-row__attr-key {
  @apply w-1/4 font-medium text-gray-500 dark:text-gray-400 flex-shrink-0;
  @apply border-r border-gray-200 dark:border-gray-700 pr-3;
}

.metric-row__attr-val {
  @apply w-3/4 font-mono text-gray-700 dark:text-gray-200 pl-3 break-all;
}
</style>
