<script lang="ts" setup>
import { computed } from 'vue'
import { traceInsight } from '../../lib/trace-graph/trace-graph'
import type { SentrySpan } from '../../types'

// One line the graphs show and the waterfall hides (#6533 A): a service that
// kept working after its caller stopped waiting.

type Props = { spans: SentrySpan[] }

const props = defineProps<Props>()
const emit = defineEmits<{ (e: 'select', spanId: string): void }>()

const insight = computed(() => traceInsight(props.spans))
const ms = (n: number) => `${Math.round(n)} ms`
</script>

<template>
  <div
    v-if="insight"
    class="trace-insight"
    data-test="trace-insight"
  >
    <strong class="trace-insight__main">
      {{ insight.service }} kept working {{ ms(insight.overrunMs) }} after {{ insight.caller }} gave up.
    </strong>
    <span class="trace-insight__detail">
      {{ insight.caller }} waited {{ ms(insight.callerWaitedMs) }}{{ insight.callerFailed ? ' and failed' : '' }};
      {{ insight.service }} took {{ ms(insight.calleeMs) }}.
    </span>
    <button
      type="button"
      class="trace-insight__link"
      @click="emit('select', insight.spanId)"
    >
      Select the span
    </button>
  </div>
</template>

<style lang="scss" scoped>
.trace-insight {
  @apply flex flex-wrap items-baseline gap-x-2 gap-y-1 mb-4 px-3 py-2 rounded-md text-xs;
  @apply border border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10;
}

.trace-insight__main {
  @apply font-semibold text-gray-900 dark:text-gray-100;
}

.trace-insight__detail {
  @apply text-gray-700 dark:text-gray-300;
}

.trace-insight__link {
  @apply text-2xs text-blue-700 dark:text-blue-400 hover:underline;
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/60 rounded;
}
</style>
