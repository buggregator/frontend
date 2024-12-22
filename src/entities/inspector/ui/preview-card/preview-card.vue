<script lang="ts" setup>
import { computed, defineProps } from 'vue'
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
  <PreviewCard
    class="preview-card"
    :event="event"
  >
    <RouterLink
      :to="eventLink"
      class="preview-card__link"
    >
      <InspectorStatBoard :transaction="event.payload[0]" />
    </RouterLink>
  </PreviewCard>
</template>

<style lang="scss" scoped>
.preview-card {
}

.preview-card__link {
  @apply flex-grow cursor-pointer rounded-md overflow-hidden mb-2 border dark:border-gray-500;
}
</style>
