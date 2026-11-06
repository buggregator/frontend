<script lang="ts" setup>
import { useTitle } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { onMounted, ref, watch } from 'vue'
import { useSentryLogs } from '@/entities/sentry/lib'
import { onSentryEvent } from '@/entities/sentry/lib/use-sentry-events-bus'
import { SentryEmptyState } from '@/entities/sentry/ui/sentry-empty-state'
import { SentryLogsList } from '@/entities/sentry/ui/sentry-logs-list'
import { SentrySubNav } from '@/entities/sentry/ui/sentry-sub-nav'
import { useEventsStore } from '@/shared/stores'

useTitle('Sentry Logs | Buggregator')

const { logs, isInitialLoading, total, page, filters, fetchList } = useSentryLogs()

// A chip stands for the levels SDKs send for it
const levelsOfChip: Record<string, string | null> = {
  all: null,
  warn: 'warn,warning',
  error: 'error,fatal',
}

const activeLevel = ref('all')

watch(activeLevel, (level) => {
  filters.level = level in levelsOfChip ? levelsOfChip[level] : level
  page.value = 1
  fetchList()
})

// The project and the period are mixed into the request in use-sentry-requests;
// neither triggers reactivity on its own, so refetch the list explicitly.
const { activeProjectKey, period } = storeToRefs(useEventsStore())

watch([activeProjectKey, period], () => {
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
  <div class="sentry-logs-page">
    <SentrySubNav />

    <SentryEmptyState
      v-if="!isInitialLoading && logs.length === 0 && activeLevel === 'all'"
      type="logs"
    />

    <SentryLogsList
      v-else
      v-model:level="activeLevel"
      :logs="logs"
      :loading="isInitialLoading"
    />

    <div
      v-if="!isInitialLoading && total > 0"
      class="sentry-logs-page__footer"
    >
      {{ total }} log{{ total !== 1 ? 's' : '' }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
.sentry-logs-page {
  @apply flex flex-col h-full;
}

.sentry-logs-page__footer {
  @apply text-center py-3 text-xs text-gray-400;
  @apply border-t border-gray-100 dark:border-gray-800;
}
</style>
