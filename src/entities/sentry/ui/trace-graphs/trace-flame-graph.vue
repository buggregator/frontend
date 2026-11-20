<script lang="ts" setup>
import { FlameChart } from 'flame-chart-js'
import debounce from 'lodash.debounce'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { serviceColors, toFlameNodes } from '../../lib/trace-graph/trace-graph'
import type { SentrySpan } from '../../types'
import TraceGraphLegend from './trace-graph-legend.vue'
import TraceTimeBreakdown from './trace-time-breakdown.vue'

// Flame graph of one trace (#6533 A): bar = span, width = time, colour = service,
// red badge = error. The side panel says where the time went.

type Props = {
  spans: SentrySpan[]
  selectedSpanId?: string | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'select', spanId: string): void
  (e: 'show-in-waterfall', spanId: string): void
}>()

const colors = computed(() => serviceColors(props.spans))
const flameNodes = computed(() => toFlameNodes(props.spans, colors.value))
const rows = computed(() => {
  let depth = 0
  const walk = (nodes: typeof flameNodes.value, level: number) => {
    depth = Math.max(depth, level)
    nodes.forEach((n) => walk(n.children ?? [], level + 1))
  }
  walk(flameNodes.value, 1)
  return depth
})

const BLOCK_HEIGHT = 22
// Time grid on top, timeframe selector below the blocks.
const chartHeight = computed(() => Math.max(160, rows.value * (BLOCK_HEIGHT + 1) + 110))

const isDark = () => document.documentElement.classList.contains('dark')

const box = ref<HTMLElement>()
const canvas = ref<HTMLCanvasElement>()
let chart: FlameChart | null = null
let onResize: (() => void) | null = null

const destroy = () => {
  if (onResize) window.removeEventListener('resize', onResize)
  onResize = null
  if (chart) {
    chart.interactionsEngine.destroy()
    chart.removeAllListeners()
  }
  chart = null
}

const render = () => {
  if (!box.value || !canvas.value) return
  destroy()
  const { width } = box.value.getBoundingClientRect()
  canvas.value.width = Math.max(1, width)
  canvas.value.height = chartHeight.value
  const dark = isDark()
  chart = new FlameChart({
    canvas: canvas.value,
    data: flameNodes.value,
    settings: {
      styles: {
        main: {
          blockHeight: BLOCK_HEIGHT,
          blockPaddingLeftRight: 6,
          backgroundColor: dark ? '#1f2937' : '#ffffff',
          font: '11px ui-monospace, SFMono-Regular, Menlo, monospace',
          // Bars use light service colours: dark text reads on all of them.
          fontColor: '#111827',
          headerHeight: 0
        },
        timeGridPlugin: { fontColor: dark ? '#9ca3af' : '#4b5563' },
        timeframeSelectorPlugin: {
          backgroundColor: dark ? '#111827' : '#f3f4f6',
          fontColor: dark ? '#e5e7eb' : '#374151',
          graphStrokeColor: dark ? '#60a5fa' : '#3b82f6',
          graphFillColor: dark ? 'rgba(96,165,250,0.15)' : 'rgba(59,130,246,0.15)',
          bottomLineColor: dark ? '#374151' : '#d1d5db',
          knobColor: dark ? '#60a5fa' : '#3b82f6',
          knobStrokeColor: dark ? '#93c5fd' : '#2563eb',
          overlayColor: dark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.2)'
        }
      },
      options: { timeUnits: 'ms' }
    }
  })
  chart.on('select', (data: unknown) => {
    const d = data as { node?: { source?: { type?: string } } } | null
    const id = d?.node?.source?.type
    if (id) emit('select', id)
  })
  onResize = debounce(() => {
    if (box.value && chart) chart.resize(box.value.getBoundingClientRect().width, chartHeight.value)
  }, 30)
  window.addEventListener('resize', onResize)
}

// Browser only: the canvas is drawn after mount.
onMounted(() => nextTick(render))
watch(flameNodes, () => nextTick(render))
onBeforeUnmount(destroy)
</script>

<template>
  <div class="trace-flame">
    <section
      class="trace-flame__chart-card"
      aria-label="Flame graph"
    >
      <header class="trace-flame__head">
        <span class="trace-flame__title">Flame graph</span>
        <span class="trace-flame__hint">width = time · colour = service · red mark = error</span>
      </header>
      <div
        ref="box"
        class="trace-flame__canvas-box"
        :style="{ height: `${chartHeight}px` }"
      >
        <canvas
          ref="canvas"
          role="img"
          :aria-label="`Flame graph of ${spans.length} spans. Use the list «Where the time went» to pick a span with the keyboard.`"
        />
      </div>
      <TraceGraphLegend
        :spans="spans"
        :colors="colors"
      />
    </section>

    <TraceTimeBreakdown
      class="trace-flame__side"
      :spans="spans"
      :colors="colors"
      :selected-span-id="selectedSpanId"
      @select="emit('select', $event)"
      @show-in-waterfall="emit('show-in-waterfall', $event)"
    />
  </div>
</template>

<style lang="scss" scoped>
.trace-flame {
  @apply grid gap-4 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_18rem] items-start;
}

.trace-flame__chart-card {
  @apply min-w-0 rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden;
  @apply bg-white dark:bg-gray-800;
}

.trace-flame__head {
  @apply flex flex-wrap items-baseline gap-2 px-3 py-2 border-b border-gray-200 dark:border-gray-700;
}

.trace-flame__title {
  @apply text-xs font-semibold text-gray-900 dark:text-gray-100;
}

.trace-flame__hint {
  @apply text-2xs text-gray-600 dark:text-gray-400;
}

.trace-flame__canvas-box {
  @apply w-full;

  canvas {
    @apply block;
  }
}
</style>
