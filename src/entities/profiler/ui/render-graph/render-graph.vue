<script lang="ts" setup>
import { VueFlow, useVueFlow, type NodeMouseEvent } from '@vue-flow/core'
import { ref, computed, watch } from 'vue'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import { mapToVueFlow } from '../../lib/vue-flow'
import type { ProfilerCallGraph, CallStackHoverData } from '../../types'
import CallGraphNodeComponent from './call-graph-node.vue'

export type PathStep = {
  id: string
  name: string
  cost: Record<string, number>
  metrics: { cost: number; percents: number }
}

type Props = {
  serverData: ProfilerCallGraph
  height: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'path-selected', path: PathStep[]): void
  (e: 'path-cleared'): void
}>()

const { nodes, edges } = mapToVueFlow(props.serverData)

const flowNodes = ref(nodes)
const flowEdges = ref(edges)

const selectedNodeId = ref<string | null>(null)
const highlightedNodeIds = ref<Set<string>>(new Set())
const highlightedEdgeIds = ref<Set<string>>(new Set())

const activeStatBoard = ref<CallStackHoverData>()
const tooltipPosition = ref<{ top: string; left: string }>()
const tooltip = ref<HTMLElement>()

const { setCenter, getNode } = useVueFlow({ id: 'call-graph' })

// --- Path finding utilities ---

function getParentsMap(): Map<string, string[]> {
  const parents = new Map<string, string[]>()
  for (const e of flowEdges.value) {
    const list = parents.get(e.target) || []
    list.push(e.source)
    parents.set(e.target, list)
  }
  return parents
}

function getPathToRoot(nodeId: string): string[] {
  const parents = getParentsMap()
  const visited = new Set<string>()
  const collected: string[] = []

  function walk(id: string) {
    if (visited.has(id)) return
    visited.add(id)
    collected.push(id)
    const pars = parents.get(id) || []
    for (const p of pars) {
      walk(p)
    }
  }

  walk(nodeId)
  return collected
}

function getOrderedPathToRoot(nodeId: string): string[] {
  const path = getPathToRoot(nodeId)
  return path.reverse()
}

function buildPathSteps(nodeIds: string[]): PathStep[] {
  return nodeIds.map((id) => {
    const node = flowNodes.value.find((n) => n.id === id)
    return {
      id,
      name: node?.data?.name || id,
      cost: node?.data?.cost || {},
      metrics: node?.data?.metrics || { cost: 0, percents: 0 }
    }
  })
}

// --- Hottest path: greedy walk from root following max percents child ---

function findHottestPath(): string[] {
  const nodeMap = new Map(flowNodes.value.map((n) => [n.id, n]))
  const edgeTargets = new Map<string, string[]>()

  for (const e of flowEdges.value) {
    const targets = edgeTargets.get(e.source) || []
    targets.push(e.target)
    edgeTargets.set(e.source, targets)
  }

  // Find root: node with no incoming edges
  const hasIncoming = new Set(flowEdges.value.map((e) => e.target))
  let rootId = flowNodes.value.find((n) => !hasIncoming.has(n.id))?.id

  if (!rootId && flowNodes.value.length > 0) {
    rootId = flowNodes.value[0].id
  }
  if (!rootId) return []

  const path = [rootId]
  const visited = new Set([rootId])

  let current = rootId
  let children = edgeTargets.get(current) || []
  while (children.length > 0) {
    let maxChild: string | null = null
    let maxPercent = -1

    for (const childId of children) {
      if (visited.has(childId)) continue
      const child = nodeMap.get(childId)
      const p = child?.data?.metrics?.percents || 0
      if (p > maxPercent) {
        maxPercent = p
        maxChild = childId
      }
    }

    if (!maxChild) break
    visited.add(maxChild)
    path.push(maxChild)
    current = maxChild
    children = edgeTargets.get(current) || []
  }

  return path
}

function highlightHottestPath() {
  const path = findHottestPath()
  if (path.length === 0) return

  const pathSet = new Set(path)
  const lastNodeId = path[path.length - 1]

  selectedNodeId.value = lastNodeId
  highlightedNodeIds.value = pathSet
  highlightedEdgeIds.value = findEdgesForPath(pathSet)

  updateStyles()
  emit('path-selected', buildPathSteps(path))
}

// --- Search: find node by name substring and zoom to it ---

function searchAndZoom(query: string) {
  if (!query.trim()) {
    clearSelection()
    return
  }

  const q = query.toLowerCase()
  const found = flowNodes.value.find((n) => n.data?.name?.toLowerCase().includes(q))

  if (!found) return

  selectNode(found.id)

  const node = getNode(found.id)
  if (node) {
    setCenter(
      node.position.x + (node.dimensions?.width || 180) / 2,
      node.position.y + (node.dimensions?.height || 50) / 2,
      { zoom: 1.2, duration: 500 }
    )
  }
}

function getSearchSuggestions(
  query: string
): Array<{ id: string; name: string; percents: number }> {
  if (!query.trim()) return []
  const q = query.toLowerCase()
  return flowNodes.value
    .filter((n) => n.data?.name?.toLowerCase().includes(q))
    .map((n) => ({
      id: n.id,
      name: n.data?.name || '',
      percents: n.data?.metrics?.percents || 0
    }))
    .sort((a, b) => b.percents - a.percents)
    .slice(0, 10)
}

// --- Node selection & highlight ---

