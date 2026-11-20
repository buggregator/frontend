<script lang="ts" setup>
import { Handle, Position } from '@vue-flow/core'
import { computed } from 'vue'
import type { TraceSpanNodeData } from '../../lib/vue-flow/map-to-trace-call-graph'

// A span in the call graph (#6531): name, `op · total`, self time or the error.
// No coloured strip or bar: the service shows by its cluster.

type Props = { data: TraceSpanNodeData }

const props = defineProps<Props>()

const MAX_NAME = 22
const name = computed(() =>
  props.data.title.length > MAX_NAME ? `${props.data.title.slice(0, MAX_NAME - 1)}…` : props.data.title
)
const fmt = (ms: number) => (ms >= 10 ? Math.round(ms) : Math.round(ms * 10) / 10)
</script>

<template>
  <div
    class="tg-node"
    :class="{ 'tg-node--err': data.isError }"
    :title="data.title"
    data-test="call-graph-node"
  >
    <Handle
      id="t"
      type="target"
      :position="Position.Top"
      class="tg-handle"
    />
    <Handle
      id="l"
      type="target"
      :position="Position.Left"
      class="tg-handle"
    />
    <div class="tg-node__name">
      {{ name }}
    </div>
    <div class="tg-node__meta">
      {{ data.op }} · {{ fmt(data.totalMs) }} ms
    </div>
    <div
      class="tg-node__self"
      :class="{ 'tg-node__self--err': data.isError }"
    >
      <template v-if="data.isError">
        ✕ error ·
      </template>
      self {{ fmt(data.selfMs) }} ms
    </div>
    <Handle
      id="b"
      type="source"
      :position="Position.Bottom"
      class="tg-handle"
    />
    <Handle
      id="r"
      type="source"
      :position="Position.Right"
      class="tg-handle"
    />
  </div>
</template>
