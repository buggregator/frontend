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
    class="events-page__btn-stop-events"
    :class="{ 'events-page__btn-stop-events--active': isPaused }"
    :disabled="disabled"
    @click="toggleUpdate"
  >
    <IconSvg
      v-if="!isPaused"
      name="bolt"
      class="events-page__btn-stop-events-icon"
    />
    <IconSvg
      v-if="isPaused"
      name="bolt-slash"
      class="events-page__btn-stop-events-icon"
    />
    <span>{{ isPaused ? "Paused" : "Listening" }}</span>
    <span
      v-if="isPaused && totalNewEventsCount"
      class="events-page__btn-stop-events-count"
      :title="titleEventsCount"
    >
      {{ totalNewEventsCount }}
    </span>
  </button>
</template>

<style lang="scss" scoped>
@import "assets/mixins";

.events-page__btn-stop-events--active .events-page__btn-stop-events-icon {
  @apply animate-none;
}

.events-page__btn-stop-events-count {
  @apply absolute right-1 top-1 bg-red-600 text-white px-1 rounded-full flex justify-center;

  transform: translate(60%, -60%);
}

.events-page__btn-stop-events {
  @include button;
  @apply bg-blue-400 dark:bg-gray-700 hover:bg-blue-500 dark:hover:bg-blue-800;
  @apply flex items-center space-x-1;
  @apply text-gray-800 dark:text-white hover:opacity-100 opacity-40 relative;
  @apply relative;

  &[disabled] {
    @apply bg-gray-400 dark:bg-gray-700 opacity-40 text-gray-400 cursor-not-allowed;
  }
}

.events-page__btn-stop-events--active {
  @apply opacity-100 bg-blue-500 dark:bg-blue-800;
}

.events-page__btn-stop-events-icon {
  @apply w-3 h-3 sm:w-4 sm:h-4 stroke-white animate-pulse;
}

.events-page__btn-stop-events-count {
  @apply absolute right-0 bottom-0 bg-red-600 text-white w-4 h-4 rounded-full flex justify-center;

  transform: translate(60%, -60%);
}
</style>
