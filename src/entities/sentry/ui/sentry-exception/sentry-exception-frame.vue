<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useIdeLink } from '@/shared/lib/helpers/use-ide-link'
import { IconSvg } from '@/shared/ui'
import type { SentryFrame } from '../../types'

type Props = {
  frame: SentryFrame
  isOpen: boolean
}

const props = defineProps<Props>()
const isFrameOpen = ref(props.isOpen)
const { buildLink } = useIdeLink()

const ideLink = computed(() => buildLink(props.frame.filename, props.frame.lineno))

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
    class="frame"
    :class="{ 'frame--empty': !hasBody }"
  >
    <div
      class="frame__head"
      @click="toggleOpen"
    >
      <div class="frame__title">
        <a
          v-if="ideLink"
          :href="ideLink"
          class="frame__fn frame__fn--link"
          @click.stop
        >{{
          frame.filename
        }}</a>
        <span
          v-else
          class="frame__fn"
        >{{ frame.filename }}</span>
        <span
          v-if="frame.function"
          class="frame__meta"
        >
          in {{ frame.function }} at line {{ frame.lineno }}
        </span>
      </div>

      <IconSvg
        v-if="hasBody"
        class="frame__chevron"
        :class="{ 'frame__chevron--open': isFrameOpen }"
        name="collapsed"
      />
    </div>

    <div
      v-if="isFrameOpen && hasBody"
      class="frame__body"
    >
      <template v-if="frame.pre_context">
        <div
          v-for="(line, i) in frame.pre_context"
          :key="i"
          class="frame__line"
        >
          <span class="frame__line-num">{{
            (frame?.lineno ?? 0) - (frame.pre_context.length - i)
          }}</span>
          <pre class="frame__line-code">{{ line }}</pre>
        </div>
      </template>

      <div
        v-if="frame.context_line"
        class="frame__line frame__line--active"
      >
        <span class="frame__line-num">{{ frame.lineno }}</span>
        <pre class="frame__line-code">{{ frame.context_line }}</pre>
      </div>

      <template v-if="frame.post_context">
        <div
          v-for="(line, i) in frame.post_context"
          :key="i"
          class="frame__line"
        >
          <span class="frame__line-num">{{ (frame?.lineno ?? 0) + i + 1 }}</span>
          <pre class="frame__line-code">{{ line }}</pre>
        </div>
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.frame {
  @apply text-xs;
  @apply border-b border-gray-200 dark:border-gray-700;

  &:last-child {
    @apply border-b-0;
  }
}

.frame__head {
  @apply py-2 px-3 flex justify-between items-start gap-2 cursor-pointer;
  @apply bg-gray-50 dark:bg-gray-800/50;
  @apply hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors;

  .frame--empty & {
    @apply cursor-default;
  }
}

.frame__title {
  @apply flex flex-col gap-0.5;
}

.frame__fn {
  @apply font-semibold text-gray-800 dark:text-gray-200 break-all;
}

.frame__fn--link {
  @apply text-blue-600 dark:text-blue-400 hover:underline cursor-pointer;
}

.frame__meta {
  @apply text-gray-400 dark:text-gray-500 text-2xs;
}

.frame__chevron {
  @apply w-4 h-4 flex-shrink-0 text-gray-400 dark:text-gray-500;
  transition: transform 0.15s ease;
}

.frame__chevron--open {
  transform: rotate(180deg);
}

.frame__body {
  @apply bg-gray-900 p-2 overflow-x-auto font-mono;
}

.frame__line {
  @apply flex text-gray-400;
}

.frame__line--active {
  @apply bg-blue-900/50 text-gray-100;
}

.frame__line-num {
  @apply w-10 text-right pr-3 select-none text-gray-600 flex-shrink-0;
}

.frame__line-code {
  @apply flex-1;
}
</style>
