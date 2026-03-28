<script lang="ts" setup>
import { ref, computed, onMounted, watchEffect } from 'vue'
import { useFormats } from '@/shared/lib/formats'
import { type EventId, GraphTypes } from '@/shared/types'
import { IconSvg } from '@/shared/ui'
import { useProfiler } from '../../lib'
import type { ProfilerCallGraph, StatBoardCost } from '../../types'
import { CallStatBoard } from '../call-stat-board'
import { RenderGraph } from '../render-graph'
import type { PathStep } from '../render-graph/render-graph.vue'

type Props = {
  id: EventId
}

const { getCallGraph } = useProfiler()
const { formatDuration, formatFileSize } = useFormats()

const props = defineProps<Props>()
const isFullscreen = ref(false)
const metric = ref(GraphTypes.WALL_TIME as GraphTypes)
const threshold = ref(1)
const percent = ref(10)

const isReadyGraph = ref(false)
const container = ref<HTMLElement>()

const serverData = ref<ProfilerCallGraph | undefined>()
const toolbar = ref<ProfilerCallGraph['toolbar']>([])

const graphKey = ref('')

// Search
const searchQuery = ref('')
const searchOpen = ref(false)
const searchSuggestions = ref<Array<{ id: string; name: string; percents: number }>>([])

// Sidebar
const selectedPath = ref<PathStep[]>([])
const sidebarOpen = ref(false)

// Graph ref
const graphRef = ref<InstanceType<typeof RenderGraph>>()

const setMetric = (value: string) => {
  if (Object.values(GraphTypes).includes(value as GraphTypes)) {
    metric.value = value as GraphTypes
  } else {
    metric.value = GraphTypes.WALL_TIME
  }
}

const setThreshold = (event: Event) => {
  threshold.value = Number((event.target as HTMLInputElement).value || 0)
}

const setMinPercent = (event: Event) => {
  percent.value = Number((event.target as HTMLInputElement).value || 0)
}

const toggleFullScreen = () => {
  isFullscreen.value = !isFullscreen.value
}

const graphHeight = computed(() =>
  isFullscreen.value ? window.innerHeight : (container.value as HTMLElement).offsetHeight
)

watchEffect(async () => {
  const data = await getCallGraph(props.id, {
    threshold: String(threshold.value),
    percentage: String(percent.value),
    metric: String(metric.value)
  })

  const { toolbar: tools } = data

  serverData.value = data
  toolbar.value = tools
  graphKey.value = `${metric.value}-${threshold.value}-${percent.value}`
})

onMounted(() => {
  isReadyGraph.value = true
})

const percentLabel = computed(() => (metric.value === GraphTypes.CALLS ? 'Min calls' : 'Percent'))

// --- Search ---

function onSearchInput() {
  if (graphRef.value && searchQuery.value.trim()) {
    searchSuggestions.value = graphRef.value.getSearchSuggestions(searchQuery.value)
  } else {
    searchSuggestions.value = []
  }
}

function onSearchSelect(id: string) {
  graphRef.value?.selectNode(id)
  searchSuggestions.value = []
  searchQuery.value = ''
  searchOpen.value = false
}

function onSearchSubmit() {
  if (searchSuggestions.value.length > 0) {
    onSearchSelect(searchSuggestions.value[0].id)
  } else if (searchQuery.value.trim()) {
    graphRef.value?.searchAndZoom(searchQuery.value)
    searchSuggestions.value = []
  }
}

function toggleSearch() {
  searchOpen.value = !searchOpen.value
  if (!searchOpen.value) {
    searchQuery.value = ''
    searchSuggestions.value = []
  }
}

// --- Hottest path ---

function showHottestPath() {
  graphRef.value?.highlightHottestPath()
}

// --- Sidebar ---

function onPathSelected(path: PathStep[]) {
  selectedPath.value = path
  sidebarOpen.value = true
}

function onPathCleared() {
  selectedPath.value = []
  sidebarOpen.value = false
}

function closeSidebar() {
  sidebarOpen.value = false
  graphRef.value?.clearSelection()
}

function formatMetricValue(key: string, value: number): string {
  if (key === 'ct') return String(value)
  if (key === 'mu' || key === 'pmu') return formatFileSize(value, 3) || '0'
  return formatDuration(value) || '0'
}

