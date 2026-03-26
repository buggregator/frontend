<script lang="ts" setup>
import { FlameChart } from 'flame-chart-js'
import debounce from 'lodash.debounce'
import { ref, onMounted, nextTick, onBeforeUnmount, computed, watch } from 'vue'
import { type EventId, GraphTypes } from '@/shared/types'
import { useProfiler } from '../../lib'
import type { CallStackHoverData, StatBoardCost } from '../../types'
import { CallStatBoard } from '../../ui/call-stat-board'

type Props = {
  id: EventId
}

const { getFlameChart } = useProfiler()

const defaultPosition = { x: 0, y: 0 }

const props = defineProps<Props>()

const metric = ref<GraphTypes>(GraphTypes.WALL_TIME)
const canvas = ref<HTMLCanvasElement>()
const graph = ref<HTMLCanvasElement>()
let flameChartInstance: FlameChart | null = null
let resizeHandler: (() => void) | null = null

const toolbar = [
  { label: 'Wall time', metric: GraphTypes.WALL_TIME, description: 'Wall time in ms.' },
  { label: 'CPU', metric: GraphTypes.CPU, description: 'CPU time in ms.' },
  { label: 'Memory', metric: GraphTypes.MEMORY, description: 'Memory usage in bytes.' },
  { label: 'Memory peak', metric: GraphTypes.MEMORY_CHANGE, description: 'Memory peak usage in bytes.' },
]

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

const destroyChart = () => {
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler)
    resizeHandler = null
  }
  flameChartInstance = null
}

const renderChart = async () => {
  if (!graph.value || !canvas.value) {
    return
  }

  destroyChart()

  const { width, height } = graph.value.getBoundingClientRect()

  canvas.value.width = width || 1
  canvas.value.height = height || 1

  flameChartInstance = new FlameChart({
    canvas: canvas.value,
    data: await getFlameChart(props.id, { metric: metric.value }),
    settings: {
      styles: {
        main: {
          blockHeight: 20
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

  resizeHandler = debounce(() => {
    if (!graph.value || !flameChartInstance) {
      return
    }

    const { width: windowWidth, height: windowHeight } = graph.value.getBoundingClientRect()

    flameChartInstance.resize(windowWidth, windowHeight)
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
  <div class="graph-wrapper">
    <div class="flame-graph__toolbar">
      <button
        v-for="tool in toolbar"
        :key="tool.metric"
        class="flame-graph__toolbar-action"
        :class="{
          'flame-graph__toolbar-action--active': metric === tool.metric
        }"
        :title="tool.description"
        @click="metric = tool.metric"
      >
        {{ tool.label }}
      </button>
    </div>

    <div
      ref="graph"
      class="flame-graph"
    >
      <canvas
        ref="canvas"
        class="flame-graph__canvas"
      />
    </div>

    <CallStatBoard
      v-if="activeStatBoard?.cost"
      class="profiler-page__hover-edge"
      :title="activeStatBoard.title || ''"
      :cost="activeStatBoard.cost as StatBoardCost"
      :style="activeStatBoardStyle"
    />
  </div>
</template>

<style lang="scss" scoped>
.graph-wrapper {
  @apply mb-5;
}

.flame-graph {
  @apply w-full h-full relative min-h-[500px];
  @apply bg-white;
  @apply rounded-md mt-2 overflow-hidden;
}

.flame-graph__canvas {
  @apply w-full h-full bg-white pt-3;
}

.profiler-page__hover-edge {
  @apply absolute z-10 h-auto;
}

.flame-graph__toolbar {
  @apply flex bg-gray-200 p-2 rounded gap-x-5 shadow-lg mb-2;
}

.flame-graph__toolbar-action {
  @apply text-xs uppercase text-gray-600 cursor-pointer;
}

.flame-graph__toolbar-action--active {
  @apply font-bold;
}
</style>
