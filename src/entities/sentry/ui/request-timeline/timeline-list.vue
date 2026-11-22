<script lang="ts" setup>
import { ref } from 'vue'
import { formatMs, LANE_KIND, type TimelineItem } from '../../lib/request-timeline'

// Every item by time: under the lanes on a computer, the whole view on a
// phone. Each row is a button: the keyboard path to the details.

type Props = { items: TimelineItem[]; selectedId: string | null }

const props = defineProps<Props>()
const emit = defineEmits<{ select: [item: TimelineItem] }>()

const rows = ref<Record<string, HTMLElement>>({})
const focusRow = (id: string) => {
  const row = rows.value[id]
  row?.focus()
  row?.scrollIntoView?.({ block: 'nearest' })
}
defineExpose({ focusRow })

const duration = (item: TimelineItem) => {
  if (item.kind === 'marker') return '—'
  return formatMs(item.kind === 'group' ? item.totalMs : item.durationMs)
}
</script>

<template>
  <ol
    class="tl-list"
    aria-label="Everything the request did, by time"
    data-test="timeline-list"
  >
    <li
      v-for="item in props.items"
      :key="item.id"
    >
      <button
        :ref="(el) => { if (el) rows[item.id] = el as HTMLElement }"
        type="button"
        class="tl-list__row"
        :class="{ 'tl-list__row--selected': item.id === props.selectedId, 'tl-list__row--error': item.isError }"
        :aria-pressed="item.id === props.selectedId"
        :data-test="`timeline-row-${item.lane}`"
        @click="emit('select', item)"
      >
        <span class="tl-list__at">{{ formatMs(item.startMs) }}</span>
        <span class="tl-list__kind">
          {{ LANE_KIND[item.lane] }}<template v-if="item.kind === 'group'"> ×{{ item.count }}</template>
        </span>
        <span class="tl-list__label">
          <template v-if="item.isError">✕ </template>{{ item.label }}
        </span>
        <span class="tl-list__dur">{{ duration(item) }}</span>
      </button>
    </li>
  </ol>
</template>

<style lang="scss" scoped>
.tl-list {
  @apply flex flex-col text-xs border-t border-gray-200 dark:border-gray-700/50;
}

.tl-list__row {
  @apply w-full flex items-baseline gap-3 px-2 py-1.5 text-left;
  @apply border-b border-gray-100 dark:border-gray-700/40;
  @apply hover:bg-gray-50 dark:hover:bg-gray-900;
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500;
}

.tl-list__row--selected {
  @apply bg-blue-50 dark:bg-blue-500/10;
}

.tl-list__row--error .tl-list__label {
  @apply text-red-700 dark:text-red-400;
}

.tl-list__at {
  @apply w-16 flex-none font-mono text-gray-500 dark:text-gray-400;
}

.tl-list__kind {
  @apply w-16 flex-none font-mono text-gray-500 dark:text-gray-400;
}

.tl-list__label {
  @apply flex-1 min-w-0 font-mono text-gray-900 dark:text-gray-100 break-all sm:truncate;
}

.tl-list__dur {
  @apply w-16 flex-none text-right font-mono text-gray-500 dark:text-gray-400;
}
</style>
