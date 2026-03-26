<script lang="ts" setup>
import { FlameChart } from 'flame-chart-js'
import debounce from 'lodash.debounce'
import { ref, onMounted, nextTick, onBeforeUnmount, computed, watch } from 'vue'
import { useFormats } from '@/shared/lib/formats'
import { type EventId, GraphTypes } from '@/shared/types'
import { useProfiler } from '../../lib'
import type { CallStackHoverData, ProfileFlameChart, StatBoardCost } from '../../types'
import { CallStatBoard } from '../../ui/call-stat-board'

type Props = {
  id: EventId
}

type SandwichEntry = {
  name: string
  totalCost: Record<string, number>
  count: number
}

const { getFlameChart } = useProfiler()
const { formatDuration, formatFileSize } = useFormats()

const isDark = () => document.documentElement.classList.contains('dark')
const defaultPosition = { x: 0, y: 0 }

const props = defineProps<Props>()

const metric = ref<GraphTypes>(GraphTypes.WALL_TIME)
const canvas = ref<HTMLCanvasElement>()
const graph = ref<HTMLElement>()
let flameChartInstance: FlameChart | null = null
let resizeHandler: (() => void) | null = null
let flameData: ProfileFlameChart[] = []

const toolbar = [
  { label: 'Wall time', metric: GraphTypes.WALL_TIME, description: 'Wall time in ms.' },
  { label: 'CPU', metric: GraphTypes.CPU, description: 'CPU time in ms.' },
  { label: 'Memory', metric: GraphTypes.MEMORY, description: 'Memory usage in bytes.' },
  {
    label: 'Memory peak',
    metric: GraphTypes.MEMORY_CHANGE,
    description: 'Memory peak usage in bytes.'
  }
]

// --- Tooltip ---
const activeStatBoard = ref<CallStackHoverData>()
const activeStatBoardPosition = ref(defaultPosition)

const activeStatBoardStyle = computed(() => {
  const width = 750
  const height = 150

  let top = activeStatBoardPosition.value.y
  let left = activeStatBoardPosition.value.x

  if (width + activeStatBoardPosition.value.x > window.innerWidth - 80) {
    const deltaX = width + activeStatBoardPosition.value.x - window.innerWidth + 100
    left -= deltaX
  }

  if (height + activeStatBoardPosition.value.y > window.innerHeight) {
    top = activeStatBoardPosition.value.y - height
  }

  return {
    top: `${top + 10}px`,
    left: `${left}px`,
    width: `${width}px`
  }
})

// --- Search ---
const searchQuery = ref('')
const searchResults = ref<Array<{ name: string; count: number }>>([])
const searchFocused = ref(false)

function collectFunctionNames(nodes: ProfileFlameChart[]): Map<string, number> {
  const names = new Map<string, number>()

  function walk(node: ProfileFlameChart) {
    const count = names.get(node.name) || 0
    names.set(node.name, count + 1)
    for (const child of node.children || []) {
      walk(child)
    }
  }

  for (const root of nodes) {
    walk(root)
  }
  return names
}

function onSearchInput() {
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    return
  }

  const q = searchQuery.value.toLowerCase()
  const names = collectFunctionNames(flameData)
  searchResults.value = Array.from(names.entries())
    .filter(([name]) => name.toLowerCase().includes(q))
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15)
}

function onSearchSelect(name: string) {
  searchQuery.value = ''
  searchResults.value = []
  searchFocused.value = false
  openSandwich(name)
}

function onSearchSubmit() {
  if (searchResults.value.length > 0) {
    onSearchSelect(searchResults.value[0].name)
  }
}

function onSearchBlur() {
  setTimeout(() => {
    searchFocused.value = false
    searchResults.value = []
  }, 200)
}

// --- Sandwich view ---
const sandwichOpen = ref(false)
const sandwichCallers = ref<SandwichEntry[]>([])
const sandwichCallees = ref<SandwichEntry[]>([])
const sandwichSelf = ref<SandwichEntry | null>(null)

