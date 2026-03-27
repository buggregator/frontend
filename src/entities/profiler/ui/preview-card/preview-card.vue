<script lang="ts" setup>
import { computed } from 'vue'
import type { NormalizedEvent } from '@/shared/types'
import { PreviewCard } from '@/shared/ui'
import { useProfilerCompare } from '../../lib/use-profiler-compare'
import type { Profiler } from '../../types'
import { StatBoard } from '../../ui'

type Props = {
  event: NormalizedEvent<Profiler>
}

const props = defineProps<Props>()
const eventLink = computed(() => `/profiler/${props.event.id}`)

const { compareBase, isSelecting, selectForCompare } = useProfilerCompare()
const isSelected = computed(() => compareBase.value === props.event.id)
</script>

<template>
  <PreviewCard :event="event">
    <RouterLink
      :to="eventLink"
      class="profiler-body"
    >
      <StatBoard :cost="event.payload.peaks" />
    </RouterLink>

    <div class="profiler-actions">
      <button
        class="profiler-compare-btn"
        :class="{
          'profiler-compare-btn--selected': isSelected,
          'profiler-compare-btn--picking': isSelecting && !isSelected
        }"
        @click.stop="selectForCompare(event.id)"
      >
        {{ isSelected ? 'Base selected' : isSelecting ? 'Compare with this' : 'Compare' }}
      </button>
    </div>
  </PreviewCard>
</template>

<style lang="scss" scoped>
.profiler-body {
  @apply block rounded overflow-hidden;
  @apply border border-gray-200 dark:border-gray-700;
}

.profiler-actions {
  @apply flex items-center gap-2 mt-2;
}

.profiler-compare-btn {
  @apply text-2xs px-2 py-0.5 rounded cursor-pointer;
  @apply bg-gray-100 dark:bg-gray-700;
  @apply text-gray-500 dark:text-gray-400;
  @apply hover:bg-gray-200 dark:hover:bg-gray-600;
  @apply transition-colors;
}

.profiler-compare-btn--selected {
  @apply bg-blue-100 dark:bg-blue-500/20;
  @apply text-blue-600 dark:text-blue-400;
}

.profiler-compare-btn--picking {
  @apply bg-green-100 dark:bg-green-500/20;
  @apply text-green-600 dark:text-green-400;
  @apply hover:bg-green-200 dark:hover:bg-green-500/30;
}
</style>
