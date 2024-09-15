<script lang="ts" setup>
import { FlameChart } from 'flame-chart-js'
import debounce from 'lodash.debounce'
import { ref, onMounted, nextTick, onBeforeUnmount } from 'vue'
import type { EventId } from '@/shared/types'
import { useProfiler } from '../../lib'
import type { CallStackHoverData } from '../../types'

type Props = {
  id: EventId
}

type Emits = {
  hover: [value: CallStackHoverData]
  hide: []
}

const { getFlameChart } = useProfiler()

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const canvas = ref<HTMLCanvasElement>()
const graph = ref<HTMLCanvasElement>()

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
            emit('hide')
          } else {
            emit('hover', {
              id: data.data.id,
              parent: data.data.parent,
              callee: data.data.source.name,
              caller: '',
              cost: data.data.source.cost,
              position: {
                x: mouse?.x ? mouse.x + 20 : 0,
                y: mouse?.y ? mouse.y - 20 : 0
              }
            })
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
  emit('hide')
})
</script>

<template>
  <div class="graph-wrapper">
    <div ref="graph" class="flame-graph">
      <canvas ref="canvas" class="flame-graph__canvas" />
    </div>
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
</style>