function buildSandwich(
  nodes: ProfileFlameChart[],
  targetName: string
): { callers: SandwichEntry[]; callees: SandwichEntry[]; self: SandwichEntry } {
  const callersMap = new Map<string, { cost: Record<string, number>; count: number }>()
  const calleesMap = new Map<string, { cost: Record<string, number>; count: number }>()
  const selfCost: Record<string, number> = {}
  let selfCount = 0

  function walk(node: ProfileFlameChart, parent: ProfileFlameChart | null) {
    if (node.name === targetName) {
      selfCount++
      for (const [k, v] of Object.entries(node.cost || {})) {
        selfCost[k] = (selfCost[k] || 0) + (v as number)
      }

      if (parent) {
        const existing = callersMap.get(parent.name)
        if (existing) {
          existing.count++
          for (const [k, v] of Object.entries(parent.cost || {})) {
            existing.cost[k] = (existing.cost[k] || 0) + (v as number)
          }
        } else {
          callersMap.set(parent.name, {
            cost: { ...(parent.cost || {}) } as Record<string, number>,
            count: 1
          })
        }
      }

      for (const child of node.children || []) {
        const existing = calleesMap.get(child.name)
        if (existing) {
          existing.count++
          for (const [k, v] of Object.entries(child.cost || {})) {
            existing.cost[k] = (existing.cost[k] || 0) + (v as number)
          }
        } else {
          calleesMap.set(child.name, {
            cost: { ...(child.cost || {}) } as Record<string, number>,
            count: 1
          })
        }
      }
    }

    for (const child of node.children || []) {
      walk(child, node)
    }
  }

  for (const root of nodes) {
    walk(root, null)
  }

  const toEntries = (
    map: Map<string, { cost: Record<string, number>; count: number }>
  ): SandwichEntry[] =>
    Array.from(map.entries())
      .map(([name, { cost, count }]) => ({ name, totalCost: cost, count }))
      .sort((a, b) => (b.totalCost.wt || 0) - (a.totalCost.wt || 0))

  return {
    callers: toEntries(callersMap),
    callees: toEntries(calleesMap),
    self: { name: targetName, totalCost: selfCost, count: selfCount }
  }
}

function openSandwich(name: string) {
  const result = buildSandwich(flameData, name)
  sandwichCallers.value = result.callers
  sandwichCallees.value = result.callees
  sandwichSelf.value = result.self
  sandwichOpen.value = true
}

function closeSandwich() {
  sandwichOpen.value = false
  sandwichCallers.value = []
  sandwichCallees.value = []
  sandwichSelf.value = null
}

function formatCostValue(key: string, value: number): string {
  if (key === 'ct') return String(value)
  if (key === 'mu' || key === 'pmu') return formatFileSize(value, 3) || '0'
  return formatDuration(value) || '0'
}

const currentMetricKey = computed(() => {
  const map: Record<string, string> = {
    [GraphTypes.CPU]: 'cpu',
    [GraphTypes.WALL_TIME]: 'wt',
    [GraphTypes.MEMORY]: 'mu',
    [GraphTypes.MEMORY_CHANGE]: 'pmu',
    [GraphTypes.CALLS]: 'ct'
  }
  return map[metric.value] || 'wt'
})

// --- Chart rendering ---

const destroyChart = () => {
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler)
    resizeHandler = null
  }
  if (flameChartInstance) {
    flameChartInstance.interactionsEngine.destroy()
    flameChartInstance.removeAllListeners()
    flameChartInstance = null
  }
}

const renderChart = async () => {
  if (!graph.value || !canvas.value) {
    return
  }

  destroyChart()

  const { width, height } = graph.value.getBoundingClientRect()

  canvas.value.width = width || 1
  canvas.value.height = height || 1

  const ctx = canvas.value.getContext('2d')
  if (ctx) {
    ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)
  }

  flameData = await getFlameChart(props.id, { metric: metric.value })

  flameChartInstance = new FlameChart({
    canvas: canvas.value,
    data: flameData,
    settings: {
      styles: {
        main: {
          blockHeight: 20,
          blockPaddingLeftRight: 4,
          backgroundColor: isDark() ? '#1f2937' : '#f9fafb',
          headerHeight: 0
        },
        timeGridPlugin: {
          fontColor: isDark() ? '#9ca3af' : '#6b7280'
        },
        timeframeSelectorPlugin: {
          backgroundColor: isDark() ? '#111827' : '#f3f4f6',
          fontColor: isDark() ? '#e5e7eb' : '#374151',
          graphStrokeColor: isDark() ? '#60a5fa' : '#93c5fd',
          graphFillColor: isDark() ? 'rgba(96,165,250,0.15)' : 'rgba(147,197,253,0.25)',
          bottomLineColor: isDark() ? '#374151' : '#d1d5db',
          knobColor: isDark() ? '#60a5fa' : '#3b82f6',
          knobStrokeColor: isDark() ? '#93c5fd' : '#2563eb',
          overlayColor: isDark() ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.2)'
        }
      },
      options: {
        tooltip: (data, _, mouse) => {
          if (data === null) {
            activeStatBoard.value = undefined
          } else {
            activeStatBoard.value = {
              cost: data.data.source.cost,
              title: data.data.source.name
            }
            activeStatBoardPosition.value = {
              x: mouse?.x ? mouse.x + 20 : 0,
              y: mouse?.y ? mouse.y - 20 : 0
            }
          }
        }
      }
    }
  })

  flameChartInstance.render()

  flameChartInstance.on('select', (data: unknown) => {
    const d = data as { type?: string; node?: { source?: { name?: string } } } | null
    if (d?.node?.source?.name) {
      openSandwich(d.node.source.name)
    }
  })

  resizeHandler = debounce(() => {
    if (!graph.value || !flameChartInstance) {
      return
    }
    const { width: w, height: h } = graph.value.getBoundingClientRect()
    flameChartInstance.resize(w, h)
  }, 30)

  window.addEventListener('resize', resizeHandler)
}

