<script lang="ts" setup>
import { Position, getSmoothStepPath, type EdgeProps } from '@vue-flow/core'
import { computed, inject } from 'vue'
import { CODE_GRAPH_MARKERS } from './code-graph-markers'

// A call (#6531 V1): solid line, 12 px arrowhead, stops 11 px short of the
// node. A guess by method name is dashed (the node says so in text too).

type Props = EdgeProps<{ guessed?: boolean; hi?: boolean }>

const props = defineProps<Props>()
const markers = inject(CODE_GRAPH_MARKERS)

const SHORTEN = 11

const path = computed(() => {
  const tx = props.targetPosition === Position.Left ? props.targetX - SHORTEN : props.targetX
  const [d] = getSmoothStepPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition,
    targetX: tx,
    targetY: props.targetY,
    targetPosition: props.targetPosition,
    borderRadius: 6
  })
  return d
})

const marker = computed(() => {
  if (!markers) return undefined
  if (props.data?.hi) return `url(#${markers.hi})`
  return props.data?.guessed ? `url(#${markers.guess})` : `url(#${markers.edge})`
})
</script>

<template>
  <path
    class="tg-edge"
    :class="{ 'tg-edge--hi': data?.hi, 'cg-edge--guess': data?.guessed }"
    :d="path"
    :marker-end="marker"
    fill="none"
  />
  <path
    v-if="data?.hi"
    class="tg-edge-flow"
    :d="path"
    fill="none"
  />
</template>
