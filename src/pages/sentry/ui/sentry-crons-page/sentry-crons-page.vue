<script lang="ts" setup>
import { useTitle } from '@vueuse/core'
import { computed, ref } from 'vue'
import { SetupHelpPanel } from '@/widgets/ui'
import { SentryCronTable, monitorStatus, needsAttention, summarizeMonitors, useCronClock, useCronMonitors } from '@/entities/sentry'
import { StatusPanel } from '@/shared/ui'

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

const isSetupOpen = ref(false)
const pingExample = `curl -fsS ${window.location.origin}/ping/my-job`
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
      data-test="crons-loading"
    >
      <div
        v-for="i in 5"
        :key="i"
        class="crons-page__skeleton-row"
        aria-hidden="true"
      >
        <span
          v-for="j in 5"
          :key="j"
          class="crons-page__skeleton"
        />
      </div>
      <p
        class="crons-page__faint"
        role="status"
      >
        Loading cron jobs…
      </p>
    </div>

    <section
      v-else-if="!monitors.length"
      class="crons-page__empty"
      data-test="crons-empty"
    >
      <h2 class="crons-page__empty-title">
        No cron jobs yet
      </h2>
      <p>
        A job shows up here with its first check-in: when it ran, how long it took, whether it failed,
        and whether it missed a run.
      </p>
      <p>
        Send check-ins from the Sentry SDK (<code>captureCheckIn</code>, <code>withMonitor</code>,
        Laravel <code>-&gt;sentryMonitor()</code>), or call the ping URL at the end of any script:
      </p>
      <pre class="crons-page__code">{{ pingExample }}</pre>
      <button
        type="button"
        class="crons-page__button"
        data-test="crons-setup"
        @click="isSetupOpen = true"
      >
        How to set up cron monitoring
      </button>
    </section>

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
        <input
          v-model="query"
          type="search"
          class="crons-page__filter"
          placeholder="Filter jobs"
          aria-label="Filter jobs"
        >
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
      <p
        v-else
        class="crons-page__faint"
      >
        No job matches.
      </p>

      <p class="crons-page__faint">
        Times are in each job's time zone. A job appears with its first check-in; «Missed» is set when no
        check-in comes within the job's margin, «Missed?» when Buggregator was not running at that time.
      </p>
    </div>

    <SetupHelpPanel
      v-if="isSetupOpen"
      section-id="crons"
      section-title="Crons"
      @close="isSetupOpen = false"
    />
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

.crons-page__skeleton-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 2fr;
  gap: 24px;
  padding: 12px;
}

.crons-page__skeleton {
  @include cp.skeleton;
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
  @include cp.focus-ring;
  @apply bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100;

  height: 32px;
  width: 240px;
  padding: 0 10px;
  border-radius: 4px;
  font-size: 13px;
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

.crons-page__empty {
  @apply text-gray-600 dark:text-gray-400;

  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 760px;
  padding: 24px 16px;

  p {
    margin: 0;
  }

  code {
    font-family: 'JetBrains Mono Variable', ui-monospace, monospace;
    font-variant-ligatures: none;
    font-size: 12px;
  }
}

.crons-page__empty-title {
  @apply text-gray-900 dark:text-gray-100;

  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.crons-page__code {
  @apply bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700;

  margin: 0;
  padding: 10px 12px;
  border-radius: 4px;
  overflow-x: auto;
  font-family: 'JetBrains Mono Variable', ui-monospace, monospace;
  font-variant-ligatures: none;
  font-size: 12px;
}

.crons-page__button {
  @include cp.focus-ring;
  @apply bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200;
  @apply hover:bg-gray-50 dark:hover:bg-gray-700;

  align-self: flex-start;
  height: 32px;
  padding: 0 12px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

@media (max-width: 639px) {
  .crons-page__body,
  .crons-page__loading {
    padding: 12px;
  }

  .crons-page__skeleton-row {
    grid-template-columns: 1fr 1fr;
  }

  .crons-page__filter {
    width: 100%;
    height: 44px;
  }

  .crons-page__seg button {
    padding: 10px 12px;
    font-size: 13px;
  }

  .crons-page__button {
    height: 44px;
  }
}
</style>
