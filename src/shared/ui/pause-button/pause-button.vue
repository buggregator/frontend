<script lang="ts" setup>
import pluralize from "pluralize";
import { computed } from "vue";
import { IconSvg } from "../icon-svg";

type Props = {
  disabled: boolean;
  isPaused: boolean;
  totalNewEventsCount: number;
};

type Emits = {
  toggleUpdate: [value: boolean];
};

const emit = defineEmits<Emits>();
const props = defineProps<Props>();

const titleEventsCount = computed(() =>
  pluralize("new event", props.totalNewEventsCount, true)
);

const toggleUpdate = () => {
  emit("toggleUpdate", true);
};
</script>

<template>
  <button
    class="pause-button"
    :class="{ 'pause-button--active': isPaused }"
    :disabled="disabled"
    @click="toggleUpdate"
  >
    <IconSvg
      :name="!isPaused ? 'bolt' : 'bolt-slash'"
      class="pause-button__icon"
    />
    <span>{{ isPaused ? "Paused" : "Listening" }}</span>
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
@import "src/assets/mixins";

.pause-button {
  @include button;
  @apply bg-blue-400 dark:bg-gray-700 hover:bg-blue-500 dark:hover:bg-blue-800;
  @apply flex items-center space-x-1;
  @apply text-gray-800 dark:text-white hover:opacity-100 opacity-40 relative;
  @apply relative;

  &[disabled] {
    @apply bg-gray-400 dark:bg-gray-700 opacity-40 text-gray-400 cursor-not-allowed;
  }
}

.pause-button--active {
  @apply opacity-100 bg-blue-500 dark:bg-blue-800;
}

.pause-button__icon {
  @apply w-4 h-4 stroke-white animate-pulse;
}

.pause-button--active .pause-button__icon {
  @apply animate-none;
}

.pause-button__count {
  @apply absolute right-1 top-1 bg-red-600 text-white px-1 rounded-full flex justify-center;
  transform: translate(60%, -60%);
}
</style>
