<script lang="ts" setup>
import { useTitle } from '@vueuse/core'
import moment from 'moment'
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSentryTraces } from '@/entities/sentry/lib'
import type { SentryTraceDetail } from '@/entities/sentry/types'
import { SentrySubNav } from '@/entities/sentry/ui/sentry-sub-nav'
import { TraceWaterfall } from '@/entities/sentry/ui/trace-waterfall'
import { logger } from '@/shared/lib/logger'
import { RouteName } from '@/shared/types'

const { params } = useRoute()
const router = useRouter()
const traceId = params.traceId as string

useTitle(`Trace ${traceId} | Buggregator`)

const formatTime = (ts: string) => (ts ? moment(ts).fromNow() : '')

const { fetchDetail } = useSentryTraces()
const detail = ref<SentryTraceDetail | null>(null)
const loading = ref(false)
const activeTab = ref<'spans' | 'errors' | 'logs'>('spans')

onMounted(async () => {
  loading.value = true
  try {
    detail.value = await fetchDetail(traceId)
    if (!detail.value) {
      await router.replace({ name: RouteName.NotFound })
    }
  } catch (error) {
    logger(['UI: Failed to load trace detail', error])
    await router.replace({ name: RouteName.NotFound })
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="trace-detail">
    <SentrySubNav />

    <div
      v-if="loading"
      class="trace-detail__loading"
    >
      Loading trace...
    </div>

    <template v-else-if="detail">
      <div class="trace-detail__header">
        <h1 class="trace-detail__title">
          {{ detail.transaction.transaction_name }}
        </h1>
        <div class="trace-detail__meta">
          <span class="trace-detail__badge trace-detail__badge--op">{{
            detail.transaction.op
          }}</span>
          <span class="trace-detail__badge">{{ detail.transaction.duration_ms }}ms</span>
          <span
            class="trace-detail__badge"
            :class="
              detail.transaction.status === 'ok'
                ? 'trace-detail__badge--ok'
                : 'trace-detail__badge--status'
            "
          >
            {{ detail.transaction.status }}
          </span>
          <span class="trace-detail__trace-id">{{ detail.trace_id }}</span>
        </div>
      </div>

      <div class="trace-detail__tabs">
        <button
          class="trace-detail__tab"
          :class="{ 'trace-detail__tab--active': activeTab === 'spans' }"
          @click="activeTab = 'spans'"
        >
          Spans ({{ detail.spans.length }})
        </button>
        <button
          v-if="detail.related_errors.length > 0"
          class="trace-detail__tab"
          :class="{ 'trace-detail__tab--active': activeTab === 'errors' }"
          @click="activeTab = 'errors'"
        >
          Related Errors ({{ detail.related_errors.length }})
        </button>
        <button
          v-if="detail.related_log_count > 0"
          class="trace-detail__tab"
          :class="{ 'trace-detail__tab--active': activeTab === 'logs' }"
          @click="activeTab = 'logs'"
        >
          Related Logs ({{ detail.related_log_count }})
        </button>
      </div>

      <div class="trace-detail__content">
        <TraceWaterfall
          v-if="activeTab === 'spans'"
          :spans="detail.spans"
          :total-ms="detail.transaction.duration_ms"
        />

        <div
          v-if="activeTab === 'errors'"
          class="trace-detail__errors"
        >
          <div
            v-for="err in detail.related_errors"
            :key="err.id"
            class="trace-detail__error-row"
          >
            <RouterLink
              :to="{ name: RouteName.SentryExceptionDetail, params: { id: err.id } }"
              class="trace-detail__error-link"
            >
              {{ err.exception_type || 'Error' }}
            </RouterLink>
            <span class="trace-detail__error-time">{{ formatTime(err.received_at) }}</span>
          </div>
        </div>

        <div
          v-if="activeTab === 'logs'"
          class="trace-detail__logs-info"
        >
          {{ detail.related_log_count }} log entries linked to this trace.
          <RouterLink
            :to="{ name: RouteName.SentryLogs, query: { trace_id: detail.trace_id } }"
            class="trace-detail__logs-link"
          >
            View logs &rarr;
          </RouterLink>
        </div>
      </div>
    </template>

    <div
      v-else
      class="trace-detail__loading"
    >
      Trace not found.
    </div>
  </div>
</template>

<style lang="scss" scoped>
.trace-detail {
  @apply flex flex-col h-full;
}

.trace-detail__loading {
  @apply flex items-center justify-center py-12 text-sm text-gray-400;
}

.trace-detail__header {
  @apply px-5 py-5;
  @apply border-b border-gray-200 dark:border-gray-700/50;
  @apply bg-gray-50 dark:bg-gray-900;
}

.trace-detail__title {
  @apply font-bold text-base md:text-lg break-all sm:break-normal mb-2;
  @apply text-gray-900 dark:text-gray-100;
}

.trace-detail__meta {
  @apply flex flex-wrap items-center gap-1.5;
}

.trace-detail__badge {
  @apply inline-flex items-center px-1.5 py-0.5 rounded;
  @apply text-2xs font-medium;
  @apply bg-gray-100 dark:bg-gray-600/50 text-gray-600 dark:text-gray-300;
}

.trace-detail__badge--op {
  @apply font-semibold;
  @apply text-violet-600 dark:text-violet-400;
  @apply bg-violet-50 dark:bg-violet-500/10;
}

.trace-detail__badge--ok {
  @apply text-green-600 dark:text-green-400;
  @apply bg-green-50 dark:bg-green-500/10;
}

.trace-detail__badge--status {
  @apply text-amber-600 dark:text-amber-400;
  @apply bg-amber-50 dark:bg-amber-500/10;
}

.trace-detail__trace-id {
  @apply text-2xs font-mono text-gray-400 dark:text-gray-500 ml-auto;
}

.trace-detail__tabs {
  @apply flex items-center gap-1 px-4 py-2;
  @apply border-b border-gray-200 dark:border-gray-700;
  @apply bg-white dark:bg-gray-800;
}

.trace-detail__tab {
  @apply inline-flex items-center gap-1.5;
  @apply px-3 py-1.5 rounded-md;
  @apply text-xs font-medium cursor-pointer;
  @apply text-gray-500 dark:text-gray-400;
  @apply hover:text-gray-700 dark:hover:text-gray-200;
  @apply hover:bg-gray-100 dark:hover:bg-gray-700;
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50;
  @apply transition-colors duration-100;
}

.trace-detail__tab--active {
  @apply bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white;
}

.trace-detail__content {
  @apply flex-1 overflow-auto p-5;
  @apply bg-white dark:bg-gray-800;
}

.trace-detail__errors {
  @apply rounded overflow-hidden;
  @apply border border-gray-200 dark:border-gray-700;
  @apply divide-y divide-gray-200 dark:divide-gray-700;
}

.trace-detail__error-row {
  @apply flex items-center justify-between px-3 py-2;
  @apply bg-white dark:bg-gray-800;
  @apply hover:bg-gray-50 dark:hover:bg-gray-900;
  @apply transition-colors duration-100;
}

.trace-detail__error-link {
  @apply text-sm font-medium text-red-600 dark:text-red-400 hover:underline;
}

.trace-detail__error-time {
  @apply text-2xs font-mono text-gray-400 dark:text-gray-500;
}

.trace-detail__logs-info {
  @apply p-4 text-sm text-gray-500 dark:text-gray-400;
  @apply rounded;
  @apply bg-gray-50 dark:bg-gray-900;
  @apply border border-gray-200 dark:border-gray-700;
}

.trace-detail__logs-link {
  @apply text-blue-600 dark:text-blue-400 hover:underline ml-1 font-medium;
}
</style>