function findEdgesForPath(pathSet: Set<string>): Set<string> {
  const edgeIds = new Set<string>()
  for (const e of flowEdges.value) {
    if (pathSet.has(e.source) && pathSet.has(e.target)) {
      edgeIds.add(e.id)
    }
  }
  return edgeIds
}

function selectNode(nodeId: string) {
  selectedNodeId.value = nodeId
  const pathIds = getPathToRoot(nodeId)
  const pathSet = new Set(pathIds)
  highlightedNodeIds.value = pathSet
  highlightedEdgeIds.value = findEdgesForPath(pathSet)

  updateStyles()

  const orderedPath = getOrderedPathToRoot(nodeId)
  emit('path-selected', buildPathSteps(orderedPath))
}

function clearSelection() {
  selectedNodeId.value = null
  highlightedNodeIds.value = new Set()
  highlightedEdgeIds.value = new Set()
  updateStyles()
  emit('path-cleared')
}

function onNodeClick({ node }: NodeMouseEvent) {
  if (selectedNodeId.value === node.id) {
    clearSelection()
    return
  }
  selectNode(node.id)
}

function updateStyles() {
  const hasHighlight = highlightedNodeIds.value.size > 0

  flowNodes.value = flowNodes.value.map((n) => ({
    ...n,
    selected: n.id === selectedNodeId.value,
    style: hasHighlight && !highlightedNodeIds.value.has(n.id) ? { opacity: 0.15 } : { opacity: 1 }
  }))

  flowEdges.value = flowEdges.value.map((e) => {
    const isHighlighted = highlightedEdgeIds.value.has(e.id)

    return {
      ...e,
      animated: isHighlighted,
      style: isHighlighted
        ? {
            stroke: '#60a5fa',
            strokeWidth: 4,
            opacity: 1,
            filter: 'drop-shadow(0 0 4px rgba(96, 165, 250, 0.6))'
          }
        : {
            stroke: e.data?.color || '#666',
            strokeWidth: 1,
            opacity: hasHighlight ? 0.08 : 1
          },
      markerEnd: isHighlighted
        ? { type: 'arrowclosed' as const, color: '#60a5fa', width: 5, height: 5 }
        : { type: 'arrowclosed' as const, color: e.data?.color || '#666', width: 5, height: 5 },
      label: isHighlighted ? e.data?.label || '' : e.label,
      labelStyle: isHighlighted
        ? { fill: '#93bbfc', fontWeight: 600, fontSize: '9px', transform: 'translateX(20px)' }
        : { fontSize: '8px', fill: '#999', transform: 'translateX(20px)' },
      labelBgStyle: { fill: 'transparent' },
      labelBgPadding: [4, 2] as [number, number]
    }
  })
}

// --- Tooltip ---

function onNodeMouseEnter({ node, event }: NodeMouseEvent) {
  activeStatBoard.value = {
    title: node.data.name,
    cost: node.data.cost
  }

  const rect = (event.target as HTMLElement).closest('.vue-flow')?.getBoundingClientRect()
  if (!rect) return

  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  const tooltipEl = tooltip.value
  const tw = tooltipEl?.clientWidth || 500
  const th = tooltipEl?.clientHeight || 100

  let left = x + 15
  let top = y + 15
  if (left + tw > rect.width) left = x - tw - 15
  if (top + th > rect.height) top = y - th - 15

  tooltipPosition.value = { top: `${top}px`, left: `${left}px` }
}

function onNodeMouseLeave() {
  activeStatBoard.value = undefined
  tooltipPosition.value = undefined
}

function onPaneClick() {
  clearSelection()
}

// --- Watchers ---

watch(
  () => props.serverData,
  (newData) => {
    const mapped = mapToVueFlow(newData)
    flowNodes.value = mapped.nodes
    flowEdges.value = mapped.edges
    clearSelection()
  },
  { deep: true }
)

const styledHeight = computed(() => `${props.height}px`)

defineExpose({
  highlightHottestPath,
  searchAndZoom,
  getSearchSuggestions,
  clearSelection,
  selectNode
})
</script>

<template>
  <div class="render-graph">
    <VueFlow
      id="call-graph"
      :nodes="flowNodes"
      :edges="flowEdges"
      :default-viewport="{ zoom: 0.8, x: 0, y: 0 }"
      :min-zoom="0.1"
      :max-zoom="2"
      fit-view-on-init
      :style="{ height: styledHeight }"
      @node-click="onNodeClick"
      @node-mouse-enter="onNodeMouseEnter"
      @node-mouse-leave="onNodeMouseLeave"
      @pane-click="onPaneClick"
    >
      <template #node-callGraphNode="nodeProps">
        <CallGraphNodeComponent
          :data="nodeProps.data"
          :selected="nodeProps.selected"
        />
      </template>
    </VueFlow>

    <div
      ref="tooltip"
      class="render-graph__tooltip"
      :class="{ 'render-graph__tooltip--active': activeStatBoard }"
      :style="tooltipPosition"
    >
      <div v-if="activeStatBoard">
        <slot :data="activeStatBoard">
          <h4 class="render-graph__tooltip-title">
            {{ activeStatBoard.title }}
          </h4>
        </slot>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.render-graph {
  @apply w-full h-full relative min-h-[500px];
}

.render-graph__tooltip {
  @apply bg-gray-800 absolute z-50 opacity-0 flex w-[500px] pointer-events-none transition-opacity duration-150;
}

.render-graph__tooltip--active {
  @apply opacity-100;
}

.render-graph__tooltip-title {
  @apply px-4 py-2 font-bold text-gray-300;
}
</style>
