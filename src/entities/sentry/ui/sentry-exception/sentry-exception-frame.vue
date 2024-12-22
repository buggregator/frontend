<script lang="ts" setup>
import { computed, ref } from 'vue'
import { IconSvg } from '@/shared/ui'
import type { SentryFrame } from '../../types'

type Props = {
  frame: SentryFrame
  isOpen: boolean
}

const props = defineProps<Props>()
const isFrameOpen = ref(props.isOpen)

const hasBody = computed(() =>
  Boolean(props.frame.context_line || props.frame.post_context || props.frame.pre_context)
)

const toggleOpen = () => {
  if (hasBody.value) {
    isFrameOpen.value = !isFrameOpen.value
  }
}
</script>

<template>
  <div
    class="sentry-exception-frame"
    :class="{ 'sentry-exception-frame--empty': !hasBody }"
  >
    <div
      class="sentry-exception-frame__head"
      @click="toggleOpen"
    >
      <div class="sentry-exception-frame__head-title">
        {{ frame.filename }}

        <span v-if="frame.function"> in {{ frame.function }} at line </span>

        {{ frame.lineno }}
      </div>

      <IconSvg
        v-if="frame.pre_context"
        class="sentry-exception-frame__head-title-dd"
        :class="{
          'sentry-exception-frame__head-title-dd--visible': isFrameOpen
        }"
        name="dd"
      />
    </div>

    <div
      v-if="isFrameOpen && hasBody"
      class="sentry-exception-frame__body"
    >
      <template v-if="frame.pre_context">
        <div
          v-for="(line, i) in frame.pre_context"
          :key="line"
          class="sentry-exception-frame__body-line"
        >
          <div class="sentry-exception-frame__body-line-position">
            {{ (frame?.lineno ?? 0) - (frame.pre_context.length - i) }}.
          </div>

          <pre class="sentry-exception-frame__body-line-content">{{ line }}</pre>
        </div>
      </template>

      <div
        v-if="frame.context_line"
        class="sentry-exception-frame__body-line sentry-exception-frame__body-line--selection"
      >
        <div class="sentry-exception-frame__body-line-position">
          {{ frame.lineno }}.
        </div>

        <pre>{{ frame.context_line }}</pre>
      </div>

      <template v-if="frame.post_context">
        <div
          v-for="(line, i) in frame.post_context"
          :key="line"
          class="sentry-exception-frame__body-line"
        >
          <div class="sentry-exception-frame__body-line-position">
            {{ (frame?.lineno ?? 0) + i + 1 }}.
          </div>

          <pre class="sentry-exception-frame__body-line-content">{{ line }}</pre>
        </div>
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import 'src/assets/mixins';

.sentry-exception-frame {
  @apply text-xs border-b border-purple-200 dark:border-gray-600;
}

.sentry-exception-frame__head {
  @apply bg-purple-50 dark:bg-gray-800 py-2 px-3 flex space-x-2 justify-between items-start cursor-pointer;

  .sentry-exception-frame--empty & {
    @apply cursor-default;
  }
}

.sentry-exception-frame__head-title {
  @include text-muted;
  @apply break-all font-semibold;
}

.sentry-exception-frame__head-title-info {
  @apply text-gray-400;
}

.sentry-exception-frame__head-title-dd {
  @apply w-5 h-4 flex justify-center shadow py-1 rounded transform rotate-180;
}

.sentry-exception-frame__head-title-dd--visible {
  @apply rotate-0;
}

.sentry-exception-frame__body {
  @include code-example();
  @apply overflow-x-scroll;
}

.sentry-exception-frame__body-line {
  @apply flex;
}

.sentry-exception-frame__body-line--selection {
  @apply bg-pink-800 text-white;
}

.sentry-exception-frame__body-line-position {
  @include text-muted;
  @apply w-12 select-none;

  .sentry-exception-frame__body-line--selection & {
    @apply text-white;
  }
}

.sentry-exception-frame__body-line-content {
  @apply text-gray-100;
}
</style>
