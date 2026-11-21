<script lang="ts" setup>
import { useTitle } from '@vueuse/core'
import { computed, ref } from 'vue'
import { SetupGuide } from '@/widgets/ui'
import { SentryCronTable, monitorStatus, needsAttention, summarizeMonitors, useCronClock, useCronMonitors } from '@/entities/sentry'
import { SearchBar, SkeletonLoader, StatusPanel } from '@/shared/ui'

useTitle('Sentry Crons | Buggregator')

// The Crons tab (#6617, design #6600 A). Live through `sentry.stored` kind
// `cron`, and on coming back to the browser tab.
const { monitors, isInitialLoading, error, unsupported, fetchMonitors } = useCronMonitors()
const now = useCronClock()

const summary = computed(() => summarizeMonitors(monitors.value, now.value))

const query = ref('')
const onlyAttention = ref(false)
const shown = computed(() => {
  const q = query.value.trim().toLowerCase()
  return monitors.value.filter(
    (m) =>
      (!q || m.slug.toLowerCase().includes(q)) &&
      (!onlyAttention.value || needsAttention(monitorStatus(m, now.value)))
  )
})
const clearFilter = () => {
  query.value = ''
  onlyAttention.value = false
}
</script>

<template>
  <div class="crons-page">
    <StatusPanel
      v-if="error && !monitors.length"
      tone="error"
      title="Could not load cron jobs"
      :text="error"
      action-label="Try again"
      @action="fetchMonitors"
    />

    <StatusPanel
      v-else-if="unsupported"
      title="This server has no cron monitoring"
      text="Cron check-ins need a newer Buggregator server. Update it to see Sentry Crons and ping URL jobs here."
      data-test="crons-unsupported"
    />

    <div
      v-else-if="isInitialLoading"
      class="crons-page__loading"
      role="status"
      aria-label="Loading cron jobs"
      data-test="crons-loading"
    >
      <SkeletonLoader variant="text" />
      <SkeletonLoader variant="text" />
    </div>

    <!-- No job yet: how to send the first check-in, same guide as the other
         sections (ping URL, Sentry SDKs) with this server's values. -->
    <SetupGuide
      v-else-if="!monitors.length"
      section-id="crons"
      section-title="Crons"
      kicker="Sentry · Crons"
      data-test="crons-empty"
    />

    <div
      v-else
      class="crons-page__body"
    >
      <div class="crons-page__toolbar">
        <p
          class="crons-page__summary"
          data-test="crons-summary"
        >
          <b>{{ summary.total }} {{ summary.total === 1 ? 'job' : 'jobs' }}</b>
          <template v-if="summary.attention">
            · <b class="crons-page__bad">{{ summary.attention }} need{{ summary.attention === 1 ? 's' : '' }} attention</b>
          </template>
          <template v-if="summary.running">
            · {{ summary.running }} running
          </template>
          · {{ summary.ok }} OK
        </p>
        <div class="crons-page__filter">
          <SearchBar
            v-model="query"
            placeholder="Filter jobs"
            label="Filter jobs"
          />
        </div>
        <div
          class="crons-page__seg"
          role="group"
          aria-label="Show"
        >
          <button
            type="button"
            :aria-pressed="!onlyAttention"
            @click="onlyAttention = false"
          >
            All
          </button>
          <button
            type="button"
            :aria-pressed="onlyAttention"
            data-test="crons-only-attention"
            @click="onlyAttention = true"
          >
            Needs attention
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
        @action="fetchMonitors"
      />

      <SentryCronTable
        v-if="shown.length"
        :monitors="shown"
        :now="now"
      />
      <StatusPanel
        v-else
        compact
        title="No job matches"
        action-label="Clear filter"
        data-test="crons-no-match"
        @action="clearFilter"
      />

      <p class="crons-page__faint">
        Times are in each job's time zone. A job appears with its first check-in; «Missed» is set when no
        check-in comes within the job's margin, «Missed?» when Buggregator was not running at that time.
      </p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use 'src/pages/sentry/ui/sentry-crons-page/crons-page' as cp;

.crons-page {
  @apply text-gray-800 dark:text-gray-200;

  display: flex;
  flex-direction: column;
  min-width: 0;
  font-size: 13px;
}

.crons-page__body,
.crons-page__loading {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  min-width: 0;
}

.crons-page__faint {
  @apply text-gray-500 dark:text-gray-400;

  margin: 0;
  font-size: 12px;
}

.crons-page__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 16px;
}

.crons-page__summary {
  @apply text-gray-500 dark:text-gray-400;

  flex: 1 1 auto;
  margin: 0;

  b {
    @apply text-gray-900 dark:text-gray-100;

    font-weight: 600;
  }

  .crons-page__bad {
    color: #dc2626;

    .dark & {
      color: #f87171;
    }
  }
}

.crons-page__filter {
  display: flex;
  width: 240px;
}

.crons-page__seg {
  @apply border border-gray-300 dark:border-gray-600;

  display: inline-flex;
  border-radius: 4px;
  overflow: hidden;

  button {
    @include cp.focus-ring;
    @apply text-gray-600 dark:text-gray-400 border-l border-gray-300 dark:border-gray-600;

    padding: 4px 10px;
    background: none;
    font-size: 12px;
    cursor: pointer;

    &:first-child {
      border-left: 0;
    }

    &[aria-pressed='true'] {
      @apply bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100;

      font-weight: 600;
    }
  }
}

@media (max-width: 639px) {
  .crons-page__body,
  .crons-page__loading {
    padding: 12px;
  }

  .crons-page__filter {
    width: 100%;
  }

  .crons-page__seg button {
    padding: 10px 12px;
    font-size: 13px;
  }
}
</style>
