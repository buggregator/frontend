<script lang="ts" setup>
import type { StepState, StepView } from '../../lib/update-view'
import { UpdateIcon } from '../update-icon'

defineProps<{ steps: StepView[] }>()

// Read after the step name, so the state is never told by colour alone.
const SR_STATE: Record<StepState, string> = {
  waiting: 'waiting',
  now: 'in progress',
  done: 'done',
  failed: 'failed'
}
</script>

<template>
  <ol
    class="update-steps"
    aria-label="Update steps"
  >
    <li
      v-for="step in steps"
      :key="step.id"
      class="update-steps__step"
      :class="`update-steps__step--${step.state}`"
      :data-step="step.id"
      :data-state="step.state"
    >
      <span
        class="update-steps__mark"
        aria-hidden="true"
      >
        <UpdateIcon
          v-if="step.state === 'done'"
          name="check"
          class="update-steps__mark-icon"
        />
        <UpdateIcon
          v-else-if="step.state === 'failed'"
          name="x"
          class="update-steps__mark-icon"
        />
      </span>
      <span>{{ step.label }}<span class="sr-only">: {{ SR_STATE[step.state] }}</span></span>
      <span class="update-steps__aux">{{ step.aux }}</span>
    </li>
  </ol>
</template>

<style lang="scss" scoped>
.update-steps {
  @apply flex flex-col gap-0.5 m-0 p-0 list-none;
}

.update-steps__step {
  @apply grid items-center gap-2.5 py-1.5 text-[13px];
  @apply text-gray-500 dark:text-gray-400;
  grid-template-columns: 20px minmax(0, 1fr) auto;
}

.update-steps__mark {
  @apply w-[18px] h-[18px] rounded-full grid place-items-center;
  @apply border-[1.5px] border-gray-300 dark:border-gray-600;
}

.update-steps__mark-icon {
  @apply w-3 h-3;
  stroke-width: 2.5;
}

.update-steps__step--done {
  @apply text-gray-700 dark:text-gray-300;

  .update-steps__mark {
    @apply border-green-700 text-green-700 dark:border-green-400 dark:text-green-400;
  }
}

.update-steps__step--now {
  @apply font-medium text-gray-900 dark:text-gray-100;

  .update-steps__mark {
    @apply border-blue-700 dark:border-blue-400;
    border-top-color: transparent !important;
    animation: update-steps-spin 0.9s linear infinite;
  }
}

.update-steps__step--failed {
  @apply font-medium text-red-700 dark:text-red-400;

  .update-steps__mark {
    @apply border-red-700 text-red-700 dark:border-red-400 dark:text-red-400;
  }
}

.update-steps__aux {
  @apply font-mono text-xs text-gray-500 dark:text-gray-400 text-right;
}

@keyframes update-steps-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .update-steps__step--now .update-steps__mark {
    animation: none;
  }
}
</style>
