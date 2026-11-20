<script lang="ts" setup>
import { Handle, Position } from '@vue-flow/core'
import type { TraceExternalNodeData } from '../../lib/vue-flow/map-to-trace-call-graph'

// A host the trace called that sends no telemetry of its own (#6531).

type Props = { data: TraceExternalNodeData }

defineProps<Props>()
</script>

<template>
  <div
    class="tg-node tg-node--external"
    :title="data.host"
  >
    <Handle
      id="t"
      type="target"
      :position="Position.Top"
      class="tg-handle"
    />
    <div class="tg-node__name">
      {{ data.host }}
    </div>
    <div class="tg-node__meta">
      external, no SDK
    </div>
  </div>
</template>
