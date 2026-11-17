<script lang="ts" setup>
import { useTitle } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, onMounted, watch } from 'vue'
import { LayoutPreviewEvents, SetupGuide } from '@/widgets/ui'
import {
  useSentryExceptions,
  onSentryEvent,
  SentryExceptionGroupCard,
  useSentryFilters
} from '@/entities/sentry'
import { useEventsStore } from '@/shared/stores'
import { EventTypes, type ServerEvent } from '@/shared/types'
import { StatusPanel } from '@/shared/ui'

useTitle('Sentry Exceptions | Buggregator')

const {
  grouped,
  groupedItems,
  hasLoaded,
  error,
  isInitialLoading,
  total,
  page,
  filters,
  fetchList
} = useSentryExceptions()

// View and level come from the filter button in the Sentry header (#5980).
const sentryFilters = useSentryFilters()
grouped.value = sentryFilters.exceptionsView === 'grouped'
filters.level = sentryFilters.exceptionsLevel || null

watch(
  () => sentryFilters.exceptionsView,
  (view) => {
    grouped.value = view === 'grouped'
  }
)

watch(
  () => sentryFilters.exceptionsLevel,
  (level) => {
    filters.level = level || null
    page.value = 1
    if (grouped.value) fetchList()
  }
)

// The timeline is the live event feed: the level is matched in the browser,
// over the events this page has loaded (Group by type asks the server).
const levelFilter = computed(() => {
  const level = sentryFilters.exceptionsLevel
  if (!level) return undefined
  return (event: ServerEvent<unknown>) => (event.payload as { level?: string })?.level === level
})

watch(grouped, () => {
  if (grouped.value) fetchList()
})

// Refetch on a project or period change: both are mixed into the request in
// use-sentry-requests, but neither triggers reactivity on its own.
const { activeProjectKey, period } = storeToRefs(useEventsStore())

watch([activeProjectKey, period], () => {
  page.value = 1
  hasLoaded.value = false // a filter change is a user action: show the loading state
  if (grouped.value) fetchList()
})

onMounted(() => {
  if (grouped.value) fetchList()
})

onSentryEvent(() => {
  if (grouped.value) fetchList()
}, ['error'])
</script>

<template>
  <div class="sentry-exceptions-page">
    <!-- Grouped mode -->
    <div
      v-if="grouped"
      class="sentry-exceptions-page__list"
    >
      <!-- The placeholder is for the first load only: on a WebSocket-driven
           refresh the list stays in place, otherwise the UI flickers on every
           incoming event. -->
      <div
        v-if="isInitialLoading"
        class="sentry-exceptions-page__loading"
      >
        Loading...
      </div>

      <StatusPanel
        v-else-if="error"
        tone="error"
        title="Could not load exceptions"
        :text="error"
        action-label="Try again"
        @action="fetchList"
      />

      <template v-else-if="groupedItems.length > 0">
        <SentryExceptionGroupCard
          v-for="group in groupedItems"
          :key="group.fingerprint"
          :group="group"
        />
      </template>

      <!-- No exception yet: how to send the first one (#5941). A level that
           matches nothing says so, with a way back (the level sits behind the
           filter button). -->
      <SetupGuide
        v-else-if="!sentryFilters.exceptionsLevel"
        section-id="sentry"
        section-title="Sentry"
        kicker="Sentry · Exceptions"
      />

      <StatusPanel
        v-else
        :title="`No ${sentryFilters.exceptionsLevel} exceptions`"
        action-label="Show all levels"
        data-test="grouped-level-empty"
        @action="sentryFilters.exceptionsLevel = ''"
      />

      <div
        v-if="!isInitialLoading && total > 0"
        class="sentry-exceptions-page__footer"
      >
        {{ total }} group{{ total !== 1 ? 's' : '' }}
      </div>
    </div>

    <!-- Timeline mode — reuses existing layout-preview-events with type filter -->
    <LayoutPreviewEvents
      v-else
      :type="EventTypes.Sentry"
      title="Sentry Exceptions"
      :filter="levelFilter"
      :filter-empty="{
        title: `No ${sentryFilters.exceptionsLevel} exceptions`,
        text: 'The level is matched over the events loaded on this page. Group by type searches all of them.',
        action: 'Show all levels'
      }"
      @clear-filter="sentryFilters.exceptionsLevel = ''"
    />
  </div>
</template>

<style lang="scss" scoped>
.sentry-exceptions-page {
  @apply flex flex-col h-full;
}

.sentry-exceptions-page__list {
  @apply flex-1 overflow-auto;
  @apply divide-y divide-gray-200 dark:divide-gray-700;
}

.sentry-exceptions-page__loading {
  @apply flex items-center justify-center py-12;
  @apply text-sm text-gray-500 dark:text-gray-400;
}

.sentry-exceptions-page__empty {
  @apply flex items-center justify-center py-12;
  @apply text-sm text-gray-500 dark:text-gray-400;
}

.sentry-exceptions-page__footer {
  @apply text-center py-3 text-xs text-gray-500 dark:text-gray-400;
  @apply border-t border-gray-200 dark:border-gray-700;
}
</style>
