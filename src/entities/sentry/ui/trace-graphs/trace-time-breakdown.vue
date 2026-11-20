<script lang="ts" setup>
import { computed } from 'vue'
import { timeByOperation, timeByService } from '../../lib/trace-graph/trace-graph'
import type { SentrySpan } from '../../types'

// «Where the time went» (#6533 A): self time by service and by operation;
// an operation is a button that selects its span (the keyboard way into the graph).

type Props = {
  spans: SentrySpan[]
  colors: Map<string, string>
  selectedSpanId?: string | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'select', spanId: string): void
  (e: 'show-in-waterfall', spanId: string): void
}>()

const services = computed(() => timeByService(props.spans))
const operations = computed(() => timeByOperation(props.spans))
const selected = computed(() => props.spans.find((s) => s.span_id === props.selectedSpanId) ?? null)
const fmt = (ms: number) => (ms >= 10 ? Math.round(ms) : Math.round(ms * 10) / 10)
</script>

<template>
  <aside
    class="trace-time"
    aria-label="Where the time went"
  >
    <header class="trace-time__head">
      Where the time went <span class="trace-time__muted">self time</span>
    </header>

    <table class="trace-time__table">
      <thead>
        <tr>
          <th scope="col">
            Service
          </th>
          <th
            scope="col"
            class="trace-time__num"
          >
            ms
          </th>
          <th
            scope="col"
            class="trace-time__num"
          >
            %
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in services"
          :key="row.name"
          data-test="time-service"
        >
          <td class="trace-time__service">
            <span
              class="trace-time__swatch"
              :style="{ background: colors.get(row.name) }"
              aria-hidden="true"
            />{{ row.name }}
          </td>
          <td class="trace-time__num">
            {{ fmt(row.ms) }}
          </td>
          <td class="trace-time__num">
            {{ Math.round(row.percent) }}
          </td>
        </tr>
      </tbody>
    </table>

    <div class="trace-time__subhead">
      <span>Operation</span><span>self ms</span>
    </div>
    <ul class="trace-time__ops">
      <li
        v-for="op in operations"
        :key="op.spanId"
      >
        <button
          type="button"
          class="trace-time__op"
          :class="{ 'trace-time__op--active': op.spanId === selectedSpanId }"
          :aria-pressed="op.spanId === selectedSpanId"
          data-test="time-operation"
          @click="emit('select', op.spanId)"
        >
          <span
            class="trace-time__swatch"
            :style="{ background: colors.get(op.service) }"
            aria-hidden="true"
          />
          <span class="trace-time__op-name">{{ op.name }}</span>
          <span class="trace-time__num">{{ fmt(op.ms) }}</span>
        </button>
      </li>
    </ul>

    <section
      class="trace-time__selected"
      aria-live="polite"
    >
      <div class="trace-time__subhead">
        <span>Selected <span
          v-if="selected?.service_name"
          class="trace-time__muted"
        >{{ selected.service_name }}</span></span>
      </div>
      <div
        v-if="selected"
        class="trace-time__selected-body"
        data-test="time-selected"
      >
        <div class="trace-time__selected-name">
          {{ selected.description || selected.op }}
        </div>
        <div class="trace-time__muted">
          {{ selected.op }} · {{ fmt(selected.duration_ms) }} ms · starts +{{ fmt(selected.start_offset_ms) }} ms
          <span
            v-if="selected.is_error"
            class="trace-time__error"
          >· error</span>
        </div>
        <button
          type="button"
          class="trace-time__link"
          data-test="time-show-in-waterfall"
          @click="emit('show-in-waterfall', selected.span_id)"
        >
          Show in waterfall
        </button>
      </div>
      <p
        v-else
        class="trace-time__selected-body trace-time__muted"
      >
        Click a bar, a node or an operation.
      </p>
    </section>
  </aside>
</template>

<style lang="scss" scoped>
.trace-time {
  @apply rounded-md border border-gray-200 dark:border-gray-700 text-xs;
  @apply bg-white dark:bg-gray-800;
}

.trace-time__head {
  @apply px-3 py-2 font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700;
}

.trace-time__muted {
  @apply font-normal text-2xs text-gray-600 dark:text-gray-400;
}

.trace-time__table {
  @apply w-full;

  th {
    @apply px-3 py-1.5 text-left text-2xs font-medium text-gray-600 dark:text-gray-400;
  }

  td {
    @apply px-3 py-1 font-mono text-gray-800 dark:text-gray-200;
  }
}

.trace-time__num {
  @apply text-right tabular-nums font-mono;
}

.trace-time__table th.trace-time__num {
  @apply text-right;
}

.trace-time__service {
  @apply truncate max-w-[10rem];
}

.trace-time__swatch {
  @apply inline-block w-2 h-2 rounded-sm mr-1.5 shrink-0;
}

.trace-time__subhead {
  @apply flex justify-between px-3 pt-3 pb-1 text-2xs font-medium text-gray-600 dark:text-gray-400;
  @apply border-t border-gray-200 dark:border-gray-700 mt-2;
}

.trace-time__ops {
  @apply pb-1;
}

.trace-time__op {
  @apply w-full flex items-center gap-1 px-3 py-1 text-left font-mono text-gray-800 dark:text-gray-200;
  @apply hover:bg-gray-100 dark:hover:bg-gray-700;
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-rose-500/60;
}

.trace-time__op--active {
  @apply bg-gray-100 dark:bg-gray-700;
}

.trace-time__op-name {
  @apply flex-1 truncate;
}

.trace-time__selected-body {
  @apply px-3 pb-3 space-y-1;
}

.trace-time__selected-name {
  @apply font-mono font-semibold text-gray-900 dark:text-gray-100 break-all;
}

.trace-time__error {
  @apply text-red-600 dark:text-red-400;
}

.trace-time__link {
  @apply text-2xs text-blue-600 dark:text-blue-400 hover:underline;
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/60 rounded;
}
</style>
