<script lang="ts" setup>
import { useTitle } from '@vueuse/core'
import { onMounted } from 'vue'
import { useSentryLogs } from '@/entities/sentry/lib'
import { onSentryEvent } from '@/entities/sentry/lib/use-sentry-events-bus'
import { SentryEmptyState } from '@/entities/sentry/ui/sentry-empty-state'
import { SentryLogsList } from '@/entities/sentry/ui/sentry-logs-list'
import { SentrySubNav } from '@/entities/sentry/ui/sentry-sub-nav'

useTitle('Sentry Logs | Buggregator')

const { logs, loading, total, fetchList } = useSentryLogs()

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
      v-if="!loading && logs.length === 0"
      type="logs"
    />

    <SentryLogsList
      v-else
      :logs="logs"
      :loading="loading"
    />

    <div
      v-if="!loading && total > 0"
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
