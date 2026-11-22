<script lang="ts" setup>
import { useTitle } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { SetupGuide } from '@/widgets/ui'
import { formatJobMs, SentryQueueTable, useCronClock, useQueueJobs, useQueueSummary } from '@/entities/sentry'
import { PERIOD_OPTIONS, useEventsStore } from '@/shared/stores'
import { SkeletonLoader, StatusPanel } from '@/shared/ui'

useTitle('Sentry Queues | Buggregator')

// The Queues tab (#6713): jobs from `queue.process` transactions. Live
// through `sentry.stored` kind `trace`, and on coming back to the browser tab.
const eventsStore = useEventsStore()
const { period } = storeToRefs(eventsStore)

const queue = ref('')
const failedOnly = ref(false)

const { summary, unsupported, fetchSummary } = useQueueSummary()
const { jobs, isInitialLoading, error, total, hasMore, loadingMore, loadMore, refresh } = useQueueJobs({
  queue,
  failedOnly
})
const now = useCronClock()

const periodLabel = computed(
  () => PERIOD_OPTIONS.find((o) => o.value === period.value)?.label.toLowerCase() ?? period.value
)
const filtered = computed(() => queue.value !== '' || failedOnly.value)
const queues = computed(() => summary.value?.queues ?? [])

const clearFilter = () => {
  queue.value = ''
  failedOnly.value = false
}
const retry = () => {
  fetchSummary()
  refresh()
}
const showAllTime = () => eventsStore.setPeriod('all')
</script>

<template>
  <div class="queues-page">
    <StatusPanel
      v-if="unsupported"
      title="This server has no queue jobs"
      text="Queue jobs need a newer Buggregator server. Update it to see the jobs of your queue workers here."
      data-test="queues-unsupported"
    />

    <StatusPanel
      v-else-if="error && !jobs.length"
      tone="error"
      title="Could not load queue jobs"
      :text="error"
      action-label="Try again"
      @action="retry"
    />

    <!-- A filter keeps the toolbar: its own loading is in the body. -->
    <div
      v-else-if="isInitialLoading && !filtered"
      class="queues-page__loading"
      role="status"
      aria-label="Loading queue jobs"
      data-test="queues-loading"
    >
      <SkeletonLoader variant="text" />
      <SkeletonLoader variant="text" />
    </div>

    <!-- No job in all time: how to turn queue tracing on. -->
    <SetupGuide
      v-else-if="!jobs.length && !filtered && period === 'all'"
      section-id="queues"
      section-title="Queues"
      kicker="Sentry · Queues"
      data-test="queues-empty"
    />

    <StatusPanel
      v-else-if="!jobs.length && !filtered"
      :title="`No queue jobs in the ${periodLabel}`"
      text="Pick a longer period, or open «How to set up» in the header to turn queue tracing on."
      action-label="Show all time"
      data-test="queues-empty-period"
      @action="showAllTime"
    />

    <div
      v-else
      class="queues-page__body"
    >
      <dl
        v-if="summary"
        class="queues-page__kpis"
        data-test="queues-summary"
      >
        <div>
          <dt>jobs, {{ periodLabel }}</dt>
          <dd>{{ summary.jobs }}</dd>
        </div>
        <div>
          <dt>failed</dt>
          <dd :class="{ 'queues-page__bad': summary.failed > 0 }">
            {{ summary.failed }}
          </dd>
        </div>
        <div>
          <dt>retried</dt>
          <dd>{{ summary.retried }}</dd>
        </div>
        <div>
          <dt>average duration</dt>
          <dd>{{ formatJobMs(summary.avg_duration_ms) }}</dd>
        </div>
      </dl>

      <div class="queues-page__toolbar">
        <div
          v-if="queues.length > 1 || queue"
          class="queues-page__seg"
          role="group"
          aria-label="Queue"
          data-test="queues-filter"
        >
          <button
            type="button"
            :aria-pressed="queue === ''"
            @click="queue = ''"
          >
            All
          </button>
          <button
            v-for="q in queues"
            :key="q.queue"
            type="button"
            :aria-pressed="queue === q.queue"
            @click="queue = q.queue"
          >
            {{ q.queue || 'default' }} <span class="queues-page__count">{{ q.jobs }}</span>
          </button>
        </div>
        <div
          class="queues-page__seg"
          role="group"
          aria-label="Status"
        >
          <button
            type="button"
            :aria-pressed="failedOnly"
            data-test="queues-failed-only"
            @click="failedOnly = !failedOnly"
          >
            Failed only
          </button>
        </div>
      </div>

      <StatusPanel
        v-if="error"
        tone="error"
        compact
        title="Could not refresh"
        :text="error"
        action-label="Try again"
        @action="retry"
      />

      <div
        v-if="isInitialLoading"
        class="queues-page__loading"
        role="status"
        aria-label="Loading queue jobs"
      >
        <SkeletonLoader variant="text" />
      </div>
      <SentryQueueTable
        v-else-if="jobs.length"
        :jobs="jobs"
        :now="now"
      />
      <StatusPanel
        v-else
        compact
        title="No job matches"
        action-label="Clear filter"
        data-test="queues-no-match"
        @action="clearFilter"
      />

      <div
        v-if="hasMore"
        class="queues-page__more"
      >
        <button
          type="button"
          class="queues-page__more-btn"
          :disabled="loadingMore"
          data-test="queues-more"
          @click="loadMore"
        >
          {{ loadingMore ? 'Loading…' : `Show more (${total - jobs.length} left)` }}
        </button>
      </div>

      <p class="queues-page__faint">
        A job appears when an attempt ends: running jobs are not shown. «Failed» is the last attempt's status;
        whether the worker will try again is not sent by Sentry, and neither is the job payload. Retries are run by
        your queue worker: Buggregator shows them, it does not retry jobs.
      </p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use 'src/pages/sentry/ui/sentry-crons-page/crons-page' as cp;
@use 'src/entities/sentry/ui/sentry-crons/cron-tokens' as cr;

.queues-page {
  @apply text-gray-800 dark:text-gray-200;

  display: flex;
  flex-direction: column;
  min-width: 0;
  font-size: 13px;
}

.queues-page__body,
.queues-page__loading {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  min-width: 0;
}

.queues-page__body .queues-page__loading {
  padding: 0;
}

.queues-page__kpis {
  @include cr.kpis;
}

.queues-page__kpis .queues-page__bad {
  color: #dc2626;

  .dark & {
    color: #f87171;
  }
}

.queues-page__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 16px;
}

.queues-page__seg {
  @include cp.seg;

  flex-wrap: wrap;
  max-width: 100%;
}

.queues-page__count {
  @apply text-gray-500 dark:text-gray-400;

  font-family: 'JetBrains Mono Variable', ui-monospace, monospace;
  font-weight: 400;
}

.queues-page__more-btn {
  @include cp.focus-ring;
  @apply text-blue-700 dark:text-blue-300;

  background: none;
  border: 0;
  padding: 0;
  font-size: 12px;
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: pointer;

  &:disabled {
    cursor: default;
    opacity: 0.6;
  }
}

.queues-page__faint {
  @apply text-gray-500 dark:text-gray-400;

  margin: 0;
  font-size: 12px;
}

@media (max-width: 639px) {
  .queues-page__body,
  .queues-page__loading {
    padding: 12px;
  }
}
</style>
