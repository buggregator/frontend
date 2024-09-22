<script lang="ts" setup>
import { computed, defineProps, withDefaults } from "vue"
import type { SentryException } from "../../types"
import SentryExceptionFrame from "./sentry-exception-frame.vue"

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
  <div class="sentry-exception">
    <slot>
      <header class="sentry-exception__header">
        <h3 class="sentry-exception__title">
          {{ exception.type }}
        </h3>

        <pre class="sentry-exception__text">{{ exception.value }}</pre>
      </header>
    </slot>

    <div
      v-if="exceptionFrames.length"
      class="sentry-exception__frames"
    >
      <SentryExceptionFrame
        v-for="(frame, index) in exceptionFrames"
        :key="`${frame.context_line}-${frame.filename}`"
        :frame="frame"
        :is-open="index === 0"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import "src/assets/mixins";

.sentry-exception {
  @apply flex flex-col;
}

.sentry-exception__link {
  @apply cursor-pointer pb-2 flex-grow;
}

.sentry-exception__header {
  @apply dark:bg-gray-900 bg-gray-100 p-3 rounded-t-md border border-purple-300 dark:border-gray-500 border-b-0;
}

.sentry-exception__title {
  @apply mb-3 font-semibold text-lg;
}

.sentry-exception__text {
  @include code-example();
  @apply text-sm break-words whitespace-pre-wrap rounded text-opacity-60;
}

.sentry-exception__frames {
  @apply flex-col justify-center w-full border border-purple-300 dark:border-gray-500 border-t-0 rounded-b-md overflow-hidden;
}
</style>