watch(metric, () => {
  renderChart()
})

onMounted(() => {
  nextTick(() => {
    renderChart()
  })
})

onBeforeUnmount(() => {
  destroyChart()
  activeStatBoard.value = undefined
})
</script>

<template>
  <div class="flame-wrapper">
    <!-- Toolbar (above canvas) -->
    <div class="flame-toolbar">
      <button
        v-for="tool in toolbar"
        :key="tool.metric"
        class="flame-toolbar__action"
        :class="{ 'flame-toolbar__action--active': metric === tool.metric }"
        :title="tool.description"
        @click="metric = tool.metric"
      >
        {{ tool.label }}
      </button>

      <span class="flame-toolbar__separator" />

      <!-- Inline search -->
      <div class="flame-toolbar__search-wrap">
        <input
          v-model="searchQuery"
          class="flame-toolbar__search"
          type="text"
          placeholder="Search function..."
          @input="onSearchInput"
          @keydown.enter="onSearchSubmit"
          @focus="searchFocused = true"
          @blur="onSearchBlur"
        >
        <div
          v-if="searchFocused && searchResults.length"
          class="flame-toolbar__search-dropdown"
        >
          <button
            v-for="item in searchResults"
            :key="item.name"
            class="flame-toolbar__search-item"
            @mousedown.prevent="onSearchSelect(item.name)"
          >
            <span class="flame-toolbar__search-item-name">{{ item.name }}</span>
            <span class="flame-toolbar__search-item-count">{{ item.count }}x</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Canvas + sidebar -->
    <div class="flame-content">
      <div
        ref="graph"
        class="flame-canvas-wrap"
      >
        <canvas
          ref="canvas"
          class="flame-canvas"
        />
      </div>

      <!-- Sandwich sidebar -->
      <transition name="sidebar">
        <div
          v-if="sandwichOpen && sandwichSelf"
          class="flame-sidebar"
        >
          <div class="flame-sidebar__header">
            <h3 class="flame-sidebar__title">
              Sandwich View
            </h3>
            <button
              class="flame-sidebar__close"
              @click="closeSandwich"
            >
              &times;
            </button>
          </div>

          <div class="flame-sidebar__body">
            <!-- Self -->
            <div class="flame-sandwich__section">
              <div class="flame-sandwich__self">
                <div class="flame-sandwich__fn-name">
                  {{ sandwichSelf.name }}
                </div>
                <div class="flame-sandwich__fn-meta">
                  <span class="flame-sandwich__fn-cost">
                    {{
                      formatCostValue(
                        currentMetricKey,
                        sandwichSelf.totalCost[currentMetricKey] || 0
                      )
                    }}
                  </span>
                  <span class="flame-sandwich__fn-count"> {{ sandwichSelf.count }}x calls </span>
                </div>
              </div>
            </div>

            <!-- Callers -->
            <div
              v-if="sandwichCallers.length"
              class="flame-sandwich__section"
            >
              <h4 class="flame-sandwich__label">
                Called by
              </h4>
              <div
                v-for="entry in sandwichCallers"
                :key="'caller-' + entry.name"
                class="flame-sandwich__entry"
                @click="openSandwich(entry.name)"
              >
                <div class="flame-sandwich__entry-name">
                  {{ entry.name }}
                </div>
                <div class="flame-sandwich__entry-meta">
                  <span>{{
                    formatCostValue(currentMetricKey, entry.totalCost[currentMetricKey] || 0)
                  }}</span>
                  <span class="flame-sandwich__entry-count">{{ entry.count }}x</span>
                </div>
              </div>
            </div>

            <!-- Callees -->
            <div
              v-if="sandwichCallees.length"
              class="flame-sandwich__section"
            >
              <h4 class="flame-sandwich__label">
                Calls
              </h4>
              <div
                v-for="entry in sandwichCallees"
                :key="'callee-' + entry.name"
                class="flame-sandwich__entry"
                @click="openSandwich(entry.name)"
              >
                <div class="flame-sandwich__entry-name">
                  {{ entry.name }}
                </div>
                <div class="flame-sandwich__entry-meta">
                  <span>{{
                    formatCostValue(currentMetricKey, entry.totalCost[currentMetricKey] || 0)
                  }}</span>
                  <span class="flame-sandwich__entry-count">{{ entry.count }}x</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </div>

    <!-- Tooltip -->
    <CallStatBoard
      v-if="activeStatBoard?.cost"
      class="flame-tooltip"
      :title="activeStatBoard.title || ''"
      :cost="activeStatBoard.cost as StatBoardCost"
      :style="activeStatBoardStyle"
    />
  </div>
