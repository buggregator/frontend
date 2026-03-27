<script lang="ts" setup>
import { useElementSize } from '@vueuse/core'
import { computed, ref, type ComputedRef, type Ref } from 'vue'
import type { InspectorSegment, InspectorTransaction, Inspector } from '../../types'

type Props = {
  payload: Inspector
}

type SegmentRow = {
  label: string | undefined
  duration: number
  start: number
  end: number
  type: string
  widthPercent: number
  leftPercent: number
}

const bodyRef = ref<HTMLElement>()
const { width: bodyWidth } = useElementSize(bodyRef)

const tickCount = computed(() => {
  const w = bodyWidth.value
  if (w < 400) return 4
  if (w < 600) return 6
  if (w < 900) return 8
  if (w < 1200) return 10
  return 12
})

const props = defineProps<Props>()

const segmentColor = (type: string): string => {
  switch (type) {
    case 'sqlite':
      return '#f97316'
    case 'view':
      return '#3b82f6'
    case 'artisan':
      return '#a855f7'
    case 'pgsql':
      return '#22c55e'
    default:
      return '#64748b'
  }
}

const transaction: Ref<InspectorTransaction> = computed(
  () => props.payload[0] as InspectorTransaction
)

const segments: ComputedRef<InspectorSegment[]> = computed(() =>
  props.payload
    .filter((item): item is InspectorSegment => item.model === 'segment')
    .filter((el) => el?.transaction?.hash === transaction.value.hash)
)

const segmentTypes = computed(() => {
  const arr: string[] = []

  segments.value.forEach((data) => {
    if (!arr.includes(data.type)) {
      arr.push(data.type)
    }
  })

  return arr
})

const visibleRange = computed(() => {
  const starts = segments.value.map((s) => s.start || 0)
  const ends = segments.value.map((s) => (s.start || 0) + s.duration)
  const minStart = starts.length ? Math.min(...starts) : 0
  const maxEnd = ends.length ? Math.max(...ends) : transaction.value.duration

  const padding = (maxEnd - minStart) * 0.05
  const from = Math.max(0, Number((minStart - padding).toFixed(2)))
  const to = Math.min(transaction.value.duration, Number((maxEnd + padding).toFixed(2)))

  return { from, to, span: Number((to - from).toFixed(2)) }
})

const timeMarks = computed(() => {
  const { from, span } = visibleRange.value
  const marks: number[] = []

  for (let i = 0; i < tickCount.value; i++) {
    marks.push(Number((from + (span * i) / tickCount.value).toFixed(1)))
  }

  return marks
})

const segmentRows = computed((): SegmentRow[] => {
  const { from, span } = visibleRange.value

  return segments.value.map((segment) => {
    const start = segment.start || 0

    return {
      label: segment.label,
      duration: segment.duration,
      start,
      end: Number((start + segment.duration).toFixed(2)),
      type: segment.type,
      widthPercent: Math.max(Number(((segment.duration * 100) / span).toFixed(2)), 0.4),
      leftPercent: Math.max(0, Number((((start - from) * 100) / span).toFixed(2)))
    }
  })
})

const hoveredIndex = ref<number | null>(null)
</script>

<template>
  <section class="timeline">
    <div class="timeline__head">
      <h3 class="timeline__title">
        Timeline
      </h3>

      <div
        v-if="segmentTypes.length > 0"
        class="timeline__legend"
      >
        <div
          v-for="segmentType in segmentTypes"
          :key="segmentType"
          class="timeline__legend-item"
        >
          <div
            :style="{ background: segmentColor(segmentType) }"
            class="timeline__legend-dot"
          />
          <span class="timeline__legend-label">{{ segmentType }}</span>
        </div>
      </div>
    </div>

    <div
      v-if="segmentRows.length > 0"
      ref="bodyRef"
      class="timeline__body"
    >
      <!-- Time ruler -->
      <div class="timeline__ruler">
        <div class="timeline__ruler-track">
          <div
            v-for="(mark, i) in timeMarks"
            :key="i"
            class="timeline__ruler-tick"
            :style="{ left: (i * 100) / tickCount + '%' }"
          >
            <span class="timeline__ruler-label">{{ mark }} ms</span>
          </div>
        </div>
      </div>

      <!-- Rows -->
      <div class="timeline__rows">
        <!-- Vertical grid lines -->
        <div class="timeline__grid">
          <div
            v-for="i in tickCount - 1"
            :key="i"
            class="timeline__grid-line"
            :style="{ left: (i * 100) / tickCount + '%' }"
          />
        </div>

        <div
          v-for="(row, idx) in segmentRows"
          :key="`${row.label}-${row.start}`"
          class="timeline__row"
          :class="{ 'timeline__row--hovered': hoveredIndex === idx }"
          @mouseenter="hoveredIndex = idx"
          @mouseleave="hoveredIndex = null"
        >
          <div class="timeline__bar-track">
            <div
              class="timeline__bar"
              :style="{
                left: row.leftPercent + '%',
                width: row.widthPercent + '%',
                background: segmentColor(row.type)
              }"
            />
          </div>

          <!-- Tooltip -->
          <div
            v-if="hoveredIndex === idx"
            class="timeline__tip"
            :class="{
              'timeline__tip--below': idx < 2,
              'timeline__tip--above': idx >= 2
            }"
            :style="{
              left: Math.min(row.leftPercent + row.widthPercent + 0.5, 70) + '%'
            }"
          >
            <div class="timeline__tip-inner">
              <span
                class="timeline__tip-badge"
                :style="{ background: segmentColor(row.type) }"
              >{{
                row.type
              }}</span>

              <p
                v-if="row.label"
                class="timeline__tip-label"
              >
                {{ row.label }}
              </p>

              <div class="timeline__tip-stats">
                <span>Start <b>{{ row.start }} ms</b></span>
                <span>Duration <b>{{ row.duration }} ms</b></span>
                <span>End <b>{{ row.end }} ms</b></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="segmentRows.length === 0"
      class="timeline__empty"
    >
      No segments recorded
    </div>
  </section>
