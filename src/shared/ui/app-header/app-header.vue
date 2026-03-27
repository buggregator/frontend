<script lang="ts" setup>
</script>

<template>
  <header class="header">
    <nav class="header__nav">
      <slot />
    </nav>

    <div class="header__actions">
      <slot name="controls" />
    </div>
  </header>
</template>

<style lang="scss" scoped>
.header {
  @apply flex items-center justify-between h-full px-1;
}

.header__nav {
  @apply hidden sm:flex items-center;
  @apply text-sm text-gray-500 dark:text-gray-400;
}

.header__actions {
  @apply flex items-center gap-1.5;
}

.header__action-btn {
  @apply h-7 w-7 flex items-center justify-center rounded;
  @apply text-gray-500 dark:text-gray-400;
  @apply bg-gray-100 dark:bg-gray-700;
  @apply hover:text-gray-700 dark:hover:text-gray-200;
  @apply hover:bg-gray-200 dark:hover:bg-gray-600;
  @apply transition-colors cursor-pointer;
}

.header__action-icon {
  @apply w-4 h-4;
}
</style>
