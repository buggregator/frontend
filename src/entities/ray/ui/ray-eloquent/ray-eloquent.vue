<script lang="ts" setup>
import { ValueDump } from '@/shared/ui'
import type { RayContentEloquent } from '../../types'

type Props = {
  content: RayContentEloquent
}

defineProps<Props>()
</script>

<template>
  <div class="ray-eloquent">
    <div class="ray-eloquent__header">
      <span class="ray-eloquent__label">Class</span>
      <code class="ray-eloquent__class">{{ content.class_name }}</code>
    </div>
    <ValueDump :value="content.attributes" />
  </div>
</template>

<style lang="scss" scoped>
.ray-eloquent__header {
  @apply flex items-center gap-2 px-3 py-2 mb-2 rounded;
  @apply bg-gray-100 dark:bg-gray-900;
  @apply text-xs;
}

.ray-eloquent__label {
  @apply text-gray-400 dark:text-gray-500;
}

.ray-eloquent__class {
  @apply font-mono font-semibold text-gray-700 dark:text-gray-200;
}
</style>
