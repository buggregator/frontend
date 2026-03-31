<script lang="ts" setup>
import { VueFlow, useVueFlow } from '@vue-flow/core'
import type { Node, Edge } from '@vue-flow/core'
import { ref, onMounted, watch, h, defineComponent } from 'vue'
import { useSentryRequests } from '../../lib'
import { mapToServiceMap, type ServiceNodeData } from '../../lib/vue-flow'

type Props = {
  windowMinutes?: number
}

const props = withDefaults(defineProps<Props>(), {
  windowMinutes: 60
})

const { getServiceMap } = useSentryRequests()
const nodes = ref<Node[]>([])
const edges = ref<Edge[]>([])
const loading = ref(false)

const { fitView } = useVueFlow({ id: 'service-map' })

const fetchMap = async () => {
  loading.value = true
  try {
    const data = await getServiceMap(props.windowMinutes)
    const result = mapToServiceMap(data)
    nodes.value = result.nodes
    edges.value = result.edges
    setTimeout(() => fitView({ padding: 0.2 }), 100)
  } finally {
    loading.value = false
  }
}

onMounted(fetchMap)
watch(() => props.windowMinutes, fetchMap)

// Custom node component defined inline.
const ServiceNode = defineComponent({
  props: { data: { type: Object, required: true } },
  setup(props) {
    const d = props.data as ServiceNodeData
    const borderColor =
      d.errorRate >= 0.05
        ? '#ef4444'
        : d.errorRate > 0
          ? '#f59e0b'
          : 'var(--service-node-border, #e5e7eb)'

    return () =>
      h(
        'div',
        {
          class: 'service-node',
          style: {
            border: `2px solid ${borderColor}`
          }
        },
        [
          h('div', { class: 'service-node__label' }, d.label),
          h('div', { class: 'service-node__meta' }, [
            `${d.requestCount} req`,
            d.avgDurationMs != null ? ` · ${d.avgDurationMs}ms` : ''
          ])
        ]
      )
  }
})
</script>

<template>
  <div class="service-map">
    <div
      v-if="loading"
      class="service-map__loading"
    >
      Loading service map...
    </div>

    <div
      v-else-if="nodes.length === 0"
      class="service-map__empty"
    >
      No service map data available. Send traces with span attributes to build the graph.
    </div>

    <VueFlow
      v-else
      :nodes="nodes"
      :edges="edges"
      :default-viewport="{ zoom: 0.9, x: 0, y: 0 }"
      :min-zoom="0.2"
      :max-zoom="2"
      fit-view-on-init
      class="service-map__flow"
    >
      <template #node-serviceNode="{ data: nodeData }">
        <ServiceNode :data="nodeData" />
      </template>
    </VueFlow>
  </div>
</template>

<style lang="scss" scoped>
.service-map {
  @apply h-full min-h-[400px] relative;
  --service-node-border: #e5e7eb;
}

:root.dark .service-map {
  --service-node-border: #374151;
}

.service-map__loading,
.service-map__empty {
  @apply flex items-center justify-center h-full;
  @apply text-sm text-gray-400;
}

.service-map__flow {
  @apply h-full;
}
</style>

<style lang="scss">
.service-node {
  padding: 8px 12px;
  border-radius: 8px;
  min-width: 120px;
  text-align: center;
  font-size: 12px;
  background-color: #fff;
  color: #111827;

  .dark & {
    background-color: #1f2937;
    color: #f3f4f6;
  }
}

.service-node__label {
  font-weight: 600;
  margin-bottom: 2px;
}

.service-node__meta {
  font-size: 10px;
  color: #9ca3af;

  .dark & {
    color: #6b7280;
  }
}
</style>
