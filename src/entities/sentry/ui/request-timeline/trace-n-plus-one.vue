<script lang="ts" setup>
import { computed } from 'vue'
import { nPlusOneText } from '../../lib/request-timeline'
import type { SentryNPlusOne } from '../../types'
import { TraceHint } from '../trace-hint'

// The N+1 hint (#6714/#6715): the same query run many times in one request.
// The place in the code shows only when the SDK sent it (slow queries only
// by default in sentry-laravel).

type Props = { nPlusOne: SentryNPlusOne }

const props = defineProps<Props>()
const emit = defineEmits<{ select: [spanId: string] }>()

const text = computed(() => nPlusOneText(props.nPlusOne))
</script>

<template>
  <TraceHint
    tag="N+1"
    action-label="Show the queries"
    data-test="trace-n-plus-one"
    @action="emit('select', props.nPlusOne.span_ids[0])"
  >
    {{ text.count }}
    <template #detail>
      <code class="trace-n-plus-one__query">{{ props.nPlusOne.query }}</code>
      {{ text.took }}<span v-if="text.origin">, from <code class="trace-n-plus-one__origin">{{ text.origin }}</code></span>.
      Load them in one query (eager loading).
    </template>
  </TraceHint>
</template>

<style lang="scss" scoped>
.trace-n-plus-one__query,
.trace-n-plus-one__origin {
  @apply font-mono break-all;
}
</style>
