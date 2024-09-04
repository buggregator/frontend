<script lang="ts" setup>
import { defineProps } from 'vue'
import type { ProfilerEdge } from '@/entities/profiler/types'
import { StatBoard } from '@/shared/ui'

type Props = {
  edge: ProfilerEdge
}

defineProps<Props>()
</script>

<template>
  <div class="call-stat-board">
    <h4 class="call-stat-board__title">
      {{ edge.callee }}
    </h4>

    <StatBoard class="call-stat-board__body" :cost="edge.cost" size="sm" />
  </div>
</template>

<style lang="scss" scoped>
.call-stat-board {
  @apply border border-gray-600 bg-gray-800;
}

.call-stat-board__title {
  @apply p-2 text-xs font-bold truncate text-gray-300;
}

.call-stat-board__body {
  @apply pt-0;
}
</style>
