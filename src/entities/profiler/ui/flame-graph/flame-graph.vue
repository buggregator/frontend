<script lang="ts" setup>
import { FlameChart } from 'flame-chart-js'
import debounce from 'lodash.debounce'
import { ref, onMounted, nextTick, onBeforeUnmount, computed } from 'vue'
import type { EventId } from '@/shared/types'
import type { StatBoardCost } from '@/shared/ui'
import { useProfiler } from '../../lib'
import type { CallStackHoverData } from '../../types'
import { CallStatBoard } from '../../ui/call-stat-board'

type Props = {
  id: EventId
}

const { getFlameChart } = useProfiler()

const defaultPosition = { x: 0, y: 0 }

const props = defineProps<Props>()

const canvas = ref<HTMLCanvasElement>()
const graph = ref<HTMLCanvasElement>()

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

const renderChart = async () => {
  if (!graph.value || !canvas.value) {
    return
  }

  const { width, height } = graph.value.getBoundingClientRect()

  canvas.value.width = width || 1
  canvas.value.height = height || 1

  const flameChart = new FlameChart({
    canvas: canvas.value,
    // TODO: move to api service
    data: await getFlameChart(props.id),
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

  flameChart.render()

  window.addEventListener(
    'resize',
    debounce(() => {
      if (!graph.value) {
        return
      }

      const { width: windowWidth, height: windowHeight } = graph.value.getBoundingClientRect()

      flameChart.resize(windowWidth, windowHeight)
    }, 30)
  )
}

onMounted(() => {
  nextTick(() => {
    renderChart()
  })
})

onBeforeUnmount(() => {
  activeStatBoard.value = undefined
})
</script>

<template>
  <div class="graph-wrapper">
    <div ref="graph" class="flame-graph">
      <canvas ref="canvas" class="flame-graph__canvas" />
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
</style>
