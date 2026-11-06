<script lang="ts" setup>
import { useTitle } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { onMounted, ref, watch } from 'vue'
import {
  useSentryTraces,
  onSentryEvent,
  SentryEmptyState,
  SentrySubNav,
  ServiceMap,
  TracePreviewCard
} from '@/entities/sentry'
import { useEventsStore } from '@/shared/stores'
import { StatusPanel } from '@/shared/ui'

useTitle('Sentry Traces | Buggregator')

const STORAGE_KEY = 'sentry_traces_view_mode'

const { traces, hasLoaded, error, isInitialLoading, total, fetchList } = useSentryTraces()

const viewMode = ref<'list' | 'map'>(
  (window?.localStorage?.getItem(STORAGE_KEY) as 'list' | 'map') || 'list'
)

watch(viewMode, (val) => {
  window?.localStorage?.setItem(STORAGE_KEY, val)
})

// The period is mixed into the request in use-sentry-requests and does not
// trigger reactivity on its own, so refetch the list explicitly. The project
// is not: the server keeps no project for traces, logs and metrics.
const { period } = storeToRefs(useEventsStore())

watch(period, () => {
  hasLoaded.value = false // a filter change is a user action: show the loading state
  fetchList()
})

onMounted(() => {
  fetchList()
})

onSentryEvent(() => {
  fetchList()
})
</script>

<template>
  <div class="sentry-traces-page">
    <SentrySubNav />

    <div class="sentry-traces-page__header">
      <div class="sentry-traces-page__toggle">
        <button
          class="sentry-traces-page__toggle-btn"
          :class="{ 'sentry-traces-page__toggle-btn--active': viewMode === 'list' }"
          @click="viewMode = 'list'"
        >
          Waterfall list
        </button>
        <button
          class="sentry-traces-page__toggle-btn"
          :class="{ 'sentry-traces-page__toggle-btn--active': viewMode === 'map' }"
          @click="viewMode = 'map'"
        >
          Service map
        </button>
      </div>
    </div>

    <div
      v-if="viewMode === 'list'"
      class="sentry-traces-page__list"
    >
      <div
        v-if="isInitialLoading"
        class="sentry-traces-page__loading"
      >
        Loading...
      </div>

      <StatusPanel
        v-else-if="error"
        tone="error"
        title="Could not load traces"
        :text="error"
        action-label="Try again"
        @action="fetchList"
      />

      <template v-else-if="traces.length > 0">
        <TracePreviewCard
          v-for="trace in traces"
          :key="trace.trace_id"
          :trace="trace"
        />
      </template>

      <SentryEmptyState
        v-else
        type="traces"
      />

      <div
        v-if="!isInitialLoading && total > 0"
        class="sentry-traces-page__footer"
      >
        {{ total }} trace{{ total !== 1 ? 's' : '' }}
      </div>
    </div>

    <div
      v-else
      class="sentry-traces-page__map"
    >
      <ServiceMap :window-minutes="60" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.sentry-traces-page {
  @apply flex flex-col h-full;
}
.sentry-traces-page__header {
  @apply flex items-center gap-3 px-4 py-2;
  @apply border-b border-gray-200 dark:border-gray-700;
  @apply bg-white dark:bg-gray-800;
}
.sentry-traces-page__toggle {
  @apply flex rounded-md overflow-hidden;
  @apply border border-gray-200 dark:border-gray-600;
}
.sentry-traces-page__toggle-btn {
  @apply px-3 py-1 text-xs font-medium cursor-pointer;
  @apply text-gray-500 dark:text-gray-400;
  @apply hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors;
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50;
  & + & {
    @apply border-l border-gray-200 dark:border-gray-600;
  }
}
.sentry-traces-page__toggle-btn--active {
  @apply bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white;
}
.sentry-traces-page__list {
  @apply flex-1 overflow-auto divide-y divide-gray-200 dark:divide-gray-700;
}
.sentry-traces-page__map {
  @apply flex-1;
}
.sentry-traces-page__loading,
.sentry-traces-page__empty {
  @apply flex items-center justify-center py-12 text-sm text-gray-500 dark:text-gray-400;
}
.sentry-traces-page__footer {
  @apply text-center py-3 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700;
}
</style>
