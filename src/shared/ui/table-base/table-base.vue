<script lang="ts" setup></script>

<template>
  <div class="table-base">
    <slot />
  </div>
</template>

<style lang="scss" scoped>
.table-base {
  @apply rounded overflow-hidden text-sm;
  @apply border border-gray-200 dark:border-gray-700;
  @apply divide-y divide-gray-200 dark:divide-gray-700;
}
</style>
