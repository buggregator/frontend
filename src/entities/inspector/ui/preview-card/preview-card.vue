<script lang="ts" setup>
import { computed } from 'vue'
import type { NormalizedEvent } from '@/shared/types'
import { PreviewCard } from '@/shared/ui'
import type { Inspector } from '../../types'
import InspectorStatBoard from '../inspector-stat-board/inspector-stat-board.vue'

type Props = {
  event: NormalizedEvent<Inspector>
}

const props = defineProps<Props>()

const eventLink = computed(() => `/inspector/${props.event.id}`)
</script>

<template>
  <PreviewCard :event="event">
    <RouterLink
      :to="eventLink"
      class="inspector-body"
    >
      <InspectorStatBoard :transaction="event.payload[0]" />
    </RouterLink>
  </PreviewCard>
</template>

<style lang="scss" scoped>
.inspector-body {
  @apply block rounded overflow-hidden cursor-pointer;
  @apply border border-gray-200 dark:border-gray-700;
}
</style>