</template>

<style lang="scss" scoped>
.timeline__head {
  @apply flex items-center justify-between mb-3;
}

.timeline__title {
  @apply text-xs font-mono font-semibold uppercase tracking-wider;
  @apply text-gray-500 dark:text-gray-400;
}

.timeline__legend {
  @apply flex gap-4;
}

.timeline__legend-item {
  @apply flex items-center gap-1.5;
}

.timeline__legend-dot {
  @apply w-2.5 h-2.5 rounded-sm;
}

.timeline__legend-label {
  @apply text-2xs font-medium text-gray-600 dark:text-gray-300;
}

/* Body */
.timeline__body {
  @apply rounded;
  @apply border border-gray-200 dark:border-gray-700;
}

/* Ruler */
.timeline__ruler {
  @apply relative h-6;
  @apply border-b border-gray-200 dark:border-gray-700;
  @apply bg-gray-50 dark:bg-gray-900;
}

.timeline__ruler-track {
  @apply relative h-full;
}

.timeline__ruler-tick {
  @apply absolute top-0 h-full;

  &::before {
    content: '';
    @apply absolute left-0 bottom-0 w-px h-2;
    @apply bg-gray-300 dark:bg-gray-600;
  }
}

.timeline__ruler-label {
  @apply absolute left-1.5 top-1/2 -translate-y-1/2;
  @apply text-2xs font-mono text-gray-400 dark:text-gray-500;
  @apply whitespace-nowrap;
}

/* Rows */
.timeline__rows {
  @apply relative;
}

.timeline__grid {
  @apply absolute inset-0 pointer-events-none;
}

.timeline__grid-line {
  @apply absolute top-0 bottom-0 w-px;
  @apply bg-gray-100 dark:bg-gray-800;
}

.timeline__row {
  @apply relative;
  @apply border-b border-gray-100 dark:border-gray-800;
  @apply transition-colors;

  &:last-child {
    @apply border-b-0;
  }
}

.timeline__row--hovered {
  @apply bg-gray-50 dark:bg-gray-800/40;
}

/* Bar track */
.timeline__bar-track {
  @apply relative h-6 mx-1;
}

.timeline__bar {
  @apply absolute top-1 bottom-1 rounded-sm;
  min-width: 3px;
  @apply transition-opacity;

  .timeline__row--hovered & {
    @apply opacity-80;
  }
}

/* Tooltip */
.timeline__tip {
  @apply absolute z-30 pointer-events-none;
  transform: translateX(-20px);
}

.timeline__tip--above {
  @apply bottom-full mb-1;
}

.timeline__tip--below {
  @apply top-full mt-1;
}

.timeline__tip-inner {
  @apply rounded-lg shadow-lg p-2.5;
  @apply bg-white dark:bg-gray-800;
  @apply border border-gray-200 dark:border-gray-700;
  @apply whitespace-nowrap;
  max-width: 360px;
}

.timeline__tip-badge {
  @apply inline-block px-1.5 py-0.5 mb-1 rounded;
  @apply text-2xs font-semibold text-white uppercase tracking-wide;
}

.timeline__tip-label {
  @apply text-2xs font-mono leading-relaxed mb-1.5 pb-1.5;
  @apply text-gray-700 dark:text-gray-200;
  @apply border-b border-gray-100 dark:border-gray-700;
  @apply whitespace-normal break-all;
}

.timeline__tip-stats {
  @apply flex gap-3;
  @apply text-2xs text-gray-400 dark:text-gray-500;

  b {
    @apply font-medium text-gray-600 dark:text-gray-300 ml-0.5;
  }
}

/* Empty */
.timeline__empty {
  @apply flex items-center justify-center py-8;
  @apply rounded border border-gray-200 dark:border-gray-700;
  @apply bg-gray-50 dark:bg-gray-900;
  @apply text-sm text-gray-400 dark:text-gray-500;
}
</style>
