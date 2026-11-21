<script lang="ts" setup>
import { VueFlow, useVueFlow, type NodeMouseEvent } from '@vue-flow/core'
import { useDebounceFn, useResizeObserver } from '@vueuse/core'
import { computed, nextTick, provide, ref, toRef, useId, watch } from 'vue'
import '@vue-flow/core/dist/style.css'
import '@/shared/ui/graph-theme/graph-theme.css'
import { highlightCounts, PROJECT_NODE_H, PROJECT_NODE_W, type ProjectNode } from '../../lib/project-layout'
import { useProjectGraph } from '../../lib/use-project-graph'
import type { CodeGraphNode, CodeSymbol } from '../../types'
import { CODE_GRAPH_MARKERS } from '../code-focus-graph/code-graph-markers'
import CodeProjectEdge from './code-project-edge.vue'
import CodeProjectNode from './code-project-node.vue'

// The whole graph of one root (#6577 «whole»): namespaces or packages with
// the calls between them. Click a box to open it (classes, then methods);
// a function or method opens the focus view. Found symbols light up their
// box in place.

const props = defineProps<{ root: string; found?: readonly Pick<CodeSymbol, 'id' | 'fqn'>[] | null }>()
const emit = defineEmits<{ (e: 'open', node: CodeGraphNode): void }>()

const uid = useId()
const markers = { edge: `cp-${uid}-edge`, hi: `cp-${uid}-hi`, guess: `cp-${uid}-guess` }
provide(CODE_GRAPH_MARKERS, markers)

const p = useProjectGraph(toRef(props, 'root'))

const hovered = ref<string | null>(null)
const matches = computed(() => (props.found && p.layout.value ? highlightCounts(p.layout.value.nodes, props.found) : null))

// Hover: the box and the lines in and out of it; search: the found boxes.
const near = computed(() => {
  const l = p.layout.value
  if (!l || !hovered.value) return null
  const nodes = new Set([hovered.value])
  const edges = new Set<string>()
  for (const e of l.edges) {
    if (e.source === hovered.value || e.target === hovered.value) {
      edges.add(e.id)
      nodes.add(e.source)
      nodes.add(e.target)
    }
  }
  return { nodes, edges }
})

const nodes = computed(() =>
  (p.layout.value?.nodes ?? []).map((n) => {
    const dim = near.value ? !near.value.nodes.has(n.id) : matches.value ? !matches.value.has(n.id) : false
    return {
      id: n.id,
      type: 'project',
      position: { x: n.x - PROJECT_NODE_W / 2, y: n.y - PROJECT_NODE_H / 2 },
      data: n,
      class: dim ? 'is-dim' : ''
    }
  })
)

const edges = computed(() =>
  (p.layout.value?.edges ?? []).map((e) => {
    const hi = !!near.value?.edges.has(e.id)
    const dim = near.value ? !hi : !!matches.value
    return {
      id: e.id,
      source: e.source,
      target: e.target,
      type: 'project',
      class: dim ? 'is-dim' : '',
      data: { count: e.count, width: e.width, guessed: e.guessed, hi, dim }
    }
  })
)

