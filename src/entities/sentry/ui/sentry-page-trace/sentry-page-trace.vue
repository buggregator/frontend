<script lang="ts" setup>
import { TableBase, TableBaseRow } from '@/shared/ui'

type TraceContext = {
  trace_id?: string
  span_id?: string
  op?: string
  status?: string
}

type Props = {
  trace: TraceContext
}

defineProps<Props>()
</script>

<template>
  <section>
    <h3 class="section-title">
      Trace
    </h3>

    <TableBase>
      <TableBaseRow
        v-if="trace.trace_id"
        title="Trace ID"
      >
        <span class="trace-mono">{{ trace.trace_id }}</span>
      </TableBaseRow>
      <TableBaseRow
        v-if="trace.span_id"
        title="Span ID"
      >
        <span class="trace-mono">{{ trace.span_id }}</span>
      </TableBaseRow>
      <TableBaseRow
        v-if="trace.op"
        title="Operation"
      >
        <span class="trace-badge">{{ trace.op }}</span>
      </TableBaseRow>
      <TableBaseRow
        v-if="trace.status"
        title="Status"
      >
        <span
          class="trace-status"
          :class="{
            'trace-status--error': trace.status?.includes('error'),
            'trace-status--ok': trace.status === 'ok',
          }"
        >{{ trace.status }}</span>
      </TableBaseRow>
    </TableBase>
  </section>
</template>

<style lang="scss" scoped>
.section-title {
  @apply text-xs font-mono font-semibold uppercase tracking-wider;
  @apply text-gray-500 dark:text-gray-400 mb-3;
}

.trace-mono {
  @apply font-mono text-xs break-all select-all;
}

.trace-badge {
  @apply text-xs font-mono px-1.5 py-0.5 rounded;
  @apply bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400;
}

.trace-status {
  @apply text-xs font-semibold px-1.5 py-0.5 rounded;
  @apply bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400;
}

.trace-status--error {
  @apply bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400;
}

.trace-status--ok {
  @apply bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400;
}
</style>
