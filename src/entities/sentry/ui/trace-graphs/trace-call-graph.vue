<script lang="ts" setup>
import { VueFlow, useVueFlow, type NodeMouseEvent } from '@vue-flow/core'
import { useDebounceFn, useResizeObserver } from '@vueuse/core'
import { computed, nextTick, provide, ref, useId, watch } from 'vue'
import '@vue-flow/core/dist/style.css'
import { mapToTraceCallGraph, pathThrough } from '../../lib/vue-flow/map-to-trace-call-graph'
import type { SentrySpan } from '../../types'
import TraceCallEdge from './trace-call-edge.vue'
import TraceExternalNode from './trace-external-node.vue'
import { TRACE_GRAPH_MARKERS } from './trace-graph-markers'
import TraceSpanNode from './trace-span-node.vue'
import './trace-graph-theme.css'

// Call graph of one trace (#6533 A, style V1 from #6531): node = span, a column
// group per service, calls go down inside a service and right into the next.
// Hover or focus a node: its path lights up, the rest dims; click pins, Esc clears.

type Props = {
  spans: SentrySpan[]
  selectedSpanId?: string | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'select', spanId: string): void
  (e: 'show-in-waterfall', spanId: string): void
}>()

const uid = useId()
const markers = { edge: `tg-${uid}-edge`, err: `tg-${uid}-err`, hi: `tg-${uid}-hi` }
provide(TRACE_GRAPH_MARKERS, markers)

const graph = computed(() => mapToTraceCallGraph(props.spans))

const hovered = ref<string | null>(null)
const pinned = ref<string | null>(null)
watch(
  () => props.selectedSpanId,
  (id) => {
    pinned.value = id ?? null
  },
  { immediate: true }
)
const active = computed(() => hovered.value ?? pinned.value)
const path = computed(() => (active.value ? pathThrough(active.value, graph.value.edges) : null))

const nodes = computed(() =>
  graph.value.nodes.map((n) => ({
    ...n,
    class: path.value ? (path.value.nodes.has(n.id) ? 'is-hi' : 'is-dim') : ''
  }))
)
const edges = computed(() =>
  graph.value.edges.map((e) => {
    const hi = !!path.value?.edges.has(e.id)
    const dim = !!path.value && !hi
    return { ...e, class: dim ? 'is-dim' : '', data: { ...e.data, hi, dim } }
  })
)
const dimClusters = computed(() => {
  if (!path.value) return new Set<string>()
  const lit = new Set(
    graph.value.nodes.filter((n) => path.value!.nodes.has(n.id) && n.type === 'traceSpan').map((n) => n.data.service)
  )
  return new Set(graph.value.clusters.map((c) => c.service).filter((s) => !lit.has(s)))
})

const activeName = computed(() => {
  const n = graph.value.nodes.find((x) => x.id === active.value)
  return n ? (n.data.title ?? n.data.host) : null
})

const isSpan = (id: string) => !id.startsWith('ext:')

const onNodeClick = ({ node }: NodeMouseEvent) => {
  if (!isSpan(node.id)) return
  pinned.value = node.id
  emit('select', node.id)
}

// Hover and keyboard focus light the path (delegated: vue-flow wrappers carry data-id).
const nodeIdOf = (e: Event) => (e.target as HTMLElement | null)?.closest<HTMLElement>('.vue-flow__node')?.dataset.id ?? null
const onOver = (e: Event) => {
  hovered.value = nodeIdOf(e)
}
const onLeave = () => {
  hovered.value = null
}
const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    hovered.value = null
    pinned.value = null
    ;(document.activeElement as HTMLElement | null)?.blur?.()
  } else if (e.key === 'Enter' || e.key === ' ') {
    const id = nodeIdOf(e)
    if (id && isSpan(id)) {
      e.preventDefault()
      pinned.value = id
      emit('select', id)
    }
  }
}

const selected = computed(() => props.spans.find((s) => s.span_id === pinned.value) ?? null)

const { fitView, onNodesInitialized } = useVueFlow(`trace-call-graph-${uid}`)
// The whole graph in view on open and when the box changes size (#6533: on a
// 540 px window the old phone start at the root showed an empty area).
const fit = () => fitView({ padding: 0.06, minZoom: 0.2, maxZoom: 1 })
onNodesInitialized(fit)
const canvasBox = ref<HTMLElement>()
useResizeObserver(canvasBox, useDebounceFn(fit, 60))
watch(
  () => graph.value.nodes.length,
  () => nextTick(fit)
)
</script>

