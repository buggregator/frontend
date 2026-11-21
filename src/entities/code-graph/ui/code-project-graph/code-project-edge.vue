<script lang="ts" setup>
import { EdgeLabelRenderer, Position, getBezierPath, type EdgeProps } from '@vue-flow/core'
import { computed, inject } from 'vue'
import { CODE_GRAPH_MARKERS } from '../code-focus-graph/code-graph-markers'

// Calls between two boxes of the whole graph (#6531 V1): wider with more
// calls, the count above the line; dashed when only guessed by method name.

type Props = EdgeProps<{ label: string; width: number; guessed?: boolean; hi?: boolean; dim?: boolean }>

const props = defineProps<Props>()
const markers = inject(CODE_GRAPH_MARKERS)

const SHORTEN = 11

const geometry = computed(() => {
  const tx = props.targetPosition === Position.Left ? props.targetX - SHORTEN : props.targetX
  // Curves: in a dense whole graph right-angled lines merge into a grid.
  const [path, labelX, labelY] = getBezierPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition,
    targetX: tx,
    targetY: props.targetY,
    targetPosition: props.targetPosition
  })
  return { path, labelX, labelY }
})

const marker = computed(() => {
  if (!markers) return undefined
  if (props.data?.hi) return `url(#${markers.hi})`
  return props.data?.guessed ? `url(#${markers.guess})` : `url(#${markers.edge})`
})

const labelStyle = computed(() => ({
  transform: `translate(${geometry.value.labelX}px, ${geometry.value.labelY}px) translate(-50%, -50%)`
}))
</script>

<template>
  <path
    class="tg-edge"
    :class="{ 'tg-edge--hi': data?.hi, 'cg-edge--guess': data?.guessed }"
    :style="{ strokeWidth: data?.hi ? (data?.width ?? 2) + 1 : data?.width }"
    :d="geometry.path"
    :marker-end="marker"
    fill="none"
  />
  <EdgeLabelRenderer v-if="data?.label">
    <div
      class="tg-edge-label cg-project-edge__label nodrag nopan"
      :class="{ 'tg-edge-label--dim': data.dim }"
      :style="labelStyle"
    >
      {{ data.label }}
    </div>
  </EdgeLabelRenderer>
</template>
