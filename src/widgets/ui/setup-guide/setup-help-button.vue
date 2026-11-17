<script lang="ts" setup>
import { defineAsyncComponent, ref } from 'vue'

// «How to set up» in a section's header, when the section has events (#5941):
// an icon button, last in the header, the words in its tooltip (#5999).
type Props = {
  sectionId: string
  sectionTitle: string
}

defineProps<Props>()

const SetupHelpPanel = defineAsyncComponent(() => import('./setup-help-panel.vue'))
const isOpen = ref(false)
</script>

<template>
  <button
    type="button"
    class="setup-help-btn"
    :class="{ 'setup-help-btn--open': isOpen }"
    aria-label="How to set up"
    title="How to set up"
    aria-haspopup="dialog"
    :aria-expanded="isOpen"
    data-test="setup-help-button"
    @click="isOpen = true"
  >
    <!-- An open book (designer, #5999): the funnel's weight. -->
    <svg
      class="setup-help-btn__icon"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      aria-hidden="true"
    >
      <path
        d="M2.5 3.5h4a1.5 1.5 0 0 1 1.5 1.5v8a1 1 0 0 0-1-1h-4.5zM13.5 3.5h-4A1.5 1.5 0 0 0 8 5v8a1 1 0 0 1 1-1h4.5z"
        stroke-linejoin="round"
      />
    </svg>
  </button>
  <SetupHelpPanel
    v-if="isOpen"
    :section-id="sectionId"
    :section-title="sectionTitle"
    @close="isOpen = false"
  />
</template>

<style lang="scss" scoped>
// Same box as the Sentry filter button: 28 px square; on a phone a 44 px tap
// area with the same 28 px look (as Period).
.setup-help-btn {
  @apply inline-flex items-center justify-center w-7 h-7 rounded flex-shrink-0;
  @apply bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300;
  @apply hover:bg-gray-200 dark:hover:bg-gray-600;
  @apply transition-colors;
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:focus-visible:ring-blue-400;

  @media (max-width: 639px) {
    @apply w-11 h-11 -mt-1 -mb-3 p-2 bg-clip-content;
  }
}

.setup-help-btn--open {
  @apply bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100;
}

.setup-help-btn__icon {
  @apply w-3.5 h-3.5;
}
</style>
