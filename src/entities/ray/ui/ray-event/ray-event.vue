<script lang="ts" setup>
import { ValueDump } from '@/shared/ui'
import type { RayContentEvent } from '../../types'

type Props = {
  content: RayContentEvent
}

defineProps<Props>()
</script>

<template>
  <div class="ray-event">
    <ValueDump
      v-if="content.class_based_event"
      :value="content.event"
    />

    <div class="ray-event__header">
      <span class="ray-event__label">Event</span>
      <code class="ray-event__name">{{ content.name }}</code>
    </div>

    <ValueDump
      v-if="content.payload"
      :value="String(content.payload)"
    />
  </div>
</template>

<style lang="scss" scoped>
.ray-event__header {
  @apply flex items-center gap-2 px-3 py-2 my-1 rounded;
  @apply bg-gray-100 dark:bg-gray-900;
  @apply text-xs;
}

.ray-event__label {
  @apply text-gray-400 dark:text-gray-500;
}

.ray-event__name {
  @apply font-mono font-semibold text-gray-700 dark:text-gray-200;
}
</style>
