<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { useServerUpdateStore } from '@/entities/server-update/lib'
import { RouteName } from '@/shared/types'

// In the header while the server updates itself: «Updating 42%» or
// «Restarting…», a link to Settings › About & updates.
const { indicator } = storeToRefs(useServerUpdateStore())
</script>

<template>
  <RouterLink
    v-if="indicator"
    :to="{ name: RouteName.Settings, hash: '#updates' }"
    class="update-pill"
    :class="{ 'update-pill--restarting': indicator.restarting }"
    :aria-label="indicator.ariaLabel"
    data-test="update-pill"
  >
    <span
      class="update-pill__spinner"
      aria-hidden="true"
    />
    <span class="update-pill__label">{{ indicator.label }}</span>
    <span
      v-if="indicator.percent !== null"
      class="update-pill__percent"
    >{{ indicator.percent }}%</span>
  </RouterLink>
</template>

<style lang="scss" scoped>
.update-pill {
  @apply relative inline-flex items-center gap-1.5 flex-none;
  @apply min-h-[28px] px-2.5 py-0.5 rounded-full border whitespace-nowrap;
  @apply text-xs font-medium no-underline;
  @apply text-gray-800 bg-white border-gray-300;
  @apply dark:text-gray-100 dark:bg-gray-800 dark:border-gray-600;
  @apply hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors;
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:focus-visible:ring-blue-400;

  // Phones: 32 px to see, 44 px to touch; the word goes, the percent stays.
  @media (max-width: 639px) {
    @apply min-h-[32px] min-w-[44px] justify-center;

    &::after {
      content: '';
      position: absolute;
      // The pill sits 2 px under the top edge: up to it, and down to 44 px.
      inset: -2px -4px -11px;
    }
  }
}

.update-pill--restarting {
  @apply text-amber-700 bg-amber-50 border-amber-300;
  @apply dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-400/40;
}

.update-pill__label {
  @media (max-width: 639px) {
    @apply sr-only;
  }
}

.update-pill__percent {
  @apply font-mono text-[11.5px] tabular-nums;
}

.update-pill__spinner {
  @apply inline-block flex-none rounded-full;
  width: 11px;
  height: 11px;
  border: 1.5px solid currentColor;
  border-top-color: transparent;
  animation: update-pill-spin 0.9s linear infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
}

@keyframes update-pill-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
