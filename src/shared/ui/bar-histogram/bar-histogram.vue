<script lang="ts" setup>
import { computed } from 'vue'
import { bucketTotal, type BarBucket, type BarSeries } from './fill-buckets'

// Counts over time as stacked bars (plain SVG): lines per minute on the Logs
// page, jobs per minute on a queue. The bars come in time order, empty ones
// included (see fillBuckets); each series is a colour, stacked from the
// bottom in the order given, with a legend.

type Props = {
  bars: BarBucket[]
  series: BarSeries[]
  // What the chart counts, for screen readers: «Log lines per minute».
  label: string
  // The last tick reads this instead of a time (the window ends now).
  endLabel?: string
}

const props = withDefaults(defineProps<Props>(), { endLabel: '' })

const BAR = 10
const GAP = 2
const HEIGHT = 40

const max = computed(() => Math.max(1, ...props.bars.map(bucketTotal)))
const width = computed(() => Math.max(1, props.bars.length) * BAR)

const pad = (n: number) => String(n).padStart(2, '0')
const clock = (t: number) => {
  const d = new Date(t * 1000)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

type Rect = { key: string; tone: BarSeries['tone']; y: number; h: number }
const columns = computed(() =>
  props.bars.map((bar, i) => {
    let top = HEIGHT
    const rects: Rect[] = []
    for (const s of props.series) {
      const n = bar.values[s.key] ?? 0
      if (!n) continue
      // At least a pixel: a single error in a busy minute stays visible.
      const h = Math.max(1, (n / max.value) * HEIGHT)
      top -= h
      rects.push({ key: s.key, tone: s.tone, y: top, h })
    }
    const parts = props.series
      .filter((s) => bar.values[s.key])
      .map((s) => `${bar.values[s.key]} ${s.label}`)
    const total = bucketTotal(bar)
    return {
      t: bar.t,
      x: i * BAR,
      rects,
      title: `${clock(bar.t)} · ${total}${parts.length ? ` (${parts.join(', ')})` : ''}`
    }
  })
)

const ticks = computed(() => {
  const bars = props.bars
  if (!bars.length) return []
  const last = bars.length - 1
  const mid = Math.floor(last / 2)
  const list = [{ at: 0, text: clock(bars[0].t) }]
  if (mid > 0 && mid < last) list.push({ at: mid / last, text: clock(bars[mid].t) })
  if (last > 0) list.push({ at: 1, text: props.endLabel || clock(bars[last].t) })
  return list
})

const summary = computed(() => {
  const totals = props.series.map((s) => ({
    label: s.label,
    n: props.bars.reduce((sum, b) => sum + (b.values[s.key] ?? 0), 0)
  }))
  const all = totals.reduce((sum, x) => sum + x.n, 0)
  const parts = totals.filter((x) => x.n).map((x) => `${x.n} ${x.label}`)
  return `${props.label}: ${all} in ${props.bars.length} bars${parts.length ? `, ${parts.join(', ')}` : ''}`
})
</script>

<template>
  <figure class="bar-histogram">
    <figcaption class="bar-histogram__head">
      <span class="bar-histogram__caption"><slot /></span>
      <span
        class="bar-histogram__legend"
        aria-hidden="true"
      >
        <span
          v-for="s in series"
          :key="s.key"
          class="bar-histogram__legend-item"
        >
          <span
            class="bar-histogram__swatch"
            :class="`bar-histogram--${s.tone}`"
          />{{ s.label }}
        </span>
      </span>
    </figcaption>

    <svg
      class="bar-histogram__plot"
      :viewBox="`0 0 ${width} ${HEIGHT}`"
      preserveAspectRatio="none"
      role="img"
      :aria-label="summary"
      data-test="bar-histogram-plot"
    >
      <g
        v-for="col in columns"
        :key="col.t"
        data-test="bar-histogram-bar"
      >
        <title>{{ col.title }}</title>
        <!-- The whole column takes the pointer: the tooltip works on an empty minute too. -->
        <rect
          :x="col.x"
          y="0"
          :width="BAR"
          :height="HEIGHT"
          fill="transparent"
        />
        <rect
          v-for="r in col.rects"
          :key="r.key"
          :x="col.x + GAP / 2"
          :y="r.y"
          :width="BAR - GAP"
          :height="r.h"
          :class="`bar-histogram--${r.tone}`"
          :data-series="r.key"
        />
      </g>
    </svg>

    <div
      class="bar-histogram__ticks"
      aria-hidden="true"
    >
      <span
        v-for="tick in ticks"
        :key="tick.at"
        class="bar-histogram__tick"
        :style="{ left: `${tick.at * 100}%` }"
        :data-at="tick.at"
      >{{ tick.text }}</span>
    </div>
  </figure>
</template>

<style lang="scss" scoped>
.bar-histogram {
  @apply flex flex-col gap-1 min-w-0 m-0;
}

.bar-histogram__head {
  @apply flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1;
  @apply text-xs text-gray-600 dark:text-gray-300;
}

.bar-histogram__caption {
  @apply min-w-0;
}

.bar-histogram__legend {
  @apply flex items-center gap-3 text-2xs text-gray-500 dark:text-gray-400;
}

.bar-histogram__legend-item {
  @apply inline-flex items-center gap-1;
}

.bar-histogram__swatch {
  @apply inline-block w-2 h-2 rounded-sm;
}

.bar-histogram__plot {
  @apply block w-full h-10;
}

.bar-histogram__ticks {
  @apply relative h-4 text-2xs font-mono text-gray-500 dark:text-gray-400;
}

.bar-histogram__tick {
  @apply absolute top-0 whitespace-nowrap;
  transform: translateX(-50%);

  &[data-at='0'] {
    transform: none;
  }

  &[data-at='1'] {
    transform: translateX(-100%);
  }
}

// Fill for the bars, background for the legend swatches.
.bar-histogram--error {
  @apply fill-red-500 bg-red-500;
}

.bar-histogram--warning {
  @apply fill-amber-400 bg-amber-400;
}

.bar-histogram--info {
  @apply fill-blue-500 bg-blue-500;
}

.bar-histogram--neutral {
  @apply fill-gray-300 bg-gray-300 dark:fill-gray-600 dark:bg-gray-600;
}
</style>
