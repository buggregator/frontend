<script lang="ts" setup>
import { defineAsyncComponent, ref } from 'vue'
import { IconSvg } from '@/shared/ui'

// «How to set up» in a section's header, when the section has events (#5941).
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
    :aria-label="`How to set up ${sectionTitle}`"
    aria-haspopup="dialog"
    :aria-expanded="isOpen"
    data-test="setup-help-button"
    @click="isOpen = true"
  >
    <IconSvg
      name="docs"
      class="setup-help-btn__icon"
    />
    <span class="setup-help-btn__text">How to set up</span>
  </button>
  <SetupHelpPanel
    v-if="isOpen"
    :section-id="sectionId"
    :section-title="sectionTitle"
    @close="isOpen = false"
  />
</template>

<style lang="scss" scoped>
.setup-help-btn {
  @apply inline-flex items-center gap-1.5 h-7 px-2.5 rounded text-xs font-medium flex-shrink-0;
  @apply bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300;
  @apply hover:bg-gray-200 dark:hover:bg-gray-600;
  @apply transition-colors;
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:focus-visible:ring-blue-400;

  @media (max-width: 639px) {
    @apply justify-center w-11 h-11 px-0 bg-transparent dark:bg-transparent;
  }
}

.setup-help-btn--open {
  @apply bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100;
}

.setup-help-btn__icon {
  @apply w-3.5 h-3.5;

  @media (max-width: 639px) {
    @apply w-[18px] h-[18px];
  }
}

.setup-help-btn__text {
  @media (max-width: 639px) {
    @apply sr-only;
  }
}
</style>