</template>

<style lang="scss" scoped>
.flame-wrapper {
  @apply relative flex flex-col h-full bg-gray-50 dark:bg-gray-800 overflow-hidden;
}

/* Toolbar (in flow, above canvas) */
.flame-toolbar {
  @apply flex items-center backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 px-3 py-2 gap-x-3 flex-shrink-0 border-b border-gray-200/50 dark:border-gray-600/50;
}

/* Content: canvas + sidebar */
.flame-content {
  @apply flex flex-1 min-h-0 relative;
}

.flame-canvas-wrap {
  @apply flex-1 overflow-hidden;
}

.flame-canvas {
  @apply w-full h-full;
}

.flame-toolbar__action {
  @apply text-xs uppercase text-gray-600 dark:text-gray-300 cursor-pointer px-2 py-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors whitespace-nowrap;
}

.flame-toolbar__action--active {
  @apply font-bold;
}

.flame-toolbar__separator {
  @apply w-px h-5 bg-gray-400 flex-shrink-0;
}

.flame-toolbar__search-wrap {
  @apply relative min-w-[180px] max-w-[280px];
}

.flame-toolbar__search {
  @apply w-full px-3 py-1 text-xs bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-500 rounded outline-none;
  @apply focus:ring-1 focus:ring-blue-400 focus:border-blue-400;
}

.flame-toolbar__search-dropdown {
  @apply absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded shadow-lg max-h-60 overflow-y-auto z-30;
}

.flame-toolbar__search-item {
  @apply flex justify-between items-center w-full px-3 py-2 text-xs text-left hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors;
}

.flame-toolbar__search-item-name {
  @apply text-gray-800 dark:text-gray-200 truncate mr-2;
}

.flame-toolbar__search-item-count {
  @apply text-gray-500 dark:text-gray-400 font-mono whitespace-nowrap;
}

/* Tooltip */
.flame-tooltip {
  @apply absolute z-10 h-auto pointer-events-none;
}

/* Sidebar */
.flame-sidebar {
  @apply w-[320px] flex-shrink-0 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-xl flex flex-col overflow-hidden;
}

.flame-sidebar__header {
  @apply flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0;
}

.flame-sidebar__title {
  @apply text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide;
}

.flame-sidebar__close {
  @apply text-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 leading-none px-1;
}

.flame-sidebar__body {
  @apply flex-1 overflow-y-auto;
}

/* Sandwich */
.flame-sandwich__section {
  @apply border-b border-gray-200 dark:border-gray-700 px-4 py-3;
}

.flame-sandwich__self {
  @apply bg-blue-50 dark:bg-blue-900/30 rounded p-3;
}

.flame-sandwich__fn-name {
  @apply text-xs font-semibold text-gray-800 dark:text-gray-200 break-words leading-tight;
}

.flame-sandwich__fn-meta {
  @apply flex items-center gap-3 mt-2;
}

.flame-sandwich__fn-cost {
  @apply text-sm font-bold text-gray-700 dark:text-gray-300 font-mono;
}

.flame-sandwich__fn-count {
  @apply text-xs text-gray-500 dark:text-gray-400;
}

.flame-sandwich__label {
  @apply text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2;
}

.flame-sandwich__entry {
  @apply py-2 px-2 -mx-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors;
}

.flame-sandwich__entry-name {
  @apply text-xs text-gray-700 dark:text-gray-300 break-words leading-tight;
}

.flame-sandwich__entry-meta {
  @apply flex items-center gap-2 mt-1 text-[11px] font-mono text-gray-500 dark:text-gray-400;
}

.flame-sandwich__entry-count {
  @apply text-[10px] text-gray-400;
}

/* Transitions */
.sidebar-enter-active,
.sidebar-leave-active {
  transition:
    transform 0.25s ease,
    opacity 0.25s ease;
}

.sidebar-enter-from,
.sidebar-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
