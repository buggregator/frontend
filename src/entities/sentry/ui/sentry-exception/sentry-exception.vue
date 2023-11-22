<script lang="ts" setup>
import { computed, defineProps, withDefaults } from "vue";
import { SentryException } from "../../types";
import SentryExceptionFrame from "./sentry-exception-frame.vue";

type Props = {
  exception: SentryException;
  maxFrames?: number;
};

const props = withDefaults(defineProps<Props>(), {
  maxFrames: 3,
});

const exceptionFrames = computed(() => {
  const frames = props.exception.stacktrace.frames || [];

  if (props.maxFrames > 0) {
    return frames.reverse().slice(0, props.maxFrames);
  }

  return frames;
});
</script>

<template>
  <div class="sentry-exception">
    <slot>
      <h3 class="sentry-exception__title">
        {{ exception.type }}
      </h3>

      <pre class="sentry-exception__text" v-html="exception.value" />
    </slot>

    <div v-if="exceptionFrames.length" class="sentry-exception__frames">
      <template
        v-for="(frame, index) in exceptionFrames"
        :key="frame.context_line"
      >
        <SentryExceptionFrame :frame="frame" :is-open="index === 0" />
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import "assets/mixins";

.sentry-exception {
  @apply flex flex-col;
}

.sentry-exception__link {
  @apply cursor-pointer pb-2 flex-grow;
}

.sentry-exception__text {
  @include text-muted;
  @apply text-sm break-all mb-3 p-3 dark:bg-gray-800;
}

.sentry-exception__title {
  @apply mb-3 font-semibold;
}

.sentry-exception__text {
  @include text-muted;
  @apply text-sm break-all mb-3 p-3 dark:bg-gray-800;
}

.sentry-exception__frames {
  @apply border border-purple-200 dark:border-gray-600 flex-col justify-center w-full;
}
</style>
