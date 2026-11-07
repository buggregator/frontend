<script lang="ts" setup>
// `keepTitle`: the page name stays on phones too (it is hidden there by default).
defineProps<{ keepTitle?: boolean }>()
</script>

<template>
  <header class="header">
    <nav
      class="header__nav"
      :class="{ 'header__nav--keep': keepTitle }"
      aria-label="Breadcrumb"
    >
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

.header__nav--keep {
  @apply flex min-w-0;
}

.header__actions {
  @apply flex items-center gap-1.5;
}

.header__action-btn {
  @apply h-7 w-7 flex items-center justify-center rounded;
  @apply text-gray-600 dark:text-gray-300;
  @apply bg-gray-100 dark:bg-gray-700;
  @apply hover:text-gray-700 dark:hover:text-gray-200;
  @apply hover:bg-gray-200 dark:hover:bg-gray-600;
  @apply transition-colors cursor-pointer;
}

.header__action-icon {
  @apply w-4 h-4;
}
</style>
