<script lang="ts" setup>
import { useTitle } from '@vueuse/core'
import { onMounted, ref, watch } from 'vue'
import { LayoutPreviewEvents } from '@/widgets/ui'
import { useSentryExceptions } from '@/entities/sentry/lib'
import { onSentryEvent } from '@/entities/sentry/lib/use-sentry-events-bus'
import { SentryEmptyState } from '@/entities/sentry/ui/sentry-empty-state'
import { SentryExceptionGroupCard } from '@/entities/sentry/ui/sentry-exception-group-card'
import { SentrySubNav } from '@/entities/sentry/ui/sentry-sub-nav'
import { EventTypes } from '@/shared/types'

useTitle('Sentry Exceptions | Buggregator')

const STORAGE_KEY = 'sentry_exceptions_view_mode'

const { grouped, groupedItems, loading, total, filters, fetchList } = useSentryExceptions()

// Restore view mode preference from localStorage.
const storedMode = window?.localStorage?.getItem(STORAGE_KEY)
if (storedMode === 'grouped') {
  grouped.value = true
}

const levelOptions = ['', 'fatal', 'error', 'warning', 'info', 'debug']
const selectedLevel = ref(filters.level || '')

const setViewMode = (mode: boolean) => {
  grouped.value = mode
  window?.localStorage?.setItem(STORAGE_KEY, mode ? 'grouped' : 'timeline')
}

watch(selectedLevel, (val) => {
  filters.level = val || null
  if (grouped.value) fetchList()
})

watch(grouped, () => {
  if (grouped.value) fetchList()
})

onMounted(() => {
  if (grouped.value) fetchList()
})

onSentryEvent(() => {
  if (grouped.value) fetchList()
})
</script>

<template>
  <div class="sentry-exceptions-page">
    <SentrySubNav />

    <div class="sentry-exceptions-page__header">
      <div class="sentry-exceptions-page__toggle">
        <button
          class="sentry-exceptions-page__toggle-btn"
          :class="{ 'sentry-exceptions-page__toggle-btn--active': !grouped }"
          @click="setViewMode(false)"
        >
          Timeline
        </button>
        <button
          class="sentry-exceptions-page__toggle-btn"
          :class="{ 'sentry-exceptions-page__toggle-btn--active': grouped }"
          @click="setViewMode(true)"
        >
          Group by type
        </button>
      </div>

      <div class="sentry-exceptions-page__filters">
        <select
          v-model="selectedLevel"
          class="sentry-exceptions-page__select"
        >
          <option value="">
            All levels
          </option>
          <option
            v-for="level in levelOptions.filter((l) => l)"
            :key="level"
            :value="level"
          >
            {{ level }}
          </option>
        </select>
      </div>
    </div>

    <!-- Grouped mode -->
    <div
      v-if="grouped"
      class="sentry-exceptions-page__list"
    >
      <div
        v-if="loading"
        class="sentry-exceptions-page__loading"
      >
        Loading...
      </div>

      <template v-else-if="groupedItems.length > 0">
        <SentryExceptionGroupCard
          v-for="group in groupedItems"
          :key="group.fingerprint"
          :group="group"
        />
      </template>

      <SentryEmptyState
        v-else
        type="exceptions"
      />

      <div
        v-if="!loading && total > 0"
        class="sentry-exceptions-page__footer"
      >
        {{ total }} group{{ total !== 1 ? 's' : '' }}
      </div>
    </div>

    <!-- Timeline mode — reuses existing layout-preview-events with type filter -->
    <LayoutPreviewEvents
      v-else
      :type="EventTypes.Sentry"
    />
  </div>
</template>

<style lang="scss" scoped>
.sentry-exceptions-page {
  @apply flex flex-col h-full;
}

.sentry-exceptions-page__header {
  @apply flex items-center justify-between gap-3 px-4 py-2;
  @apply border-b border-gray-200 dark:border-gray-700;
  @apply bg-white dark:bg-gray-800;
}

.sentry-exceptions-page__toggle {
  @apply flex rounded-md overflow-hidden;
  @apply border border-gray-200 dark:border-gray-600;
}

.sentry-exceptions-page__toggle-btn {
  @apply px-3 py-1 text-xs font-medium;
  @apply text-gray-500 dark:text-gray-400;
  @apply hover:bg-gray-100 dark:hover:bg-gray-700;
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50;
  @apply transition-colors cursor-pointer;

  & + & {
    @apply border-l border-gray-200 dark:border-gray-600;
  }
}

.sentry-exceptions-page__toggle-btn--active {
  @apply bg-gray-100 dark:bg-gray-700;
  @apply text-gray-900 dark:text-white;
}

.sentry-exceptions-page__filters {
  @apply flex gap-2;
}

.sentry-exceptions-page__select {
  @apply text-xs rounded-md px-2 py-1;
  @apply border border-gray-200 dark:border-gray-600;
  @apply bg-white dark:bg-gray-800;
  @apply text-gray-700 dark:text-gray-300;
}

.sentry-exceptions-page__list {
  @apply flex-1 overflow-auto;
  @apply divide-y divide-gray-200 dark:divide-gray-700;
}

.sentry-exceptions-page__loading {
  @apply flex items-center justify-center py-12;
  @apply text-sm text-gray-400;
}

.sentry-exceptions-page__empty {
  @apply flex items-center justify-center py-12;
  @apply text-sm text-gray-400;
}

.sentry-exceptions-page__footer {
  @apply text-center py-3 text-xs text-gray-400;
  @apply border-t border-gray-200 dark:border-gray-700;
}
</style>
