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

    <!-- Section tabs next to the crumbs, stretched to the bar's bottom line. -->
    <div
      v-if="$slots.tabs"
      class="header__tabs"
    >
      <slot name="tabs" />
    </div>

    <div class="header__actions">
      <slot name="controls" />
    </div>
  </header>
</template>

<style lang="scss" scoped>
.header {
  @apply flex items-center justify-between h-full px-1 min-w-0;
}

.header__nav {
  @apply hidden sm:flex items-center;
  @apply text-sm text-gray-500 dark:text-gray-400;
}

.header__nav--keep {
  @apply flex min-w-0;
}

.header__tabs {
  @apply flex self-stretch flex-1 min-w-0 ml-4 mr-3;
}

.header__actions {
  // Shrinks (the search box first) when something sits next to the header,
  // such as the update pill on a phone.
  @apply flex items-center gap-1.5 min-w-0;
}

// Phones: the bar is 36 px, its buttons 28. Each gets a 44 px tap area from
// the top edge of the bar down (as the mock-server header buttons do).
@media (max-width: 639px) {
  .header__actions :slotted(button) {
    @apply relative;
  }

  .header__actions :slotted(button)::after {
    content: '';
    @apply absolute inset-x-0 -top-1 -bottom-3;
  }
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
