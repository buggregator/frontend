<script lang="ts" setup>
import { VueFlow, useVueFlow, type NodeMouseEvent } from '@vue-flow/core'
import { useDebounceFn, useResizeObserver } from '@vueuse/core'
import { computed, nextTick, provide, ref, useId, watch } from 'vue'
import '@vue-flow/core/dist/style.css'
import '@/shared/ui/graph-theme/graph-theme.css'
import { NODE_H, NODE_W, pathToFocus, type FocusLayout, type FocusNode } from '../../lib/focus-layout'
import CodeGraphEdge from './code-graph-edge.vue'
import { CODE_GRAPH_MARKERS } from './code-graph-markers'
import CodeGraphNode from './code-graph-node.vue'

// The graph around one symbol (#6573 A): callers left, callees right.
// Hover or Tab to a node: its way to the focus lights up. Click or Enter
// selects it (the page shows it in the side panel); a «+N more» node opens
// its whole column.

const props = defineProps<{ layout: FocusLayout; selectedId?: string | null }>()
const emit = defineEmits<{
  (e: 'select', id: string): void
  (e: 'expand', column: number): void
}>()

const uid = useId()
const markers = { edge: `cg-${uid}-edge`, hi: `cg-${uid}-hi`, guess: `cg-${uid}-guess` }
provide(CODE_GRAPH_MARKERS, markers)

const hovered = ref<string | null>(null)
const active = computed(() => hovered.value ?? props.selectedId ?? null)
const path = computed(() => (active.value ? pathToFocus(props.layout, active.value) : null))

const nodes = computed(() =>
  props.layout.nodes.map((n) => ({
    id: n.id,
    type: 'code',
    position: { x: n.x - NODE_W / 2, y: n.y - NODE_H / 2 },
    data: n,
    class: [path.value ? (path.value.nodes.has(n.id) ? 'is-hi' : 'is-dim') : '', n.id === props.selectedId ? 'is-selected' : '']
      .filter(Boolean)
      .join(' ')
  }))
)

const edges = computed(() =>
  props.layout.edges.map((e) => {
    const hi = !!path.value?.edges.has(e.id)
    return {
      id: e.id,
      source: e.source,
      target: e.target,
      type: 'code',
      class: path.value && !hi ? 'is-dim' : '',
      data: { guessed: e.guessed || e.kind === 'more', hi }
    }
  })
)

// Column titles over each column.
const columns = computed(() => {
  const byCol = new Map<number, FocusNode[]>()
  for (const n of props.layout.nodes) byCol.set(n.column, [...(byCol.get(n.column) ?? []), n])
  const top = Math.min(...props.layout.nodes.map((n) => n.y)) - NODE_H / 2 - 30
  return [...byCol.keys()].sort((a, b) => a - b).map((c) => {
    const depth = Math.abs(c)
    const name = c < 0 ? 'Callers' : c > 0 ? 'Callees' : 'Focus'
    return { column: c, x: byCol.get(c)![0].x - NODE_W / 2, y: top, title: depth > 1 ? `${name} · depth ${depth}` : name }
  })
})

const nodeById = (id: string) => props.layout.nodes.find((n) => n.id === id)
const activate = (id: string) => {
  const n = nodeById(id)
  if (!n) return
  if (n.role === 'more') emit('expand', n.column)
  else emit('select', id)
}
const onNodeClick = ({ node }: NodeMouseEvent) => activate(node.id)

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
    ;(document.activeElement as HTMLElement | null)?.blur?.()
  } else if (e.key === 'Enter' || e.key === ' ') {
    const id = nodeIdOf(e)
    if (id) {
      e.preventDefault()
      activate(id)
    }
  }
}

const { fitView, onNodesInitialized, zoomIn, zoomOut } = useVueFlow(`code-graph-${uid}`)
const fit = () => fitView({ padding: 0.12, minZoom: 0.3, maxZoom: 1 })
onNodesInitialized(fit)
const canvasBox = ref<HTMLElement>()
useResizeObserver(canvasBox, useDebounceFn(fit, 60))
watch(
  () => props.layout,
  () => nextTick(fit)
)
</script>

