<script lang="ts" setup>
import { computed } from 'vue'
import type { NormalizedEvent } from '@/shared/types'
import { PreviewCard } from '@/shared/ui'
import type { Profiler } from '../../types'
import { StatBoard } from '../../ui'

type Props = {
  event: NormalizedEvent<Profiler>
}

const props = defineProps<Props>()
const eventLink = computed(() => `/profiler/${props.event.id}`)
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
      <StatBoard :cost="event.payload.peaks" />
    </RouterLink>
  </PreviewCard>
</template>

<style lang="scss" scoped>
.preview-card {
}

.preview-card__link {
  @apply flex-grow rounded-md overflow-hidden mb-2 border dark:border-gray-500;
}
</style>
