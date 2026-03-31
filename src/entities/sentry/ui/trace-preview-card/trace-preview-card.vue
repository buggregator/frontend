<script lang="ts" setup>
import moment from 'moment'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { RouteName } from '@/shared/types'
import type { SentryTrace } from '../../types'
import { MiniWaterfall } from '../mini-waterfall'

type Props = {
  trace: SentryTrace
}

const props = defineProps<Props>()
const router = useRouter()

const formattedTime = computed(() => moment(props.trace.received_at).fromNow())

const navigateToDetail = () => {
  router.push({ name: RouteName.SentryTraceDetail, params: { traceId: props.trace.trace_id } })
}
</script>

<template>
  <div
    class="trace-card"
    @click="navigateToDetail"
  >
    <!-- Left accent stripe is applied via border-l -->

    <!-- Header row: badges + time -->
    <div class="trace-card__header">
      <span class="trace-card__type-badge">
        <span class="trace-card__type-shape" />
        trace
      </span>

      <span class="trace-card__label trace-card__label--op">{{ trace.op || 'unknown' }}</span>

      <span
        v-if="trace.error_count"
        class="trace-card__label trace-card__label--error"
      >
        {{ trace.error_count }} error{{ trace.error_count !== 1 ? 's' : '' }}
      </span>

      <span
        class="trace-card__label"
        :class="trace.status === 'ok' ? 'trace-card__label--ok' : 'trace-card__label--warn'"
      >
        {{ trace.status }}
      </span>

      <span class="trace-card__time">{{ formattedTime }}</span>
    </div>

    <!-- Transaction name -->
    <div class="trace-card__name">
      {{ trace.transaction_name }}
    </div>

    <!-- Mini waterfall preview -->
    <MiniWaterfall
      v-if="trace.preview_spans?.length"
      :spans="trace.preview_spans"
      :total-ms="trace.duration_ms"
      :max-spans="3"
      class="trace-card__waterfall"
    />

    <!-- Footer meta -->
    <div class="trace-card__footer">
      <span class="trace-card__meta">{{ trace.span_count }} spans</span>
      <span class="trace-card__meta trace-card__meta--mono">{{ trace.duration_ms }}ms</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.trace-card {
  @apply flex flex-col px-3 py-2.5 lg:px-4 lg:py-3 cursor-pointer;
  @apply bg-white dark:bg-gray-800;
  @apply border-l-[3px] border-l-purple-500;
  @apply transition-all duration-100;

  &:hover {
    @apply bg-gray-50 dark:bg-gray-900;
  }
}

.trace-card__header {
  @apply flex flex-wrap items-center gap-1.5;
}

.trace-card__type-badge {
  @apply inline-flex items-center gap-1 px-1.5 py-0.5 rounded;
  @apply text-2xs font-semibold uppercase tracking-wide;
  @apply text-purple-600 dark:text-purple-400;
  @apply bg-purple-50 dark:bg-purple-500/10;
}

.trace-card__type-shape {
  @apply flex-shrink-0 rounded-sm;
  width: 6px;
  height: 6px;
  background: currentColor;
  opacity: 0.6;
  transform: rotate(45deg);
}

.trace-card__label {
  @apply inline-flex items-center px-1.5 py-0.5 rounded;
  @apply text-2xs font-medium;
  @apply bg-gray-100 dark:bg-gray-600/50 text-gray-600 dark:text-gray-300;
}

.trace-card__label--op {
  @apply font-semibold;
  @apply text-violet-600 dark:text-violet-400;
  @apply bg-violet-50 dark:bg-violet-500/10;
}

.trace-card__label--error {
  @apply font-semibold;
  @apply text-red-600 dark:text-red-400;
  @apply bg-red-50 dark:bg-red-500/10;
}

.trace-card__label--ok {
  @apply text-green-600 dark:text-green-400;
  @apply bg-green-50 dark:bg-green-500/10;
}

.trace-card__label--warn {
  @apply text-amber-600 dark:text-amber-400;
  @apply bg-amber-50 dark:bg-amber-500/10;
}

.trace-card__time {
  @apply text-2xs font-mono text-gray-400 dark:text-gray-500 whitespace-nowrap ml-auto;
}

.trace-card__name {
  @apply text-sm font-semibold truncate mt-2;
  @apply text-gray-800 dark:text-gray-100;
}

.trace-card__waterfall {
  @apply mt-2;
  @apply p-2.5 rounded;
  @apply bg-gray-50 dark:bg-gray-900;
  @apply border border-gray-200 dark:border-gray-700;
}

.trace-card__footer {
  @apply flex items-center gap-2 mt-2;
}

.trace-card__meta {
  @apply text-2xs text-gray-400 dark:text-gray-500;
}

.trace-card__meta--mono {
  @apply font-mono;
}
</style>
