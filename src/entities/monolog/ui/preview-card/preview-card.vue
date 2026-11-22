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
      <!-- The snippet has its own frame: no second one around it. -->
      <CodeSnippet
        :class="{ 'monolog-body__snippet--clickable': !isFullMessage }"
        :code="isFullMessage ? message : shortMessage"
        title="Click to show full message"
        @click="toggleView"
      />

      <template v-if="isShown">
        <!-- Flat in the card: a label and the tree, no box of their own. -->
        <section
          v-if="context"
          class="monolog-details"
          aria-label="Context"
        >
          <div class="monolog-details__label">
            context
          </div>
          <JsonTreeView
            class="monolog-details__tree"
            :value="context"
            :open-depth="isContextBig ? -1 : 1"
          />
        </section>

        <section
          v-if="extra"
          class="monolog-details"
          aria-label="Extra"
        >
          <div class="monolog-details__label">
            extra
          </div>
          <JsonTreeView
            class="monolog-details__tree"
            :value="extra"
            :open-depth="isExtraBig ? -1 : 1"
          />
        </section>
      </template>
    </div>
  </PreviewCard>
</template>

<style lang="scss" scoped>
.monolog-body {
  @apply flex flex-col gap-1.5 text-xs;
}

.monolog-details {
  @apply pt-1.5;
  @apply border-t border-gray-200 dark:border-gray-700;
}

.monolog-details__label {
  @apply text-2xs font-medium text-gray-500 dark:text-gray-400;
}

/* The shared tree draws a framed box by default; in the card it sits flat. */
.monolog-details__tree.json-tree-view {
  padding: 4px 0 0;
  border: 0;
  border-radius: 0;
  background: transparent;
}

.monolog-body__snippet--clickable {
  @apply cursor-pointer;
}
</style>
