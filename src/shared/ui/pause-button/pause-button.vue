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

const titleEventsCount = computed(() => pluralize(
  'new event',
  props.totalNewEventsCount,
  true,
));

const toggleUpdate = () => {
  emit(
    'toggleUpdate',
    true,
  );
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
  @apply bg-blue-300 dark:bg-gray-700;
  @apply hover:bg-blue-500 dark:hover:bg-blue-800;
  @apply text-gray-200 dark:text-white;

  &[disabled] {
    @apply bg-gray-400 text-white;
    @apply dark:bg-gray-700 dark:text-white;
    @apply opacity-50 cursor-not-allowed ;
  }
}

.pause-button--active {
  @apply opacity-100 text-white;
  @apply bg-blue-500 dark:bg-blue-800;
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
  @apply bg-red-600 text-white px-1 rounded-full;
  @apply absolute right-1 top-1;
  @apply flex justify-center;

  transform: translate(60%, -60%);
}
</style>
