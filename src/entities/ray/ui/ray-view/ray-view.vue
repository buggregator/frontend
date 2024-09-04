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
    <h3 class="ray-view__title">
      View:
      <code class="ray-view__code">
        {{ view.view_path_relative_to_project_root }}
      </code>
    </h3>
    <ValueDump :value="view.data" />
  </div>
</template>

<style lang="scss" scoped>
.ray-view {
  display: block;
}

.ray-view__title {
  @apply p-3 border border-gray-300 dark:border-gray-600 bg-gray-800;
}

.ray-view__code {
  @apply font-semibold;
}
</style>