const nodeById = (id: string): ProjectNode | undefined => p.layout.value?.nodes.find((n) => n.id === id)
const activate = (id: string) => {
  const n = nodeById(id)
  if (!n) return
  if (n.expandable) p.expand(id)
  else if (n.callable) emit('open', n.node)
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

const { fitView, onNodesInitialized, zoomIn, zoomOut } = useVueFlow(`code-project-${uid}`)
const fit = () => fitView({ padding: 0.08, minZoom: 0.15, maxZoom: 1 })
// After a box opens, the view moves to what it holds; otherwise the whole graph.
const fitOpened = () => {
  const g = p.lastOpened.value ? p.layout.value?.groups.find((x) => x.id === p.lastOpened.value) : null
  const inside = g
    ? (p.layout.value?.nodes ?? []).filter((n) => n.x > g.x && n.x < g.x + g.width && n.y > g.y && n.y < g.y + g.height).map((n) => n.id)
    : []
  if (inside.length) fitView({ nodes: inside, padding: 0.12, minZoom: 0.15, maxZoom: 1, duration: 250 })
  else fit()
}
onNodesInitialized(fitOpened)
const canvasBox = ref<HTMLElement>()
useResizeObserver(canvasBox, useDebounceFn(fitOpened, 60))
watch(
  () => p.layout.value,
  () => {
    hovered.value = null
    nextTick(fitOpened)
  }
)
</script>

<template>
  <section
    class="code-project-graph tg-scope"
    aria-label="Project graph"
    :aria-busy="p.state.value === 'loading'"
  >
    <svg
      class="code-project-graph__defs"
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
      v-if="p.state.value === 'error'"
      class="code-project-graph__msg"
      role="alert"
    >
      <p>Could not load the graph: {{ p.error.value }}</p>
      <button
        type="button"
        class="code-project-graph__btn"
        @click="p.reload()"
      >
        Try again
      </button>
    </div>
    <div
      v-else-if="p.state.value === 'ready' && !p.layout.value?.nodes.length"
      class="code-project-graph__msg"
    >
      <p>Nothing indexed in <code>{{ root }}</code> yet.</p>
    </div>

    <div
      v-else
      ref="canvasBox"
      class="code-project-graph__canvas tg-canvas"
      @mouseover="onOver"
      @mouseleave="onLeave"
      @focusin="onOver"
      @focusout="onLeave"
      @keydown="onKeydown"
    >
      <VueFlow
        :id="`code-project-${uid}`"
        :nodes="nodes"
        :edges="edges"
        :nodes-draggable="false"
        :nodes-connectable="false"
        :elements-selectable="false"
        :nodes-focusable="false"
        :edges-focusable="false"
        :min-zoom="0.15"
        :max-zoom="1.5"
        @node-click="onNodeClick"
      >
        <template #zoom-pane>
          <div
            v-for="g in p.layout.value?.groups ?? []"
            :key="g.id"
            class="code-project-graph__frame"
            :class="{ 'code-project-graph__frame--inner': g.depth > 0 }"
            :style="{ left: `${g.x}px`, top: `${g.y}px`, width: `${g.width}px`, height: `${g.height}px` }"
          >
            <button
              type="button"
              class="code-project-graph__frame-title nodrag nopan"
              :aria-label="`Close ${g.kind} ${g.fqn || g.name}`"
              :title="`Close ${g.fqn || g.name}`"
              @click="p.collapse(g.id)"
            >
              <span aria-hidden="true">−</span>
              <span class="code-project-graph__frame-kind">{{ g.kind }}</span>
              {{ g.name || g.fqn }}
            </button>
          </div>
        </template>
        <template #node-project="nodeProps">
          <CodeProjectNode
            :data="nodeProps.data"
            :matches="matches?.get(nodeProps.id)"
          />
        </template>
        <template #edge-project="edgeProps">
          <CodeProjectEdge v-bind="edgeProps" />
        </template>
      </VueFlow>

      <p
        v-if="p.state.value === 'loading'"
        class="code-project-graph__loading"
        role="status"
      >
        Loading…
      </p>

      <div class="code-project-graph__zoom">
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

      <p
        v-if="p.layout.value?.truncated"
        class="code-project-graph__trunc"
      >
        Too many boxes to draw them all: the most connected are shown.
      </p>
    </div>

    <footer class="tg-key code-project-graph__key">
      <span class="tg-key__item"><span class="code-project-graph__swatch" />calls, the number on the line</span>
      <span class="tg-key__item">click a box to open it, a function to see its calls</span>
      <button
        v-if="p.anyOpen.value"
        type="button"
        class="code-project-graph__btn code-project-graph__btn--small"
        @click="p.collapseAll()"
      >
        Close all
      </button>
    </footer>
  </section>
</template>

<style>
.code-project-graph {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}

.code-project-graph__defs {
  position: absolute;
}

.code-project-graph__canvas {
  position: relative;
  flex: 1;
  min-height: 320px;
}

.code-project-graph__frame {
  position: absolute;
  z-index: -1;
  border: 1px dashed var(--tg-node-line);
  border-radius: 8px;
  background: color-mix(in srgb, var(--tg-edge-hi) 5%, transparent);
  pointer-events: none;
}

.code-project-graph__frame--inner {
  background: color-mix(in srgb, var(--tg-edge-hi) 7%, transparent);
}

.code-project-graph__frame-title {
  display: flex;
  align-items: center;
  gap: 6px;
  max-width: calc(100% - 16px);
  margin: 4px 8px 0;
  padding: 0 6px;
  border-radius: 3px;
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  font-weight: 600;
  line-height: 18px;
  color: var(--tg-strong);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  pointer-events: auto;
}

.code-project-graph__frame-title:hover {
  background: var(--tg-pill);
}

.code-project-graph__frame-title:focus-visible,
.code-project-graph .cg-pnode:focus-visible,
.code-project-graph__zoom button:focus-visible,
.code-project-graph__btn:focus-visible {
  outline: 2px solid #f43f5e;
  outline-offset: 2px;
}

.code-project-graph__frame-kind {
  font-weight: 400;
  color: var(--tg-muted);
}

.code-project-graph .cg-edge--guess {
  stroke-dasharray: 5 4;
}

.code-project-graph .cg-project-edge__label {
  pointer-events: none;
}

.code-project-graph__zoom {
  position: absolute;
  right: 12px;
  bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  z-index: 5;
}

.code-project-graph__zoom button {
  width: 32px;
  height: 32px;
  border: 1px solid var(--tg-pill-line);
  border-radius: 4px;
  background: var(--tg-pill);
  color: var(--tg-strong);
  font-size: 14px;
}

.code-project-graph__loading,
.code-project-graph__trunc {
  position: absolute;
  left: 12px;
  z-index: 5;
  margin: 0;
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--tg-pill);
  color: var(--tg-muted);
  font-size: 12px;
}

.code-project-graph__loading {
  top: 12px;
}

.code-project-graph__trunc {
  bottom: 12px;
}

.code-project-graph__msg {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 32px 16px;
  color: var(--tg-muted);
  font-size: 14px;
}

.code-project-graph__btn {
  padding: 4px 12px;
  border: 1px solid var(--tg-pill-line);
  border-radius: 4px;
  background: var(--tg-pill);
  color: var(--tg-strong);
  font-size: 13px;
}

.code-project-graph__btn--small {
  margin-left: auto;
  padding: 0 8px;
  font-size: 12px;
}

.code-project-graph__key {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  padding: 8px 12px;
  border-top: 1px solid var(--tg-pill-line);
}

.code-project-graph__swatch {
  display: inline-block;
  width: 24px;
  border-top: 3px solid var(--tg-edge);
}
</style>
