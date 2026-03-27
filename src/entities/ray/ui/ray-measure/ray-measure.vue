<script lang="ts" setup>
import { computed } from 'vue'
import type { RayContentMeasure } from '../../types'

type Props = {
  measure: RayContentMeasure
}

const props = defineProps<Props>()

const convertMilliseconds = (milliseconds: number): string => (milliseconds / 1000).toFixed(4)

const prettySize = (bytes: number): string => {
  if (!bytes) return 'n/a'
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.min(
    Number(parseInt(String(Math.floor(Math.log(bytes) / Math.log(1024))), 10)),
    sizes.length - 1
  )
  return `${(bytes / 1024 ** i).toFixed(2)} ${sizes[i]}`
}

const totalTime = computed(() => `${convertMilliseconds(props.measure.total_time)} s`)
const timeSinceLastCall = computed(
  () => `${convertMilliseconds(props.measure.time_since_last_call)} s`
)
const maxMemoryUsage = computed(() => prettySize(props.measure.max_memory_usage_during_total_time))
</script>

<template>
  <div class="ray-measure">
    <div
      v-if="measure.is_new_timer"
      class="ray-measure__new"
    >
      Start measuring performance...
    </div>

    <div
      v-else
      class="ray-measure__board"
    >
      <div class="ray-measure__item">
        <span class="ray-measure__label">Total time</span>
        <strong class="ray-measure__value">{{ totalTime }}</strong>
      </div>
      <div class="ray-measure__item">
        <span class="ray-measure__label">Since last call</span>
        <strong class="ray-measure__value">{{ timeSinceLastCall }}</strong>
      </div>
      <div class="ray-measure__item">
        <span class="ray-measure__label">Peak memory</span>
        <strong class="ray-measure__value">{{ maxMemoryUsage }}</strong>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.ray-measure__new {
  @apply text-xs font-medium text-gray-500 dark:text-gray-400 italic;
}

.ray-measure__board {
  @apply flex flex-col sm:flex-row rounded overflow-hidden;
  @apply border border-gray-200 dark:border-gray-700;
  @apply divide-y sm:divide-y-0 sm:divide-x divide-gray-200 dark:divide-gray-700;
  @apply bg-gray-50 dark:bg-gray-900;
}

.ray-measure__item {
  @apply flex flex-row justify-between sm:flex-col sm:justify-start flex-auto;
  @apply w-full sm:w-auto;
  @apply py-2 px-3 sm:py-3 sm:px-4;
}

.ray-measure__label {
  @apply text-2xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide;
}

.ray-measure__value {
  @apply font-mono text-xs sm:text-sm;
}
</style>
