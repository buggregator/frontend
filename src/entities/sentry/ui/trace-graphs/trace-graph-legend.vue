<script lang="ts" setup>
import { computed } from 'vue'
import { SOURCE_LABEL } from '../../lib/otel'
import { UNKNOWN_SERVICE } from '../../lib/trace-graph/trace-graph'
import type { SentrySpan } from '../../types'

type Props = {
  spans: SentrySpan[]
  colors: Map<string, string>
}

const props = defineProps<Props>()

const items = computed(() =>
  [...props.colors].map(([name, color]) => {
    const first = props.spans.find((s) => (s.service_name || UNKNOWN_SERVICE) === name)
    return { name, color, source: first?.source ? SOURCE_LABEL[first.source] : null }
  })
)
</script>

<template>
  <ul
    class="trace-legend"
    aria-label="Services"
  >
    <li
      v-for="item in items"
      :key="item.name"
      class="trace-legend__item"
    >
      <span
        class="trace-legend__swatch"
        :style="{ background: item.color }"
        aria-hidden="true"
      />
      <span class="trace-legend__name">{{ item.name }}</span>
      <span
        v-if="item.source"
        class="trace-legend__source"
      >{{ item.source }}</span>
    </li>
    <li class="trace-legend__item">
      <span
        class="trace-legend__swatch trace-legend__swatch--error"
        aria-hidden="true"
      />
      <span class="trace-legend__name">error</span>
    </li>
  </ul>
</template>

<style lang="scss" scoped>
.trace-legend {
  @apply flex flex-wrap gap-x-4 gap-y-1 px-3 py-2 border-t border-gray-200 dark:border-gray-700;
}

.trace-legend__item {
  @apply inline-flex items-center gap-1.5 text-2xs;
}

.trace-legend__swatch {
  @apply inline-block w-2.5 h-2.5 rounded-sm;
}

.trace-legend__swatch--error {
  @apply bg-transparent border-b-2 border-red-500 rounded-none h-1.5;
}

.trace-legend__name {
  @apply font-mono text-gray-800 dark:text-gray-200;
}

.trace-legend__source {
  @apply text-gray-600 dark:text-gray-400;
}
</style>
