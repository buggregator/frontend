<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { computed, defineAsyncComponent, ref } from 'vue'
import { useEvents } from '@/shared/lib/use-events'
import { useSettingsStore } from '@/shared/stores'
import type { NormalizedEvent } from '@/shared/types'
import { PreviewCard, CodeSnippet } from '@/shared/ui'
import { useMonologInlineDetails } from '../../lib'
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

// Loaded only when the setting is on: the feed's first load stays as it was.
const JsonTreeView = defineAsyncComponent(() => import('@/shared/ui/json-tree-view').then((m) => m.JsonTreeView))

// Context and extra under the message, only with the setting on (frontend#283).
const { isMonologInlineContext } = storeToRefs(useSettingsStore())
const { events } = useEvents()
const { context, extra, isShown, isContextBig, isExtraBig } = useMonologInlineDetails(
  props.event.id,
  props.event.payload,
  isMonologInlineContext,
  (id) => events.getItem(id),
)
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

      <template v-if="isShown">
        <div
          v-if="context"
          class="monolog-block"
        >
          <div class="monolog-block__header">
            context
          </div>
          <JsonTreeView
            :value="context"
            :open-depth="isContextBig ? -1 : 1"
          />
        </div>

        <div
          v-if="extra"
          class="monolog-block"
        >
          <div class="monolog-block__header">
            extra
          </div>
          <JsonTreeView
            :value="extra"
            :open-depth="isExtraBig ? -1 : 1"
          />
        </div>
      </template>
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
