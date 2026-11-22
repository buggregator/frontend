<script lang="ts" setup>
import { computed } from 'vue'
import { formatMs, type RequestTimelineModel, type TimelineItem } from '../../lib/request-timeline'

// The lanes: one row per kind, its count on the left, items placed by time.
// Pointer only: the list under it is the keyboard and screen reader path to
// the same items, so the chart stays out of the accessibility tree.

type Props = { timeline: RequestTimelineModel; selectedId: string | null }

const props = defineProps<Props>()
const emit = defineEmits<{ select: [item: TimelineItem] }>()

const pct = (ms: number) => `${(ms / props.timeline.totalMs) * 100}%`
const ticks = computed(() => [0, 0.25, 0.5, 0.75, 1].map((f) => ({ left: `${f * 100}%`, text: formatMs(f * props.timeline.totalMs) })))

const title = (item: TimelineItem) => {
  if (item.kind === 'group') return `${item.label} ×${item.count} · ${formatMs(item.totalMs)}`
  if (item.kind === 'marker') return `${item.label} · at ${formatMs(item.startMs)}`
  return `${item.label} · ${formatMs(item.durationMs)}`
}

const itemClass = (item: TimelineItem) => ({
  'tl-lanes__item--selected': item.id === props.selectedId,
  'tl-lanes__item--error': item.isError,
  'tl-lanes__item--warning': item.kind === 'marker' && item.marker.tone === 'warning',
  'tl-lanes__item--n1': item.kind === 'group' && !!item.nPlusOne
})
</script>

<template>
  <div
    class="tl-lanes"
    aria-hidden="true"
    data-test="timeline-lanes"
  >
    <div class="tl-lanes__row tl-lanes__row--axis">
      <span class="tl-lanes__label" />
      <span class="tl-lanes__count" />
      <div class="tl-lanes__track tl-lanes__track--axis">
        <span
          v-for="(tick, i) in ticks"
          :key="i"
          class="tl-lanes__tick"
          :class="{ 'tl-lanes__tick--end': i === ticks.length - 1 }"
          :style="{ left: tick.left }"
        >{{ tick.text }}</span>
      </div>
    </div>

    <div
      v-for="row in props.timeline.lanes"
      :key="row.lane"
      class="tl-lanes__row"
      :data-lane="row.lane"
    >
      <span class="tl-lanes__label">{{ row.label }}</span>
      <span class="tl-lanes__count">{{ row.count }}</span>
      <div class="tl-lanes__track">
        <template
          v-for="item in row.items"
          :key="item.id"
        >
          <span
            v-if="item.kind === 'marker'"
            class="tl-lanes__item tl-lanes__marker"
            :class="itemClass(item)"
            :style="{ left: pct(item.startMs) }"
            :title="title(item)"
            @click="emit('select', item)"
          />
          <span
            v-else
            class="tl-lanes__item tl-lanes__bar"
            :class="[itemClass(item), { 'tl-lanes__bar--request': item.lane === 'request' }]"
            :style="{ left: pct(item.startMs), width: pct(item.durationMs) }"
            :title="title(item)"
            @click="emit('select', item)"
          >
            <template v-if="item.kind === 'group'">×{{ item.count }}</template>
            <template v-else-if="item.lane === 'request'">{{ item.label }} · {{ formatMs(item.durationMs) }}</template>
          </span>
        </template>
      </div>
    </div>

    <p class="tl-lanes__legend">
      <span class="tl-lanes__key tl-lanes__key--bar" /> has a duration
      <span class="tl-lanes__key tl-lanes__key--marker" /> a moment
      <span class="tl-lanes__key tl-lanes__key--error" /> failed
      <span class="tl-lanes__key tl-lanes__key--n1" /> N+1 group
      · Click anything for details
    </p>
  </div>
</template>

<style lang="scss" scoped>
.tl-lanes {
  @apply hidden md:flex flex-col gap-1 text-2xs;
}

.tl-lanes__row {
  @apply flex items-center gap-2 h-5;
}

.tl-lanes__row--axis {
  @apply h-4;
}

.tl-lanes__label {
  @apply w-20 flex-none truncate text-gray-600 dark:text-gray-400;
}

.tl-lanes__count {
  @apply w-8 flex-none text-right font-mono text-gray-500 dark:text-gray-400;
}

.tl-lanes__track {
  @apply relative flex-1 h-full rounded-sm bg-gray-100 dark:bg-gray-700/60;
}

.tl-lanes__track--axis {
  @apply bg-transparent dark:bg-transparent;
}

.tl-lanes__tick {
  @apply absolute top-0 -translate-x-1/2 font-mono text-gray-500 dark:text-gray-400 whitespace-nowrap;

  &:first-child {
    @apply translate-x-0;
  }
}

.tl-lanes__tick--end {
  @apply -translate-x-full;
}

.tl-lanes__item {
  @apply absolute cursor-pointer;
}

.tl-lanes__bar {
  @apply top-0.5 bottom-0.5 rounded-sm overflow-hidden whitespace-nowrap px-1 leading-4;
  @apply bg-gray-400 dark:bg-gray-500 text-gray-900 dark:text-gray-100;
  min-width: 3px;

  &:hover {
    @apply bg-gray-500 dark:bg-gray-400;
  }
}

.tl-lanes__bar--request {
  @apply bg-gray-300 dark:bg-gray-600 font-mono;
}

.tl-lanes__marker {
  @apply top-1/2 w-2.5 h-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45;
  @apply bg-gray-500 dark:bg-gray-300;
}

.tl-lanes__item--error {
  @apply bg-red-500 dark:bg-red-500 text-white;
}

.tl-lanes__item--warning {
  @apply bg-amber-500 dark:bg-amber-400;
}

.tl-lanes__item--n1 {
  @apply bg-amber-300 dark:bg-amber-400 text-gray-900 font-semibold;
  @apply outline-dashed outline-1 outline-offset-1 outline-amber-600 dark:outline-amber-300;
}

.tl-lanes__item--selected {
  @apply ring-2 ring-blue-500 ring-offset-1 ring-offset-white dark:ring-offset-gray-800 z-10;
}

.tl-lanes__legend {
  @apply flex flex-wrap items-center gap-x-2 gap-y-1 pt-2 text-gray-500 dark:text-gray-400;
}

.tl-lanes__key {
  @apply inline-block w-3 h-2 rounded-sm ml-2 first:ml-0;
}

.tl-lanes__key--bar {
  @apply bg-gray-400 dark:bg-gray-500;
}

.tl-lanes__key--marker {
  @apply w-2 h-2 rotate-45 bg-gray-500 dark:bg-gray-300;
}

.tl-lanes__key--error {
  @apply bg-red-500;
}

.tl-lanes__key--n1 {
  @apply bg-amber-300 outline-dashed outline-1 outline-amber-600;
}
</style>
