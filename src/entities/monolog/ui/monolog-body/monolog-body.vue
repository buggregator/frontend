<script lang="ts" setup>
import { defineAsyncComponent } from 'vue'
import { CodeSnippet } from '@/shared/ui'

// One framed box for a log record: the message, then context and extra
// under thin dividers. The feed card and the event page show the same box
// (frontend#283).
type Props = {
  message: string
  context?: unknown
  extra?: unknown
  // How far each tree starts open (-1: folded to its top keys).
  contextDepth?: number
  extraDepth?: number
  // The message is cut: a click on it shows all of it.
  messageClickable?: boolean
}

withDefaults(defineProps<Props>(), {
  context: undefined,
  extra: undefined,
  contextDepth: 1,
  extraDepth: 1,
  messageClickable: false,
})

const emit = defineEmits<{ 'message-click': [] }>()

// Loaded only when there is context to show: the feed's first load stays as it was.
const JsonTreeView = defineAsyncComponent(() => import('@/shared/ui/json-tree-view').then((m) => m.JsonTreeView))
</script>

<template>
  <div class="monolog-box">
    <CodeSnippet
      class="monolog-box__message"
      :class="{ 'monolog-box__message--clickable': messageClickable }"
      :code="message"
      :title="messageClickable ? 'Click to show full message' : undefined"
      @click="emit('message-click')"
    />

    <section
      v-if="context"
      class="monolog-box__part"
      aria-label="Context"
    >
      <div class="monolog-box__label">
        context
      </div>
      <JsonTreeView
        class="monolog-box__tree"
        :value="context"
        :open-depth="contextDepth"
      />
    </section>

    <section
      v-if="extra"
      class="monolog-box__part"
      aria-label="Extra"
    >
      <div class="monolog-box__label">
        extra
      </div>
      <JsonTreeView
        class="monolog-box__tree"
        :value="extra"
        :open-depth="extraDepth"
      />
    </section>
  </div>
</template>

<style lang="scss" scoped>
/* The frame the message snippet had, now around all three parts. */
.monolog-box {
  @apply rounded overflow-hidden text-xs;
  @apply bg-gray-50 dark:bg-gray-900;
  @apply border border-gray-200 dark:border-gray-700;
}

/* The snippet and the trees draw their own framed box by default; inside
   this one they sit flat. */
.monolog-box__message.code-snippet,
.monolog-box__tree.json-tree-view {
  border: 0;
  border-radius: 0;
  background: transparent;
}

.monolog-box__message--clickable {
  @apply cursor-pointer;
}

.monolog-box__part {
  @apply px-4 pt-2 pb-3;
  @apply border-t border-gray-200 dark:border-gray-700;
}

.monolog-box__label {
  @apply text-2xs font-medium text-gray-500 dark:text-gray-400;
}

.monolog-box__tree.json-tree-view {
  padding: 4px 0 0;
}
</style>
