<script lang="ts" setup>
import pluralize from 'pluralize';
import { computed } from 'vue';
import { IconSvg } from '../icon-svg';

type Props = {
  disabledPause: boolean;
  isPaused: boolean;
  totalNewEventsCount: number;
};

type Emits = {
  toggleUpdate: [value: boolean];
};

const emit = defineEmits<Emits>();
const props = defineProps<Props>();

const titleEventsCount = computed(() => pluralize('new event', props.totalNewEventsCount, true));

const toggleUpdate = () => {
  emit('toggleUpdate', true);
};
</script>

<template>
  <button
    class="pause-button"
    :class="{ 'pause-button--active': isPaused }"
    :disabled="!isPaused && disabledPause"
    @click="toggleUpdate"
  >
    <IconSvg
      :name="!isPaused ? 'bolt' : 'bolt-slash'"
      class="pause-button__icon"
    />
    <span>{{ isPaused ? 'Paused' : 'Listening' }}</span>
    <span
      v-if="isPaused && totalNewEventsCount"
      class="pause-button__count"
      :title="titleEventsCount"
    >
      {{ totalNewEventsCount }}
    </span>
  </button>
</template>

<style lang="scss" scoped>
@import 'src/assets/mixins';

.pause-button {
  @include button;
  @apply flex items-center space-x-1 relative;
  @apply bg-blue-300 hover:bg-blue-500 text-gray-200;
  @apply dark:bg-gray-700 dark:hover:bg-blue-800 dark:text-white;

  &[disabled] {
    @apply bg-gray-400 opacity-50 cursor-not-allowed text-white;
    @apply dark:bg-gray-700 dark:text-white;
  }
}

.pause-button--active {
  @apply opacity-100 bg-blue-500 dark:bg-blue-800 text-white;
}

.pause-button__icon {
  @apply w-4 h-4 stroke-white animate-pulse;

  [disabled] > & {
    @apply animate-none;
  }
}

.pause-button__icon {
  .pause-button--active & {
    @apply animate-none;
  }
}

.pause-button__count {
  @apply absolute right-1 top-1 bg-red-600 text-white px-1 rounded-full flex justify-center;
  transform: translate(60%, -60%);
}
</style>