function getStepDelta(index: number, key: string): string | null {
  if (index === 0) return null
  const current = selectedPath.value[index]?.cost?.[key] || 0
  const prev = selectedPath.value[index - 1]?.cost?.[key] || 0
  const delta = current - prev
  if (delta === 0) return null
  const sign = delta > 0 ? '+' : ''
  return `${sign}${formatMetricValue(key, delta)}`
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
</script>

<template>
  <div
    ref="container"
    class="call-graph"
    :class="{ 'call-graph--fullscreen': isFullscreen }"
  >
    <RenderGraph
      v-if="isReadyGraph && graphKey && serverData"
      ref="graphRef"
      :key="graphKey"
      class="call-graph__graph"
      :class="{ 'call-graph__graph--with-sidebar': sidebarOpen }"
      :server-data="serverData"
      :height="graphHeight"
      @path-selected="onPathSelected"
      @path-cleared="onPathCleared"
    >
      <template #default="{ data }">
        <CallStatBoard
          v-if="data.cost"
          :title="data?.title || ''"
          :cost="data.cost as StatBoardCost"
        />
      </template>
    </RenderGraph>

    <!-- Sidebar: path details -->
    <transition name="sidebar">
      <div
        v-if="sidebarOpen && selectedPath.length"
        class="call-graph__sidebar"
      >
        <div class="call-graph__sidebar-header">
          <h3 class="call-graph__sidebar-title">
            Call Path
          </h3>
          <button
            class="call-graph__sidebar-close"
            @click="closeSidebar"
          >
            &times;
          </button>
        </div>

        <div class="call-graph__sidebar-body">
          <div
            v-for="(step, idx) in selectedPath"
            :key="step.id"
            class="call-graph__path-step"
            :class="{ 'call-graph__path-step--last': idx === selectedPath.length - 1 }"
          >
            <div class="call-graph__path-connector">
              <div
                class="call-graph__path-dot"
                :class="{ 'call-graph__path-dot--hot': step.metrics.percents > 50 }"
              />
              <div
                v-if="idx < selectedPath.length - 1"
                class="call-graph__path-line"
              />
            </div>

            <div class="call-graph__path-info">
              <div class="call-graph__path-name">
                {{ step.name }}
              </div>
              <div class="call-graph__path-metrics">
                <span class="call-graph__path-percent">
                  {{ step.metrics.percents.toFixed(1) }}%
                </span>
                <span class="call-graph__path-cost">
                  {{ formatMetricValue(currentMetricKey, step.cost[currentMetricKey] || 0) }}
                </span>
                <span
                  v-if="getStepDelta(idx, currentMetricKey)"
                  class="call-graph__path-delta"
                >
                  {{ getStepDelta(idx, currentMetricKey) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- Top-left toolbar: fullscreen + metrics + hottest path -->
    <div class="call-graph__toolbar">
      <button
        title="Full screen"
        @click="toggleFullScreen"
      >
        <IconSvg
          name="fullscreen"
          class="call-graph__toolbar-icon"
        />
      </button>

      <button
        v-for="tool in toolbar"
        :key="tool.metric"
        class="call-graph__toolbar-action"
        :class="{
          'call-graph__toolbar-action--active': metric === tool.metric
        }"
        :title="tool.description"
        @click="setMetric(tool.metric)"
      >
        {{ tool.label }}
      </button>

      <span class="call-graph__toolbar-separator" />

      <button
        class="call-graph__toolbar-btn call-graph__toolbar-btn--hot"
        title="Highlight the most expensive call path"
        @click="showHottestPath"
      >
        <IconSvg
          name="bolt"
          class="call-graph__toolbar-icon call-graph__toolbar-icon--hot"
        />
        Hottest path
      </button>

      <button
        class="call-graph__toolbar-btn"
        title="Search function"
        @click="toggleSearch"
      >
        Search
      </button>
    </div>

    <!-- Search dropdown -->
    <div
      v-if="searchOpen"
      class="call-graph__search"
    >
      <input
        v-model="searchQuery"
        class="call-graph__search-input"
        type="text"
        placeholder="Search function name..."
        autofocus
        @input="onSearchInput"
        @keydown.enter="onSearchSubmit"
        @keydown.escape="toggleSearch"
      >
      <div
        v-if="searchSuggestions.length"
        class="call-graph__search-results"
      >
        <button
          v-for="item in searchSuggestions"
          :key="item.id"
          class="call-graph__search-item"
          @click="onSearchSelect(item.id)"
        >
          <span class="call-graph__search-item-name">{{ item.name }}</span>
          <span class="call-graph__search-item-pct">{{ item.percents.toFixed(1) }}%</span>
        </button>
      </div>
    </div>

    <!-- Top-right toolbar: threshold + percent -->
    <div class="call-graph__toolbar call-graph__toolbar--right">
      <label
        v-if="metric !== GraphTypes.CALLS"
        class="call-graph__toolbar-input-wr"
      >
        Threshold

        <input
          class="call-graph__toolbar-input"
          type="number"
          :value="threshold"
          :min="0"
          :max="10"
          :step="0.1"
          @input="setThreshold"
        >
      </label>

      <label class="call-graph__toolbar-input-wr">
        {{ percentLabel }}

        <input
          class="call-graph__toolbar-input"
          type="number"
          :value="percent"
          :min="metric === GraphTypes.CALLS ? 1 : 0"
          :max="metric === GraphTypes.CALLS ? 1000 : 100"
          :step="metric === GraphTypes.CALLS ? 10 : 5"
          @input="setMinPercent"
        >
      </label>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.call-graph {
  @apply relative flex h-full bg-gray-50 dark:bg-gray-900 overflow-hidden;
}

.call-graph__graph {
  @apply w-full h-full flex transition-all duration-300;
}

.call-graph__graph--with-sidebar {
  @apply mr-[320px];
}

.call-graph--fullscreen {
  @apply rounded-none mt-0 top-0 left-0 fixed w-full h-full bg-gray-800 z-[99999];
}

.call-graph__toolbar {
  @apply absolute top-3 left-3 flex items-center backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 p-2 rounded-md gap-x-3 shadow-md border border-gray-200/50 dark:border-gray-600/50 z-10;
}

.call-graph__toolbar--right {
  @apply right-3 left-auto py-1;
}

.call-graph__toolbar-icon {
  @apply w-4 h-4 fill-blue-500;
}

.call-graph__toolbar-icon--hot {
  @apply fill-orange-500;
}

.call-graph__toolbar-action {
  @apply text-xs uppercase text-gray-600 dark:text-gray-300;
}

.call-graph__toolbar-action--active {
  @apply font-bold;
}

.call-graph__toolbar-separator {
  @apply w-px h-5 bg-gray-400;
}

.call-graph__toolbar-btn {
  @apply text-xs uppercase text-gray-600 dark:text-gray-300 flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors;
}

.call-graph__toolbar-btn--hot {
  @apply text-orange-600 dark:text-orange-400 font-semibold;
}

.call-graph__toolbar-input-wr {
  @apply text-xs uppercase text-gray-600 dark:text-gray-300;
}

.call-graph__toolbar-input {
  @apply border-gray-600 text-gray-600 w-10 font-bold text-right bg-gray-300 ml-1 py-1 rounded;
}

/* Search */
.call-graph__search {
  @apply absolute top-14 left-3 z-20 w-80;
}

.call-graph__search-input {
  @apply w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-t shadow-lg outline-none;
  @apply focus:ring-2 focus:ring-blue-400;
}

.call-graph__search-results {
  @apply bg-white dark:bg-gray-700 border border-t-0 border-gray-300 dark:border-gray-600 rounded-b shadow-lg max-h-60 overflow-y-auto;
}

.call-graph__search-item {
  @apply flex justify-between items-center w-full px-3 py-2 text-xs text-left hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors;
}

.call-graph__search-item-name {
  @apply text-gray-800 dark:text-gray-200 truncate mr-2;
}

.call-graph__search-item-pct {
  @apply text-gray-500 dark:text-gray-400 font-mono whitespace-nowrap;
}

/* Sidebar */
.call-graph__sidebar {
  @apply absolute top-0 right-0 w-[320px] h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-xl z-20 flex flex-col;
}

.call-graph__sidebar-header {
  @apply flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700;
}

.call-graph__sidebar-title {
  @apply text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide;
}

.call-graph__sidebar-close {
  @apply text-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 leading-none px-1;
}

.call-graph__sidebar-body {
  @apply flex-1 overflow-y-auto px-4 py-3;
}

.call-graph__path-step {
  @apply flex gap-3 pb-1;
}

.call-graph__path-connector {
  @apply flex flex-col items-center flex-shrink-0 w-4;
}

.call-graph__path-dot {
  @apply w-3 h-3 rounded-full bg-gray-400 border-2 border-gray-300 dark:border-gray-600 flex-shrink-0;
}

.call-graph__path-dot--hot {
  @apply bg-red-500 border-red-300;
}

.call-graph__path-line {
  @apply w-0.5 flex-1 bg-gray-300 dark:bg-gray-600 min-h-[20px];
}

.call-graph__path-info {
  @apply flex-1 pb-4 min-w-0;
}

.call-graph__path-name {
  @apply text-xs font-medium text-gray-800 dark:text-gray-200 break-words leading-tight;
}

.call-graph__path-metrics {
  @apply flex items-center gap-2 mt-1 flex-wrap;
}

.call-graph__path-percent {
  @apply text-[11px] font-bold text-gray-600 dark:text-gray-400;
}

.call-graph__path-cost {
  @apply text-[11px] font-mono text-gray-500 dark:text-gray-400;
}

.call-graph__path-delta {
  @apply text-[10px] font-mono text-red-500 dark:text-red-400;
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
