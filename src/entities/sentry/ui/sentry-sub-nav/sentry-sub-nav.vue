<script lang="ts" setup>
import { onMounted } from 'vue'
import { useSentryCounts } from '../../lib'
import { onSentryEvent } from '../../lib/use-sentry-events-bus'

const { counts, fetchCounts } = useSentryCounts()

onMounted(() => {
  fetchCounts()
})

onSentryEvent(() => {
  fetchCounts()
})
</script>

<template>
  <nav
    class="sentry-sub-nav"
    role="tablist"
  >
    <RouterLink
      to="/sentry/exceptions"
      class="sentry-sub-nav__tab"
      active-class="sentry-sub-nav__tab--active"
      role="tab"
    >
      Exceptions
      <span
        v-if="counts.exceptions > 0"
        class="sentry-sub-nav__badge"
      >
        {{ counts.exceptions }}
      </span>
    </RouterLink>

    <RouterLink
      v-show="counts.traces > 0"
      to="/sentry/traces"
      class="sentry-sub-nav__tab"
      :class="{ 'sentry-sub-nav__tab--hidden': counts.traces === 0 }"
      active-class="sentry-sub-nav__tab--active"
      role="tab"
    >
      Traces
      <span class="sentry-sub-nav__badge">{{ counts.traces }}</span>
    </RouterLink>

    <RouterLink
      v-show="counts.logs > 0"
      to="/sentry/logs"
      class="sentry-sub-nav__tab"
      :class="{ 'sentry-sub-nav__tab--hidden': counts.logs === 0 }"
      active-class="sentry-sub-nav__tab--active"
      role="tab"
    >
      Logs
      <span class="sentry-sub-nav__badge">{{ counts.logs }}</span>
    </RouterLink>
  </nav>
</template>

<style lang="scss" scoped>
.sentry-sub-nav {
  @apply flex items-center gap-1 px-4 py-2;
  @apply border-b border-gray-200 dark:border-gray-700;
  @apply bg-white dark:bg-gray-800;
}

.sentry-sub-nav__tab {
  @apply inline-flex items-center gap-1.5;
  @apply px-3 py-1.5 rounded-md;
  @apply text-xs font-medium;
  @apply text-gray-500 dark:text-gray-400;
  @apply hover:text-gray-700 dark:hover:text-gray-200;
  @apply hover:bg-gray-100 dark:hover:bg-gray-700;
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50;
  transition:
    opacity 0.2s ease,
    padding 0.2s ease,
    color 0.15s ease,
    background-color 0.15s ease;
}

.sentry-sub-nav__tab--hidden {
  opacity: 0;
  pointer-events: none;
  width: 0;
  overflow: hidden;
  padding: 0;
}

.sentry-sub-nav__tab--active {
  @apply text-gray-900 dark:text-white;
  @apply bg-gray-100 dark:bg-gray-700;
}

.sentry-sub-nav__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  line-height: 1;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 8px;

  @apply bg-gray-200 dark:bg-gray-700;
  @apply text-gray-500 dark:text-gray-400;
  @apply tabular-nums font-mono;

  .sentry-sub-nav__tab--active & {
    @apply bg-rose-100 dark:bg-rose-500/15;
    @apply text-rose-600 dark:text-rose-400;
  }
}
</style>
