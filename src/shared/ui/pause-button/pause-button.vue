<script lang="ts" setup>
import pluralize from 'pluralize'
import { computed } from 'vue'
import { IconSvg } from '../icon-svg'

type Props = {
  disabledPause: boolean
  isPaused: boolean
  totalNewEventsCount: number
}

type Emits = {
  toggleUpdate: [value: boolean]
}

const emit = defineEmits<Emits>()
const props = defineProps<Props>()

const titleEventsCount = computed(() => pluralize('new event', props.totalNewEventsCount, true))

const toggleUpdate = () => {
  emit('toggleUpdate', true)
}
</script>

<template>
  <button
    class="pause-btn"
    :class="{ 'pause-btn--paused': isPaused }"
    :disabled="!isPaused && disabledPause"
    @click="toggleUpdate"
  >
    <IconSvg
      :name="!isPaused ? 'bolt' : 'bolt-slash'"
      class="pause-btn__icon"
    />
    <span class="pause-btn__text">{{ isPaused ? 'Paused' : 'Listening' }}</span>
    <span
      v-if="isPaused && totalNewEventsCount"
      class="pause-btn__count"
      :title="titleEventsCount"
    >
      {{ totalNewEventsCount }}
    </span>
  </button>
</template>

<style lang="scss" scoped>
.pause-btn {
  @apply h-7 flex items-center gap-1.5 px-2.5 rounded;
  @apply text-xs font-medium;
  @apply text-green-600 dark:text-green-400;
  @apply bg-green-50 dark:bg-green-500/10;
  @apply hover:bg-green-100 dark:hover:bg-green-500/20;
  @apply transition-colors cursor-pointer;

  &[disabled] {
    @apply opacity-40 cursor-not-allowed;
    @apply text-gray-500 dark:text-gray-500;
    @apply bg-gray-100 dark:bg-gray-700;
  }
}

.pause-btn--paused {
  @apply text-amber-600 dark:text-amber-400;
  @apply bg-amber-50 dark:bg-amber-500/10;
  @apply hover:bg-amber-100 dark:hover:bg-amber-500/20;
}

.pause-btn__icon {
  @apply w-3.5 h-3.5;
  @apply stroke-current;

  .pause-btn:not(.pause-btn--paused):not([disabled]) & {
    @apply animate-pulse;
  }
}

.pause-btn__text {
  @apply hidden sm:inline;
}

.pause-btn__count {
  @apply text-[10px] font-mono leading-none;
  @apply px-1 py-0.5 rounded-full;
  @apply bg-amber-200 dark:bg-amber-500/20;
  @apply text-amber-700 dark:text-amber-300;
}
</style>
