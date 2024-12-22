<script lang="ts" setup>
import { computed, ref } from 'vue'
import type { NormalizedEvent } from '@/shared/types'
import { PreviewCard, CodeSnippet } from '@/shared/ui'
import type { Monolog } from '../../types'

type Props = {
  event: NormalizedEvent<Monolog>
}

const props = defineProps<Props>()
const message = ref(props.event.payload.message)

const shortMessage = computed(() => {
  const lines = message.value.split('\n')

  if (lines.length > 10) {
    return `${lines.slice(0, 8).join('\n')}\n...`
  }

  return message.value
})

const isFullMessage = ref(message.value.length === shortMessage.value.length)

const toggleView = () => {
  isFullMessage.value = !isFullMessage.value
}
</script>

<template>
  <PreviewCard
    class="preview-card"
    :event="event"
  >
    <CodeSnippet
      class="preview-card__snippet preview-card__snippet--interactive"
      :code="isFullMessage ? message : shortMessage"
      title="Click to show full message"
      @click="toggleView"
    />

    <CodeSnippet
      v-if="event.payload.context"
      class="preview-card__snippet"
      language="json"
      :code="event.payload.context"
    />

    <CodeSnippet
      class="preview-card__snippet"
      language="json"
      :code="event.payload.extra"
    />
  </PreviewCard>
</template>

<style lang="scss" scoped>
.preview-card {
  @apply text-xs break-all;
}

.preview-card__snippet {
  @apply relative bg-gray-200 dark:bg-gray-800 border-b-0 mt-0 text-white break-words;

  & + & {
    @apply border-t-2;
  }
}

.preview-card__snippet--interactive {
  @apply cursor-pointer;
}
</style>
