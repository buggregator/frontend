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
  <PreviewCard :event="event">
    <div class="monolog-body">
      <CodeSnippet
        class="monolog-body__snippet"
        :class="{ 'monolog-body__snippet--clickable': !isFullMessage }"
        :code="isFullMessage ? message : shortMessage"
        title="Click to show full message"
        @click="toggleView"
      />

      <CodeSnippet
        v-if="event.payload.context"
        class="monolog-body__snippet"
        language="json"
        :code="event.payload.context"
      />

      <CodeSnippet
        v-if="event.payload.extra"
        class="monolog-body__snippet"
        language="json"
        :code="event.payload.extra"
      />
    </div>
  </PreviewCard>
</template>

<style lang="scss" scoped>
.monolog-body {
  @apply flex flex-col gap-1 text-xs;
}

.monolog-body__snippet {
  @apply break-words;
}

.monolog-body__snippet--clickable {
  @apply cursor-pointer;
}
</style>
