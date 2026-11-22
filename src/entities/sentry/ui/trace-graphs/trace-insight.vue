<script lang="ts" setup>
import { computed } from 'vue'
import { overrunText, traceInsight } from '../../lib/trace-graph/trace-graph'
import type { SentrySpan } from '../../types'
import { TraceHint } from '../trace-hint'

// One line the graphs show and the waterfall hides (#6533 A): a service that
// kept working after its caller stopped waiting.

type Props = { spans: SentrySpan[] }

const props = defineProps<Props>()
const emit = defineEmits<{ (e: 'select', spanId: string): void }>()

const insight = computed(() => traceInsight(props.spans))
const ms = (n: number) => `${Math.round(n)} ms`
</script>

<template>
  <TraceHint
    v-if="insight"
    data-test="trace-insight"
    action-label="Select the span"
    @action="emit('select', insight.spanId)"
  >
    {{ overrunText(insight.service, insight.caller, ms(insight.overrunMs), insight.callerFailed) }}.
    <template #detail>
      {{ insight.caller }} waited {{ ms(insight.callerWaitedMs) }}{{ insight.callerFailed ? ' and failed' : '' }};
      {{ insight.service }} took {{ ms(insight.calleeMs) }}.
    </template>
  </TraceHint>
</template>