<template>
  <section
    class="code-focus-graph tg-scope"
    aria-label="Call graph"
  >
    <svg
      class="code-focus-graph__defs"
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
            :class="kind === 'guess' ? 'tg-marker--edge' : `tg-marker--${kind}`"
          />
        </marker>
      </defs>
    </svg>

    <div
      ref="canvasBox"
      class="code-focus-graph__canvas tg-canvas"
      @mouseover="onOver"
      @mouseleave="onLeave"
      @focusin="onOver"
      @focusout="onLeave"
      @keydown="onKeydown"
    >
      <VueFlow
        :id="`code-graph-${uid}`"
        :nodes="nodes"
        :edges="edges"
        :nodes-draggable="false"
        :nodes-connectable="false"
        :elements-selectable="false"
        :nodes-focusable="false"
        :edges-focusable="false"
        :min-zoom="0.3"
        :max-zoom="1.5"
        @node-click="onNodeClick"
      >
        <template #zoom-pane>
          <div
            v-for="c in columns"
            :key="c.column"
            class="code-focus-graph__col"
            :style="{ left: `${c.x}px`, top: `${c.y}px`, width: `${NODE_W}px` }"
          >
            {{ c.title }}
          </div>
        </template>
        <template #node-code="nodeProps">
          <CodeGraphNode :data="nodeProps.data" />
        </template>
        <template #edge-code="edgeProps">
          <CodeGraphEdge v-bind="edgeProps" />
        </template>
      </VueFlow>

      <div class="code-focus-graph__zoom">
        <button
          type="button"
          aria-label="Zoom in"
          @click="zoomIn()"
        >
          +
        </button>
        <button
          type="button"
          aria-label="Zoom out"
          @click="zoomOut()"
        >
          −
        </button>
        <button
          type="button"
          aria-label="Fit the graph"
          @click="fit()"
        >
          ⤢
        </button>
      </div>
    </div>

    <footer class="tg-key code-focus-graph__key">
      <span class="tg-key__item"><span class="code-focus-graph__swatch" />calls (caller → callee)</span>
      <span class="tg-key__item"><span class="code-focus-graph__swatch code-focus-graph__swatch--guess" />guessed by method name, type unknown</span>
      <span class="tg-key__item"><span class="code-focus-graph__swatch code-focus-graph__swatch--box" />outside the index (vendor)</span>
    </footer>
  </section>
</template>

<style>
.code-focus-graph {
  --cg-warn: #b45309;

  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}

.dark .code-focus-graph {
  --cg-warn: #fbbf24;
}

.code-focus-graph__defs {
  position: absolute;
}

.code-focus-graph__canvas {
  position: relative;
  flex: 1;
  min-height: 320px;
}

.code-focus-graph__col {
  position: absolute;
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--tg-muted);
  pointer-events: none;
}

.code-focus-graph .vue-flow__node.is-selected .tg-node {
  outline: 2px solid var(--tg-edge-hi);
  outline-offset: 2px;
}

.code-focus-graph .cg-node:focus-visible {
  outline: 2px solid #f43f5e;
  outline-offset: 2px;
}

.code-focus-graph .cg-edge--guess {
  stroke-dasharray: 5 4;
}

.code-focus-graph__zoom {
  position: absolute;
  right: 12px;
  bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  z-index: 5;
}

.code-focus-graph__zoom button {
  width: 32px;
  height: 32px;
  border: 1px solid var(--tg-pill-line);
  border-radius: 4px;
  background: var(--tg-pill);
  color: var(--tg-strong);
  font-size: 14px;
}

.code-focus-graph__zoom button:focus-visible {
  outline: 2px solid #f43f5e;
  outline-offset: 1px;
}

.code-focus-graph__key {
  padding: 8px 12px;
  border-top: 1px solid var(--tg-pill-line);
}

.code-focus-graph__swatch {
  display: inline-block;
  width: 24px;
  border-top: 2px solid var(--tg-edge);
}

.code-focus-graph__swatch--guess {
  border-top-style: dashed;
}

.code-focus-graph__swatch--box {
  width: 14px;
  height: 10px;
  border: 1px dashed var(--tg-node-line);
}
</style>
