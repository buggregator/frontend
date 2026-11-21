<script lang="ts" setup>
import { computed } from 'vue'
import { broadcastProblems, PROBLEM_ICON } from '../../lib/payload'
import type { BroadcastPayload } from '../../types'

// What a real Pusher or Reverb would drop or refuse, said in the event itself:
// an icon (✕ ! i), a border and the words.
const props = defineProps<{ payload: BroadcastPayload }>()

const problems = computed(() => broadcastProblems(props.payload))
</script>

<template>
  <ul
    v-if="problems.length"
    class="bc-problems"
  >
    <li
      v-for="p in problems"
      :key="p.text"
      class="bc-problems__item"
      :class="`bc-problems__item--${p.tone}`"
    >
      <span
        class="bc-problems__icon"
        aria-hidden="true"
      >{{ PROBLEM_ICON[p.tone] }}</span>
      <span>
        <span class="sr-only">{{ p.tone }}: </span>{{ p.text }}
      </span>
    </li>
  </ul>
</template>

<style lang="scss" scoped>
.bc-problems {
  @apply flex flex-col gap-1.5;
}

.bc-problems__item {
  @apply flex items-start gap-2 px-2.5 py-1.5 rounded border text-xs;
  @apply text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600;
}

.bc-problems__icon {
  @apply font-mono font-bold flex-none;
  font-size: 12px;
}

.bc-problems__item--error {
  border-color: var(--bc-err);

  .bc-problems__icon {
    color: var(--bc-err);
  }
}

.bc-problems__item--warning {
  border-color: var(--bc-warn);

  .bc-problems__icon {
    color: var(--bc-warn);
  }
}

.bc-problems__item--info .bc-problems__icon {
  color: var(--bc-info);
}
</style>
