<script lang="ts" setup>
import { ref } from 'vue';
import { useEvents } from '@/shared/lib/use-events';
import type { RayContentLock } from '../../types';

type Props = {
  name: RayContentLock['name'];
};

const props = defineProps<Props>();

const disabled = ref(false);

const { rayExecution } = useEvents();

const continueExecution = () => {
  disabled.value = true;

  rayExecution.continue(props.name);
};

const stopExecution = () => {
  disabled.value = true;
  rayExecution.stop(props.name);
};

</script>

<template>
  <div class="ray-lock">
    <button
      :disabled="disabled"
      class="ray-lock__button ray-lock__button--continue"
      @click="continueExecution"
    >
      <span class="ray-lock__button-icon">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="100%"
          viewBox="0 0 20 20"
        >
          <path
            fill="green"
            fill-rule="evenodd"
            d="M16.75 10.83L4.55 19A1 1 0 0 1 3 18.13V1.87A1 1 0 0 1 4.55 1l12.2 8.13a1 1 0 0 1 0 1.7z"
          />
        </svg>
      </span>

      <span>Continue</span>
    </button>
    <button
      :disabled="disabled"
      class="ray-lock__button ray-lock__button--stop"
      @click="stopExecution"
    >
      <span class="ray-lock__button-text" />
      <span>Stop execution</span>
    </button>
  </div>
</template>

<style lang="scss" scoped>
.ray-lock {
  @apply flex items-center mt-3;
}

.ray-lock__button {
  @apply bg-gray-100 dark:bg-gray-800 hover:bg-gray-50;
  @apply focus:outline-none disabled:opacity-50;
  @apply px-5 py-2 space-x-3 text-sm font-medium ;
  @apply flex items-center;
  @apply border dark:border-gray-600;
}

.ray-lock__button--continue {
  @apply rounded-l-full;
}

.ray-lock__button--stop {
  @apply border-l-0 rounded-r-full;
}

.ray-lock__button-text {
  @apply w-3 h-3 bg-red-700 block;
}

.ray-lock__button-icon {
  @apply w-3 h-3 block;
}
</style>
