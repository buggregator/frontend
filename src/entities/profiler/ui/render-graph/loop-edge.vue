<script lang="ts" setup>
import { BaseEdge, type EdgeProps, type GraphNode } from '@vue-flow/core'
import { computed } from 'vue'
import { backEdgePath, selfLoopPath } from '../../lib/vue-flow'

// A call of a function to itself, or back up to a caller of its caller: the default edges join the bottom of a node
// to the top of one below, and would run across the nodes. These go out of the right sides instead.
const props = defineProps<EdgeProps>()

const box = (node: GraphNode) => ({ ...node.computedPosition, ...node.dimensions })

const loop = computed(() => {
  const from = box(props.sourceNode)

  return props.source === props.target
    ? selfLoopPath(from.x + from.width, from.y + from.height / 2)
    : backEdgePath(from, box(props.targetNode))
})
</script>

<template>
  <BaseEdge
    :id="id"
    :path="loop.path"
    :label-x="loop.labelX"
    :label-y="loop.labelY"
    :label="label"
    :label-style="labelStyle"
    :label-bg-style="labelBgStyle"
    :marker-end="markerEnd"
    :style="style"
  />
</template>
