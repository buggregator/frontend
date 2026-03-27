<script lang="ts" setup>
import type { RayContentCarbon } from '../../types'

type Props = {
  carbon: RayContentCarbon
}

defineProps<Props>()
</script>

<template>
  <div class="ray-carbon">
    <div class="ray-carbon__board">
      <div class="ray-carbon__item">
        <span class="ray-carbon__label">Formatted</span>
        <strong class="ray-carbon__value">{{ carbon.formatted }}</strong>
      </div>
      <div class="ray-carbon__item">
        <span class="ray-carbon__label">Timezone</span>
        <strong class="ray-carbon__value">{{ carbon.timezone }}</strong>
      </div>
      <div class="ray-carbon__item">
        <span class="ray-carbon__label">Timestamp</span>
        <strong class="ray-carbon__value">{{ carbon.timestamp }}</strong>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.ray-carbon__board {
  @apply flex flex-col sm:flex-row rounded overflow-hidden;
  @apply border border-gray-200 dark:border-gray-700;
  @apply divide-y sm:divide-y-0 sm:divide-x divide-gray-200 dark:divide-gray-700;
  @apply bg-gray-50 dark:bg-gray-900;
}

.ray-carbon__item {
  @apply flex flex-row justify-between sm:flex-col sm:justify-start flex-auto;
  @apply w-full sm:w-auto;
  @apply py-2 px-3 sm:py-3 sm:px-4;
}

.ray-carbon__label {
  @apply text-2xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide;
}

.ray-carbon__value {
  @apply font-mono text-xs sm:text-sm;
}
</style>
