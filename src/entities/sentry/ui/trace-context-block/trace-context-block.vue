<script lang="ts" setup>
import { RouteName } from '@/shared/types'
import type { SentryTraceSummary } from '../../types'
import { MiniWaterfall } from '../mini-waterfall'

type Props = {
  traceSummary: SentryTraceSummary | null
}

defineProps<Props>()

const shortId = (id: string) => (id ? id.substring(0, 12) + '...' : '')
</script>

<template>
  <section
    v-if="traceSummary"
    class="trace-ctx"
  >
    <h3 class="trace-ctx__title">
      Trace context
    </h3>

    <div class="trace-ctx__meta">
      <span class="trace-ctx__pill">{{ shortId(traceSummary.trace_id) }}</span>
      <span
        v-if="traceSummary.span_count"
        class="trace-ctx__stat"
      >{{ traceSummary.span_count }} spans</span>
      <span
        v-if="traceSummary.duration_ms"
        class="trace-ctx__stat"
      >{{ traceSummary.duration_ms }}ms total</span>
      <span
        v-if="traceSummary.transaction_name"
        class="trace-ctx__stat"
      >{{
        traceSummary.transaction_name
      }}</span>
    </div>

    <MiniWaterfall
      v-if="traceSummary.preview_spans?.length"
      :spans="traceSummary.preview_spans"
      :total-ms="traceSummary.duration_ms"
      :max-spans="5"
      class="trace-ctx__waterfall"
    />

    <RouterLink
      :to="{ name: RouteName.SentryTraceDetail, params: { traceId: traceSummary.trace_id } }"
      class="trace-ctx__link"
    >
      View full trace &rarr;
    </RouterLink>
  </section>
</template>

<style lang="scss" scoped>
.trace-ctx {
  @apply p-4 rounded-lg;
  @apply bg-gray-50 dark:bg-gray-900;
  @apply border border-gray-200 dark:border-gray-700;
}

.trace-ctx__title {
  @apply text-sm font-semibold mb-2;
  @apply text-gray-700 dark:text-gray-200;
}

.trace-ctx__meta {
  @apply flex flex-wrap items-center gap-2 mb-3;
}

.trace-ctx__pill {
  @apply text-[10px] font-mono px-2 py-0.5 rounded-full;
  @apply bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300;
}

.trace-ctx__stat {
  @apply text-xs text-gray-500 dark:text-gray-400;
}

.trace-ctx__waterfall {
  @apply mb-3;
}

.trace-ctx__link {
  @apply text-xs font-medium;
  @apply text-blue-600 dark:text-blue-400;
  @apply hover:text-blue-800 dark:hover:text-blue-300;
}
</style>
