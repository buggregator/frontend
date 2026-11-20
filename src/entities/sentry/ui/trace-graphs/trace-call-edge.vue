<script lang="ts" setup>
import { EdgeLabelRenderer, Position, getSmoothStepPath, type EdgeProps } from '@vue-flow/core'
import { computed, inject } from 'vue'
import type { TraceCallEdgeData } from '../../lib/vue-flow/map-to-trace-call-graph'
import { TRACE_GRAPH_MARKERS } from './trace-graph-markers'

// One call (#6531 V1): a solid line with a 12 px filled arrowhead in the line's
// colour; the line stops 11 px short so a thick line never pokes out of the tip.
// On the highlighted path a second line of moving dots runs over it.

type Props = EdgeProps<TraceCallEdgeData & { hi?: boolean; dim?: boolean }>

const props = defineProps<Props>()
const markers = inject(TRACE_GRAPH_MARKERS)

const SHORTEN = 11

const geometry = computed(() => {
  let tx = props.targetX
  let ty = props.targetY
  if (props.targetPosition === Position.Left) tx -= SHORTEN
  else if (props.targetPosition === Position.Top) ty -= SHORTEN
  else if (props.targetPosition === Position.Right) tx += SHORTEN
  else ty += SHORTEN
  const [path] = getSmoothStepPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition,
    targetX: tx,
    targetY: ty,
    targetPosition: props.targetPosition,
    borderRadius: 6
  })
  return { path, midX: (props.sourceX + tx) / 2, midY: (props.sourceY + ty) / 2 }
})

const marker = computed(() => {
  if (!markers) return undefined
  if (props.data?.failed) return `url(#${markers.err})`
  return props.data?.hi ? `url(#${markers.hi})` : `url(#${markers.edge})`
})

const labelStyle = computed(() => {
  const { midX, midY } = geometry.value
  return props.data?.labelSide === 'right'
    ? { transform: `translate(${props.sourceX + 12}px, ${midY}px) translateY(-50%)` }
    : { transform: `translate(${midX}px, ${props.sourceY - 18}px) translate(-50%, -50%)` }
})
</script>

<template>
  <path
    class="tg-edge"
    :class="{ 'tg-edge--err': data?.failed, 'tg-edge--hi': data?.hi }"
    :d="geometry.path"
    :marker-end="marker"
    fill="none"
  />
  <path
    v-if="data?.hi"
    class="tg-edge-flow"
    :d="geometry.path"
    fill="none"
  />
  <EdgeLabelRenderer v-if="data?.label">
    <div
      class="tg-edge-label nodrag nopan"
      :class="{ 'tg-edge-label--err': data.failed, 'tg-edge-label--dim': data.dim }"
      :style="labelStyle"
    >
      {{ data.label }}
    </div>
  </EdgeLabelRenderer>
</template>
