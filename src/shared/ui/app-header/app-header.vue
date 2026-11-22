<script lang="ts" setup>
import { APP_HEADER_TOOLBAR_ID } from './toolbar'

// The page header (design #6737 A): row 1 «where I am» — crumbs, section
// tabs, actions; row 2 «how I look» (#toolbar) — the view, filters, period
// or the tabs of an event. A page that gives #toolbar always has row 2, even
// when it is empty, so the first filter does not move the page.
// `keepTitle`: the crumbs stay on phones too (they are hidden there by default).
defineProps<{ keepTitle?: boolean }>()
</script>

<template>
  <header
    class="app-header"
    :class="{ 'app-header--two-rows': $slots.toolbar }"
  >
    <div class="app-header__row">
      <nav
        class="app-header__nav"
        :class="{ 'app-header__nav--keep': keepTitle }"
        aria-label="Breadcrumb"
      >
        <slot />
      </nav>

      <!-- Section tabs next to the crumbs. -->
      <div
        v-if="$slots.tabs"
        class="app-header__tabs"
      >
        <!-- Keeps the crumbs and the tabs apart (#5999). -->
        <span
          class="app-header__tabs-sep"
          aria-hidden="true"
        />
        <slot name="tabs" />
      </div>

      <div class="app-header__actions">
        <slot name="controls" />
      </div>
    </div>

    <!-- Row 2. A page part below the header puts its own controls here with
         HeaderToolbarPortal (the tabs of an event, the views of a trace). -->
    <div
      v-if="$slots.toolbar"
      :id="APP_HEADER_TOOLBAR_ID"
      class="app-header__toolbar"
      data-test="app-header-toolbar"
    >
      <slot name="toolbar" />
    </div>
  </header>
</template>

<style lang="scss" scoped>
.app-header {
  @apply flex flex-col h-full min-w-0;
}

// The row heights come from the layout (--hdr-row, --hdr-bar); without it
// (a story) row 1 fills the header.
.app-header__row {
  @apply flex items-center justify-between gap-2 px-1 min-w-0;
  flex: 1 0 auto;
  height: var(--hdr-row, auto);
}

.app-header__nav {
  @apply hidden sm:flex items-center flex-none;
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.app-header__nav--keep {
  @apply flex min-w-0 flex-initial;
}

.app-header__tabs {
  @apply flex items-center flex-1 min-w-0 mr-1 sm:mr-3;
}

.app-header__tabs-sep {
  @apply hidden sm:block flex-none h-4 w-px mr-4 bg-gray-200 dark:bg-gray-700;
}

.app-header__actions {
  // Shrinks (the search box first) when something sits next to the header,
  // such as the update pill on a phone.
  @apply flex items-center gap-1.5 min-w-0 ml-auto;
}

// The line between the rows runs the header's full width: the toolbar
// reaches over the layout's side padding (--hdr-pad).
.app-header__toolbar {
  @apply flex items-center gap-2.5 min-w-0 flex-none;
  @apply border-t border-gray-200 dark:border-gray-700;
  @apply bg-gray-50 dark:bg-gray-900/40;
  height: var(--hdr-bar, 44px);
  margin-inline: calc(-1 * var(--hdr-pad, 0px));
  padding-inline: calc(var(--hdr-pad, 0px) + 0.25rem);
}

// Phones: the bar's buttons are 28 px, each gets a 44 px tap area (as the
// mock-server header buttons do).
@media (max-width: 639px) {
  .app-header__actions :slotted(button) {
    @apply relative;
  }

  .app-header__actions :slotted(button)::after {
    content: '';
    @apply absolute inset-x-0 -top-2 -bottom-2;
  }
}
</style>

<style lang="scss">
// One home for what every header draws (#6742): the crumbs and the action
// buttons. Global, but only inside the header.
.app-header {
  .nav__crumb {
    @apply text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap;
    @apply hover:text-gray-900 dark:hover:text-gray-100;
    @apply transition-colors;
  }

  .nav__sep {
    @apply text-gray-500 mx-1.5 text-sm;
  }

  .nav__current {
    @apply text-sm font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap;
  }

  .action-btn {
    @apply h-7 flex flex-none items-center gap-1.5 px-2.5 rounded;
    @apply text-xs font-medium;
    @apply text-gray-600 dark:text-gray-300;
    @apply bg-gray-100 dark:bg-gray-700;
    @apply hover:text-gray-700 dark:hover:text-gray-200;
    @apply hover:bg-gray-200 dark:hover:bg-gray-600;
    @apply transition-colors cursor-pointer;
  }

  .action-btn--danger {
    @apply hover:text-red-600 dark:hover:text-red-400;
    @apply hover:bg-red-50 dark:hover:bg-red-500/10;
  }

  .action-btn__icon {
    @apply w-3.5 h-3.5;
  }

  .action-btn__text {
    @apply hidden sm:inline;
  }
}
</style>
