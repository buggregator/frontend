<script lang="ts" setup>
import { computed } from 'vue'
import { barGeometry, waterfallScale } from '../../lib/mini-waterfall'
import type { SentrySpanPreview } from '../../types'

type Props = {
  spans: SentrySpanPreview[]
  totalMs: number
  maxSpans?: number
}

const props = withDefaults(defineProps<Props>(), {
  maxSpans: 3
})

const displaySpans = computed(() => props.spans.slice(0, props.maxSpans))

const scale = computed(() => waterfallScale(props.spans, props.totalMs))

const barStyle = (span: SentrySpanPreview) => {
  const bar = barGeometry(span, scale.value)
  if (!bar) return {}
  return {
    left: `${bar.left}%`,
    width: `${bar.width}%`,
    backgroundColor: opColor(span.peer_type, span.op)
  }
}

const opColor = (peerType: string | null, op?: string) => {
  if (peerType === 'db') return '#EF9F27'
  if (peerType === 'http') return '#85B7EB'
  if (peerType === 'cache') return '#5DCAA5'
  if (peerType === 'queue') return '#B4B2A9'
  if (op?.startsWith('http.server')) return '#AFA9EC'
  return '#AFA9EC'
}

const truncate = (text: string, max: number) => {
  if (!text) return ''
  return text.length > max ? text.substring(0, max) + '...' : text
}
</script>

<template>
  <div class="mini-wf">
    <div
      v-for="(span, i) in displaySpans"
      :key="i"
      class="mini-wf__row"
    >
      <span class="mini-wf__label">{{ truncate(span.description || span.op, 22) }}</span>
      <div class="mini-wf__track">
        <div
          class="mini-wf__bar"
          :class="{ 'mini-wf__bar--error': span.is_error }"
          :style="barStyle(span)"
        />
      </div>
      <span class="mini-wf__dur">{{ span.duration_ms }}ms</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.mini-wf {
  @apply flex flex-col gap-1;
}

.mini-wf__row {
  @apply flex items-center gap-2;
}

.mini-wf__label {
  @apply text-[10px] text-gray-500 dark:text-gray-400 truncate w-28 flex-shrink-0 text-right font-mono;
}

// overflow-hidden: no bar may widen the list around the card (frontend#390)
.mini-wf__track {
  @apply flex-1 h-3 relative rounded-sm overflow-hidden;
  @apply bg-gray-100 dark:bg-gray-700;
}

.mini-wf__bar {
  @apply absolute top-0 h-full rounded-sm;
  min-width: 2px;
}

.mini-wf__bar--error {
  outline: 1.5px solid #e24b4a;
  // inside the bar: the track clips anything outside it
  outline-offset: -1.5px;
}

.mini-wf__dur {
  @apply text-[10px] text-gray-500 dark:text-gray-400 font-mono w-12 text-right flex-shrink-0;
}
</style>
