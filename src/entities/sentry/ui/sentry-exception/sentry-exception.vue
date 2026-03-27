<script lang="ts" setup>
import { computed, withDefaults } from 'vue'
import type { SentryException } from '../../types'
import SentryExceptionFrame from './sentry-exception-frame.vue'

type Props = {
  exception: SentryException
  maxFrames?: number
}

const props = withDefaults(defineProps<Props>(), {
  maxFrames: 0
})

const exceptionFrames = computed(() => {
  const frames = props.exception?.stacktrace?.frames || []

  if (props.maxFrames > 0) {
    return frames.slice(0 - props.maxFrames).reverse()
  }

  return frames.slice().reverse()
})
</script>

<template>
  <div class="exception">
    <slot>
      <header class="exception__header">
        <h3 class="exception__title">
          {{ exception.type }}
        </h3>
        <pre class="exception__message">{{ exception.value }}</pre>

        <div
          v-if="exception.mechanism"
          class="exception__mechanism"
        >
          <span class="exception__mechanism-type">{{ exception.mechanism.type }}</span>
          <span
            v-if="exception.mechanism.handled !== undefined"
            class="exception__mechanism-handled"
            :class="exception.mechanism.handled ? 'exception__mechanism-handled--yes' : 'exception__mechanism-handled--no'"
          >
            {{ exception.mechanism.handled ? 'Handled' : 'Unhandled' }}
          </span>
        </div>
      </header>
    </slot>

    <div
      v-if="exceptionFrames.length"
      class="exception__frames"
    >
      <template
        v-for="(frame, index) in exceptionFrames"
        :key="frame.context_line + frame.filename"
      >
        <SentryExceptionFrame
          :frame="frame"
          :is-open="index === 0"
        />
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.exception {
  @apply flex flex-col rounded overflow-hidden;
  @apply border border-gray-200 dark:border-gray-700;
}

.exception__header {
  @apply bg-gray-50 dark:bg-gray-900 p-3;
}

.exception__title {
  @apply mb-2 font-semibold text-sm;
}

.exception__message {
  @apply text-xs break-words whitespace-pre-wrap;
  @apply p-2 rounded font-mono;
  @apply bg-gray-100 dark:bg-gray-800;
  @apply text-gray-600 dark:text-gray-300;
}

.exception__mechanism {
  @apply flex items-center gap-2 mt-2;
}

.exception__mechanism-type {
  @apply text-2xs font-mono px-1.5 py-0.5 rounded;
  @apply bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400;
}

.exception__mechanism-handled--yes {
  @apply text-2xs font-semibold px-1.5 py-0.5 rounded;
  @apply bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400;
}

.exception__mechanism-handled--no {
  @apply text-2xs font-semibold px-1.5 py-0.5 rounded;
  @apply bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400;
}

.exception__frames {
  @apply flex flex-col;
  @apply border-t border-gray-200 dark:border-gray-700;
}
</style>
