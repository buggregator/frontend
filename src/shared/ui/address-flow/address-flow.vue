<script lang="ts" setup>
// «from → to» on a message card (SMS numbers, email addresses).
type Props = {
  from?: string | null
  to?: string | null
}

defineProps<Props>()
</script>

<template>
  <div
    v-if="from || to"
    class="address-flow"
  >
    <span
      v-if="from"
      class="address-flow__pill"
    >{{ from }}</span>

    <svg
      v-if="from && to"
      class="address-flow__arrow"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <line
        x1="5"
        y1="12"
        x2="19"
        y2="12"
      />
      <polyline points="12 5 19 12 12 19" />
    </svg>

    <span
      v-if="to"
      class="address-flow__pill"
    >{{ to }}</span>
  </div>
</template>

<style lang="scss" scoped>
.address-flow {
  @apply flex items-center gap-1.5 text-xs flex-wrap;
}

.address-flow__pill {
  @apply inline-flex items-center px-2 py-0.5 rounded-full;
  @apply font-mono text-2xs;
  @apply bg-gray-100 dark:bg-gray-800;
  @apply text-gray-600 dark:text-gray-300;
}

.address-flow__arrow {
  @apply w-3.5 h-3.5 flex-shrink-0;
  @apply text-gray-300 dark:text-gray-400;
}
</style>
