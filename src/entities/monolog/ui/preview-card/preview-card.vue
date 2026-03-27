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

const hasContext = computed(() => {
  const ctx = props.event.payload.context
  if (!ctx) return false
  const keys = Object.keys(ctx).filter((k) => k !== 'source')
  return keys.length > 0
})

const hasExtra = computed(() => {
  const extra = props.event.payload.extra
  if (!extra) return false
  if (Array.isArray(extra)) return extra.length > 0
  return Object.keys(extra).length > 0
})
</script>

<template>
  <PreviewCard :event="event">
    <div class="monolog-body">
      <div class="monolog-block">
        <CodeSnippet
          :class="{ 'monolog-body__snippet--clickable': !isFullMessage }"
          :code="isFullMessage ? message : shortMessage"
          title="Click to show full message"
          @click="toggleView"
        />
      </div>

      <div
        v-if="hasContext"
        class="monolog-block"
      >
        <div class="monolog-block__header">
          context
        </div>
        <CodeSnippet
          language="json"
          :code="event.payload.context"
        />
      </div>

      <div
        v-if="hasExtra"
        class="monolog-block"
      >
        <div class="monolog-block__header">
          extra
        </div>
        <CodeSnippet
          language="json"
          :code="event.payload.extra"
        />
      </div>
    </div>
  </PreviewCard>
</template>

<style lang="scss" scoped>
.monolog-body {
  @apply flex flex-col gap-1.5 text-xs;
}

.monolog-block {
  @apply rounded overflow-hidden;
  @apply border border-gray-200 dark:border-gray-700;

  :deep(.code-snippet) {
    @apply rounded-none;
  }
}

.monolog-block__header {
  @apply flex items-center px-3 py-1.5;
  @apply bg-gray-50 dark:bg-gray-900;
  @apply border-b border-gray-200 dark:border-gray-700;
  @apply text-2xs font-medium text-gray-500 dark:text-gray-400;
}

.monolog-body__snippet--clickable {
  @apply cursor-pointer;
}
</style>