<template>
  <section
    class="trace-cg tg-scope"
    aria-label="Call graph"
  >
    <header class="trace-cg__head">
      <span class="trace-cg__title">Call graph</span>
      <span
        v-if="activeName"
        class="trace-cg__hint"
        data-test="cg-path-title"
      >path through <code class="trace-cg__code">{{ activeName }}</code> · Esc clears</span>
      <span
        v-else
        class="trace-cg__hint"
      >node = service · operation · hover or Tab to a node to light its path</span>
    </header>

    <svg
      class="trace-cg__defs"
      aria-hidden="true"
      width="0"
      height="0"
    >
      <defs>
        <marker
          v-for="(id, kind) in markers"
          :id="id"
          :key="id"
          viewBox="0 0 12 12"
          markerWidth="12"
          markerHeight="12"
          markerUnits="userSpaceOnUse"
          orient="auto"
          refX="1"
          refY="6"
        >
          <path
            d="M0 0 12 6 0 12z"
            :class="`tg-marker--${kind}`"
          />
        </marker>
      </defs>
    </svg>

    <div
      ref="canvasBox"
      class="trace-cg__canvas tg-canvas"
      @mouseover="onOver"
      @mouseleave="onLeave"
      @focusin="onOver"
      @focusout="onLeave"
      @keydown="onKeydown"
    >
      <VueFlow
        :id="`trace-call-graph-${uid}`"
        :nodes="nodes"
        :edges="edges"
        :nodes-draggable="false"
        :nodes-connectable="false"
        :elements-selectable="false"
        :min-zoom="0.2"
        :max-zoom="1.5"
        @node-click="onNodeClick"
      >
        <template #zoom-pane>
          <div
            v-for="c in graph.clusters"
            :key="c.service"
            class="tg-cluster"
            :class="{ 'is-dim': dimClusters.has(c.service) }"
            :style="{ '--svc': c.color, left: `${c.x}px`, top: `${c.y}px`, width: `${c.width}px`, height: `${c.height}px`, opacity: dimClusters.has(c.service) ? 0.4 : 1 }"
          >
            <div class="tg-cluster__title">
              <span class="tg-cluster__name">{{ c.service }}</span>
              <span
                v-if="c.source"
                class="tg-cluster__source"
              >{{ c.source }}</span>
            </div>
          </div>
        </template>
        <template #node-traceSpan="{ data }">
          <TraceSpanNode :data="data" />
        </template>
        <template #node-traceExternal="{ data }">
          <TraceExternalNode :data="data" />
        </template>
        <template #edge-traceCall="edgeProps">
          <TraceCallEdge v-bind="edgeProps" />
        </template>
      </VueFlow>
    </div>

    <div class="trace-cg__foot">
      <div class="tg-key">
        <span class="tg-key__item"><svg
          width="34"
          height="12"
          aria-hidden="true"
        ><line
          x1="0"
          y1="6"
          x2="22"
          y2="6"
          class="tg-edge"
        /><path
          d="M22 0 34 6 22 12z"
          class="tg-marker--edge"
        /></svg>call, caller → callee</span>
        <span class="tg-key__item"><svg
          width="34"
          height="12"
          aria-hidden="true"
        ><line
          x1="0"
          y1="6"
          x2="22"
          y2="6"
          class="tg-edge tg-edge--err"
        /><path
          d="M22 0 34 6 22 12z"
          class="tg-marker--err"
        /></svg>call that failed</span>
        <span class="tg-key__item"><svg
          width="34"
          height="12"
          aria-hidden="true"
        ><line
          x1="0"
          y1="6"
          x2="22"
          y2="6"
          class="tg-edge tg-edge--hi"
        /><path
          d="M22 0 34 6 22 12z"
          class="tg-marker--hi"
        /></svg>highlighted path</span>
        <span
          v-for="c in graph.clusters"
          :key="c.service"
          class="tg-key__item"
        ><span
          class="trace-cg__swatch"
          :style="{ background: c.color }"
          aria-hidden="true"
        />{{ c.service }}</span>
      </div>

      <div
        class="trace-cg__selected"
        aria-live="polite"
      >
        <template v-if="selected">
          <span class="trace-cg__selected-name">{{ selected.description || selected.op }}</span>
          <span class="trace-cg__hint">{{ selected.service_name }} · {{ Math.round(selected.duration_ms) }} ms</span>
          <button
            type="button"
            class="trace-cg__link"
            data-test="cg-show-in-waterfall"
            @click="emit('show-in-waterfall', selected.span_id)"
          >
            Show in waterfall
          </button>
        </template>
        <span
          v-else
          class="trace-cg__hint"
        >Click a node, or Tab to it and press Enter, to pin it.</span>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.trace-cg {
  @apply flex-1 min-h-0 flex flex-col overflow-hidden;
  @apply bg-white dark:bg-gray-800;
}

.trace-cg__head {
  @apply flex flex-none flex-wrap items-baseline gap-2 px-4 py-2 border-b border-gray-200 dark:border-gray-700;
}

.trace-cg__title {
  @apply text-xs font-semibold text-gray-900 dark:text-gray-100;
}

.trace-cg__hint {
  @apply text-2xs text-gray-600 dark:text-gray-400;
}

.trace-cg__code {
  @apply font-mono text-gray-900 dark:text-gray-100;
}

.trace-cg__defs {
  @apply absolute;
}

.trace-cg__canvas {
  @apply w-full flex-1 min-h-[320px];
}

.trace-cg__foot {
  @apply flex-none px-4 py-2 space-y-2 border-t border-gray-200 dark:border-gray-700;
}

.trace-cg__swatch {
  @apply inline-block w-2 h-2 rounded-sm;
}

.trace-cg__selected {
  @apply flex flex-wrap items-baseline gap-2 text-xs;
}

.trace-cg__selected-name {
  @apply font-mono font-semibold text-gray-900 dark:text-gray-100 break-all;
}

.trace-cg__link {
  @apply text-2xs text-blue-600 dark:text-blue-400 hover:underline;
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/60 rounded;
}
</style>
