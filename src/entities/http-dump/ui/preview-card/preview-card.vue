<script lang="ts" setup>
import type { NormalizedEvent } from '@/shared/types'
import { PreviewCard } from '@/shared/ui'
import type { HttpDump } from '../../types'

type Props = {
  event: NormalizedEvent<HttpDump>
}

const props = defineProps<Props>()

const uri = decodeURI(props.event.payload.request.uri)
</script>

<template>
  <PreviewCard
    class="preview-card"
    :event="event"
  >
    <div class="preview-card__content">
      <span class="preview-card__method"> {{ event.payload.request.method }} </span>:
      <span class="preview-card__uri">/{{ uri }}</span>
    </div>
  </PreviewCard>
</template>

<style lang="scss" scoped>
.preview-card {
  @apply text-2xs md:text-xs;
}

.preview-card__content {
  @apply p-2 md:p-3 bg-gray-200 dark:bg-gray-800;
}

.preview-card__method {
  @apply font-mono;
}

.preview-card__uri {
  @apply font-mono font-bold;
}
</style>
