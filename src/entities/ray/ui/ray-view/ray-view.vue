<script lang="ts" setup>
import { ValueDump } from '@/shared/ui'
import type { RayContentView } from '../../types'

type Props = {
  view: RayContentView
}

defineProps<Props>()
</script>

<template>
  <div class="ray-view">
    <div class="ray-view__header">
      <span class="ray-view__label">View</span>
      <code class="ray-view__path">{{ view.view_path_relative_to_project_root }}</code>
    </div>
    <ValueDump :value="view.data" />
  </div>
</template>

<style lang="scss" scoped>
.ray-view__header {
  @apply flex items-center gap-2 px-3 py-2 mb-2 rounded;
  @apply bg-gray-100 dark:bg-gray-900;
  @apply text-xs;
}

.ray-view__label {
  @apply text-gray-400 dark:text-gray-500;
}

.ray-view__path {
  @apply font-mono font-semibold text-gray-700 dark:text-gray-200;
}
</style>
