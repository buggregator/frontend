<script lang="ts" setup>
import { Handle, Position } from '@vue-flow/core'
import { computed } from 'vue'
import type { CallGraphNodeData } from '../../lib/vue-flow'

type Props = {
  data: CallGraphNodeData
  selected: boolean
}

const props = defineProps<Props>()

const nodeStyle = computed(() => {
  const minW = 140
  const maxW = 260
  const minH = 40
  const maxH = 70
  const s = props.data.scale

  return {
    width: `${minW + (maxW - minW) * s}px`,
    minHeight: `${minH + (maxH - minH) * s}px`,
    backgroundColor: props.data.color,
    color: props.data.textColor,
    borderColor: props.selected ? '#3b82f6' : '#000',
    fontSize: `${10 + 2 * s}px`
  }
})
</script>

<template>
  <div
    class="call-graph-node"
    :class="{ 'call-graph-node--selected': selected }"
    :style="nodeStyle"
  >
    <div class="call-graph-node__name">
      {{ data.name }}
    </div>
    <div
      v-if="data.metrics.percents > 0"
      class="call-graph-node__metric"
    >
      {{ data.metrics.percents.toFixed(1) }}%
    </div>

    <Handle
      type="target"
      :position="Position.Top"
      class="call-graph-node__handle"
    />
    <Handle
      type="source"
      :position="Position.Bottom"
      class="call-graph-node__handle"
    />
  </div>
</template>

<style lang="scss" scoped>
.call-graph-node {
  @apply px-3 py-2 rounded border-2 border-black cursor-pointer transition-all duration-200;

  &:hover {
    @apply shadow-lg scale-105;
  }
}

.call-graph-node--selected {
  @apply border-blue-500 shadow-xl ring-2 ring-blue-300;
}

.call-graph-node__name {
  @apply font-medium leading-tight break-words;
  word-break: break-word;
}

.call-graph-node__metric {
  @apply mt-1 opacity-80 font-bold;
  font-size: 0.85em;
}

.call-graph-node__handle {
  @apply w-2 h-2 bg-gray-400 border-none;
}
</style>
