<script lang="ts" setup>
import type { NormalizedEvent } from '@/shared/types'
import { CodeSnippet, PreviewCard } from '@/shared/ui'

type Props = {
  event: NormalizedEvent<unknown>
}

defineProps<Props>()
</script>

<template>
  <PreviewCard class="event-card-fallback" :event="event">
    <CodeSnippet class="event-card-fallback__snippet" :code="event" language="json" />
  </PreviewCard>
</template>

<style lang="scss" scoped>
.event-card-fallback {
  @apply text-xs break-all;
}

.event-card-fallback__snippet {
  @apply relative bg-gray-200 dark:bg-gray-800 border-b-0 mt-0 text-white break-words;
}
</style>
