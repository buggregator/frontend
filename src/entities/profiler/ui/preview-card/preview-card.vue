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
  <PreviewCard :event="event">
    <RouterLink
      :to="eventLink"
      class="profiler-body"
    >
      <StatBoard :cost="event.payload.peaks" />
    </RouterLink>
  </PreviewCard>
</template>

<style lang="scss" scoped>
.profiler-body {
  @apply block rounded overflow-hidden;
  @apply border border-gray-200 dark:border-gray-700;
}
</style>
