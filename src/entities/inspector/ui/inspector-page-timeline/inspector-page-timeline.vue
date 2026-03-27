<script lang="ts" setup>
import { computed, type ComputedRef, type Ref } from 'vue'
import type { InspectorSegment, InspectorTransaction, Inspector } from '../../types'

type Props = {
  payload: Inspector
}

const COLUMNS_NUMBER = 5

const props = defineProps<Props>()

const segmentColor = (color: string): string => {
  switch (color) {
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

const layoutCells = computed(() => {
  const maxWidth = transaction.value.duration
  const cellWidth = Math.floor(maxWidth / COLUMNS_NUMBER + 1)

  return new Array(COLUMNS_NUMBER).fill(null).reduceRight((acc, _, i) => {
    acc.push(Math.abs(Math.floor(maxWidth - cellWidth * (i + 1))))

    if (!i) {
      acc.push(maxWidth)
    }

    return acc
  }, [])
})

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

const segmentRows = computed(() => {
  const { duration } = transaction.value

  return segments.value.map((segment: InspectorSegment) => ({
    label: segment.label,
    duration: segment.duration,
    start: segment.start,
    type: segment.type,
    widthPercent: Math.max(Number(((segment.duration * 100) / duration).toFixed(2)), 0.5),
    marginPercent: (((segment.start || 0) * 100) / duration).toFixed()
  }))
})
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
      class="timeline__body"
    >
      <div
        class="timeline__grid-header"
        :class="`grid-cols-${COLUMNS_NUMBER + 1}`"
      >
        <div
          v-for="cell in layoutCells"
          :key="cell"
          class="timeline__grid-cell"
        >
          {{ cell }} ms
        </div>
      </div>

      <div class="timeline__rows">
        <div
          v-for="segmentRow in segmentRows"
          :key="`${segmentRow.label} - ${segmentRow.duration}`"
          class="timeline__row"
        >
          <div
            class="timeline__row-label"
            :title="segmentRow.label"
          >
            {{ segmentRow.label }}
          </div>

          <div class="timeline__row-bar">
            <div
              :style="{ width: segmentRow.marginPercent + '%' }"
              class="timeline__row-offset"
            >
              <span class="timeline__row-start">{{ segmentRow.start }} ms</span>
            </div>

            <div
              class="timeline__row-fill"
              :style="{
                width: segmentRow.widthPercent + '%',
                background: segmentColor(segmentRow.type)
              }"
            >
              <span v-if="segmentRow.widthPercent > 20">{{ segmentRow.duration }} ms</span>
            </div>

            <div
              class="timeline__row-end"
              :style="{ color: segmentColor(segmentRow.type) }"
            >
              <span v-if="segmentRow.widthPercent <= 20">{{ segmentRow.duration }} ms</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="segmentRows.length === 0"
      class="timeline__empty"
    >
      <span class="timeline__empty-text">No segments recorded</span>
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
  @apply rounded overflow-hidden;
  @apply border border-gray-200 dark:border-gray-700;
}

.timeline__grid-header {
  @apply grid grid-cols-6;
  @apply border-b border-gray-200 dark:border-gray-700;
  @apply bg-gray-50 dark:bg-gray-900;
  @apply text-2xs font-mono font-medium text-center text-gray-500 dark:text-gray-400;
}

.timeline__grid-cell {
  @apply py-2 px-2;
  @apply border-r border-gray-200/50 dark:border-gray-700/50;

  &:last-child {
    @apply border-r-0;
  }
}

.timeline__rows {
  @apply divide-y divide-gray-100 dark:divide-gray-800;
}

.timeline__row {
  @apply cursor-default;
  @apply hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors;
}

.timeline__row-label {
  @apply text-2xs font-medium whitespace-nowrap px-3 py-1;
  @apply text-gray-400 dark:text-gray-500;
  @apply overflow-hidden text-ellipsis;

  .timeline__row:hover & {
    @apply text-gray-700 dark:text-gray-200;
  }
}

.timeline__row-bar {
  @apply flex items-center w-full;
}

.timeline__row-offset {
  @apply flex items-center justify-end h-5;
}

.timeline__row-start {
  @apply text-2xs font-mono text-gray-400 dark:text-gray-500 mr-2;
  @apply opacity-0;

  .timeline__row:hover & {
    @apply opacity-100;
  }
}

.timeline__row-fill {
  @apply flex flex-none relative items-center;
  @apply h-5 rounded-sm text-white;
  min-width: 0;

  span {
    @apply text-2xs font-mono font-medium text-right px-1;
  }
}

.timeline__row-end {
  @apply flex flex-1 items-center px-2 h-5;
  @apply text-2xs font-mono font-medium text-left;
}

.timeline__empty {
  @apply flex items-center justify-center py-8;
  @apply rounded border border-gray-200 dark:border-gray-700;
  @apply bg-gray-50 dark:bg-gray-900;
}

.timeline__empty-text {
  @apply text-sm text-gray-400 dark:text-gray-500;
}
</style>
