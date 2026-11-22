<script lang="ts" setup>
import { computed } from 'vue'
import { formatDuration } from '@/shared/lib/formats/format-duration'
import { RouteName } from '@/shared/types'
import { CodeSnippet, EventDetailSection, StatusPanel } from '@/shared/ui'
import {
  checkInNote,
  CRON_STATUS,
  describeSchedule,
  durationBars,
  explainMonitor,
  formatClock,
  knownTimeZone,
  monitorStatus,
  nextRun,
  runStats,
  runStatus
} from '../../lib/crons'
import type { CronCheckIn, CronMonitor } from '../../types'
import CronStatusBadge from './cron-status-badge.vue'

// The page of one cron job (#6617, design #6600 A): what is wrong in words,
// four numbers, run durations, and every check-in with its reason and trace.
const props = defineProps<{
  monitor: CronMonitor
  checkins: CronCheckIn[]
  now: number
  hasOlder?: boolean
  loadingOlder?: boolean
}>()

const emit = defineEmits<{ loadOlder: [] }>()

// «8.4 s», «4 min 12 s»; «—» without a duration.
const duration = (ms: number | null) => (ms === null || ms < 0 ? '—' : formatDuration(ms, { unit: 'ms', style: 'compact' }))

// The ping URL query, written as it must be sent (encoded, like the setup guide).
const scheduleExample = `?schedule=${encodeURIComponent('*/5 * * * *')}&margin=1&max_runtime=30`

const m = computed(() => props.monitor)
const tz = computed(() => knownTimeZone(m.value.timezone))
const status = computed(() => monitorStatus(m.value, props.now))
const schedule = computed(() => describeSchedule(m.value.schedule))
const explain = computed(() => explainMonitor(m.value, props.now))
const stats = computed(() => runStats(props.checkins))
const next = computed(() => nextRun(m.value, props.now))
const bars = computed(() => durationBars(props.checkins, m.value, props.now))
const environment = computed(() => props.checkins.find((c) => c.environment)?.environment ?? '')
const isPing = computed(() => m.value.source === 'ping')

const pingBase = computed(() => {
  const project = m.value.project && m.value.project !== 'default' ? `?project=${encodeURIComponent(m.value.project)}` : ''
  const base = `${window.location.origin}/ping/${encodeURIComponent(m.value.slug)}`
  return { ok: `${base}${project}`, start: `${base}/start${project}`, fail: `${base}/fail${project}` }
})
const pingCommands = computed(() =>
  [
    `curl -fsS "${pingBase.value.start}"   # started`,
    `curl -fsS "${pingBase.value.ok}"   # finished`,
    `curl -fsS "${pingBase.value.fail}"   # failed`
  ].join('\n')
)

const rows = computed(() =>
  props.checkins.map((c) => {
    const s = runStatus(c.status)
    return {
      c,
      status: s,
      bad: CRON_STATUS[s].tone === 'err',
      // A row the server wrote is a slot, not a start.
      when: formatClock(c.server_made ? (c.expected_at ?? c.started_at) : c.started_at, tz.value, props.now, !c.server_made),
      duration: c.server_made || c.status === 'in_progress' ? '—' : duration(c.duration_ms),
      note: checkInNote(c, m.value, props.now),
      output: c.status !== 'error' || c.body.trim().split(/\r?\n/).length > 1 ? c.body.trim() : ''
    }
  })
)
</script>

<template>
  <article class="cron-job">
    <nav
      class="cron-job__crumb"
      aria-label="Breadcrumb"
    >
      <RouterLink
        :to="{ name: RouteName.SentryCrons }"
        class="cron-job__link"
      >
        Crons
      </RouterLink>
      <span aria-hidden="true">/</span>
      <span>{{ m.slug }}</span>
    </nav>

    <header class="cron-job__head">
      <h2 class="cron-job__title">
        {{ m.slug }}
      </h2>
      <div class="cron-job__meta">
        <CronStatusBadge :status="status" />
        <span>
          {{ schedule.words }}<template v-if="schedule.expr">
            · <code class="cron-job__mono">{{ schedule.expr }}</code></template> · {{ tz }}
        </span>
        <span>margin <b>{{ m.checkin_margin }} min</b></span>
        <span>max runtime <b>{{ m.max_runtime }} min</b></span>
        <span v-if="environment">env <b>{{ environment }}</b></span>
        <span class="cron-job__src">{{ isPing ? 'ping URL' : 'Sentry SDK' }}</span>
      </div>
    </header>

    <div
      v-if="explain"
      class="cron-job__alert"
      :class="`cron-job__alert--${explain.tone}`"
      data-test="cron-explain"
    >
      <span
        class="cron-job__alert-icon"
        aria-hidden="true"
      >{{ CRON_STATUS[status].icon }}</span>
      <p>
        <b>{{ explain.title }}</b> {{ explain.text }}
      </p>
    </div>

    <p
      v-if="!schedule.expr"
      class="cron-job__hint"
      data-test="cron-no-schedule"
    >
      No schedule: runs are recorded, but none is ever marked missed.
      <template v-if="isPing">
        Add one to the ping URL, e.g. <code class="cron-job__mono">{{ scheduleExample }}</code>.
      </template>
      <template v-else>
        Send a monitor config with the check-in (schedule, check-in margin, max runtime).
      </template>
    </p>

    <dl class="cron-job__kpis">
      <div class="cron-job__kpi">
        <dt>runs OK (last {{ checkins.length }})</dt>
        <dd>{{ stats.ok }} / {{ stats.total }}</dd>
      </div>
      <div class="cron-job__kpi">
        <dt>usual duration</dt>
        <dd>{{ duration(stats.median) }}</dd>
      </div>
      <div class="cron-job__kpi">
        <dt>slowest</dt>
        <dd>{{ duration(stats.slowest) }}</dd>
      </div>
      <div class="cron-job__kpi">
        <dt>{{ next.clock ? `next expected, ${next.clock}` : 'next expected' }}</dt>
        <dd>{{ next.text }}</dd>
      </div>
    </dl>

    <EventDetailSection
      v-if="bars.length"
      class="cron-job__panel"
      :title="`Last ${bars.length} runs`"
    >
      <template #actions>
        <span class="cron-job__faint">bar height = duration · hollow box = no run · stub = no duration</span>
      </template>
      <div
        class="cron-job__bars"
        role="img"
        :aria-label="`Durations of the last ${bars.length} runs`"
      >
        <span
          v-for="bar in bars"
          :key="bar.key"
          class="cron-job__bar"
          :class="[`cron-job__bar--${bar.tone}`, { 'cron-job__bar--hollow': bar.height === null }]"
          :style="bar.height === null ? undefined : { height: `${bar.height}%` }"
          :title="bar.title"
        />
      </div>
    </EventDetailSection>

    <EventDetailSection
      class="cron-job__panel"
      title="Check-ins"
    >
      <template #actions>
        <span class="cron-job__faint">newest first · {{ tz }}</span>
      </template>
      <StatusPanel
        v-if="!rows.length"
        compact
        title="No check-ins yet"
        data-test="cron-no-checkins"
      />
      <div
        v-else
        class="cron-job__scroll"
      >
        <table class="cron-job__table">
          <thead>
            <tr>
              <th scope="col">
                When
              </th>
              <th scope="col">
                Status
              </th>
              <th scope="col">
                Duration
              </th>
              <th scope="col">
                What happened
              </th>
              <th scope="col">
                <span class="cron-job__hidden">Links</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="r in rows"
              :key="r.c.id"
              data-test="cron-checkin"
            >
              <td class="cron-job__mono">
                {{ r.when }}
              </td>
              <td>
                <CronStatusBadge :status="r.status" />
              </td>
              <td class="cron-job__mono">
                {{ r.duration }}
              </td>
              <td class="cron-job__note">
                <span
                  v-if="r.note"
                  :class="r.bad ? 'cron-job__why' : 'cron-job__faint'"
                >{{ r.note }}</span>
                <span
                  v-else
                  class="cron-job__faint"
                >—</span>
                <details
                  v-if="r.output"
                  class="cron-job__output"
                >
                  <summary>Output</summary>
                  <CodeSnippet
                    class="cron-job__output-code"
                    :code="r.output"
                  />
                </details>
              </td>
              <td>
                <RouterLink
                  v-if="r.c.trace_id"
                  :to="{ name: RouteName.SentryTraceDetail, params: { traceId: r.c.trace_id } }"
                  class="cron-job__link"
                >
                  trace
                </RouterLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div
        v-if="hasOlder"
        class="cron-job__more"
      >
        <button
          type="button"
          class="cron-job__link cron-job__more-btn"
          :disabled="loadingOlder"
          @click="emit('loadOlder')"
        >
          {{ loadingOlder ? 'Loading…' : 'Show older check-ins' }}
        </button>
      </div>
    </EventDetailSection>

    <EventDetailSection
      v-if="isPing"
      class="cron-job__panel"
      title="Ping URLs of this job"
    >
      <CodeSnippet
        language="bash"
        :code="pingCommands"
        data-test="cron-ping-urls"
      />
    </EventDetailSection>
  </article>
</template>

<style lang="scss" scoped>
@use 'src/entities/sentry/ui/sentry-crons/cron-tokens' as cr;

.cron-job {
  @include cr.tokens;
  @apply text-gray-800 dark:text-gray-200;

  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  font-size: 13px;
  min-width: 0;
}

.cron-job__crumb {
  @apply text-gray-500 dark:text-gray-400;

  display: flex;
  gap: 6px;
  font-size: 12px;
  min-width: 0;
  overflow-wrap: anywhere;
}

.cron-job__link {
  @include cr.link;
}

.cron-job__head {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cron-job__title {
  @apply text-gray-900 dark:text-gray-100;

  margin: 0;
  font-family: 'JetBrains Mono Variable', ui-monospace, monospace;
  font-variant-ligatures: none;
  font-size: 20px;
  font-weight: 600;
  word-break: break-all;
}

.cron-job__meta {
  @apply text-gray-500 dark:text-gray-400;

  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 16px;
  font-size: 12px;

  b {
    @apply text-gray-800 dark:text-gray-200;

    font-weight: 500;
  }
}

.cron-job__mono {
  font-family: 'JetBrains Mono Variable', ui-monospace, monospace;
  font-variant-ligatures: none;
}

.cron-job__src {
  @apply border border-gray-300 dark:border-gray-600;

  padding: 0 6px;
  border-radius: 3px;
  font-family: 'JetBrains Mono Variable', ui-monospace, monospace;
  font-size: 11px;
  line-height: 18px;
}

.cron-job__alert {
  @apply bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700;

  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 10px 14px;
  border-radius: 6px;

  p {
    margin: 0;
  }

  b {
    @apply text-gray-900 dark:text-gray-100;
  }
}

.cron-job__alert-icon {
  flex: none;
  font-family: 'JetBrains Mono Variable', ui-monospace, monospace;
  font-weight: 700;
}

.cron-job__alert--err {
  border-color: var(--cr-err);

  .cron-job__alert-icon {
    color: var(--cr-err);
  }
}

.cron-job__alert--miss {
  border-color: var(--cr-miss);

  .cron-job__alert-icon {
    color: var(--cr-miss);
  }
}

.cron-job__alert--wait .cron-job__alert-icon {
  color: var(--cr-wait);
}

.cron-job__hint {
  @apply text-gray-500 dark:text-gray-400;

  margin: 0;
  font-size: 12px;
}

.cron-job__kpis {
  @include cr.kpis;
}

.cron-job__panel {
  min-width: 0;
  margin-top: 8px;
}

.cron-job__faint {
  @apply text-gray-500 dark:text-gray-400;

  font-weight: 400;
  font-size: 12px;
}

.cron-job__bars {
  @apply bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700;

  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 120px;
  padding: 10px 14px;
  border-radius: 6px;
}

.cron-job__bar {
  flex: 1 1 0;
  max-width: 32px;
  min-width: 4px;
  border-radius: 2px;
  box-sizing: border-box;
}

.cron-job__bar--ok {
  background: var(--cr-ok);
}

.cron-job__bar--err {
  background: var(--cr-err);
}

.cron-job__bar--run {
  background: var(--cr-run);
  height: 10%;
}

.cron-job__bar--hollow {
  height: 30%;
  background: transparent;
  border: 1.5px solid var(--cr-miss);
}

.cron-job__bar--wait.cron-job__bar--hollow {
  border: 1px dashed var(--cr-future);
}

.cron-job__scroll {
  @apply bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700;

  overflow-x: auto;
  border-radius: 6px;
}

.cron-job__table {
  width: 100%;
  border-collapse: collapse;

  th,
  td {
    @apply border-b border-gray-200 dark:border-gray-700;

    padding: 8px 14px;
    text-align: left;
    vertical-align: top;
    white-space: nowrap;
  }

  th {
    @apply text-gray-500 dark:text-gray-400;

    font-size: 12px;
    font-weight: 500;
  }

  tr:last-child td {
    border-bottom: 0;
  }
}

.cron-job__note {
  white-space: normal !important;
  min-width: 220px;
}

.cron-job__why {
  color: var(--cr-err);
  font-family: 'JetBrains Mono Variable', ui-monospace, monospace;
  font-size: 12px;
  overflow-wrap: anywhere;
}

.cron-job__output {
  margin-top: 4px;

  summary {
    @include cr.focus-ring;
    @apply text-gray-500 dark:text-gray-400;

    cursor: pointer;
    font-size: 12px;
  }
}

.cron-job__output-code {
  margin-top: 4px;
  max-height: 240px;
  overflow: auto;

  // Long output lines wrap: the snippet's own <pre> keeps them on one line.
  :deep(pre),
  :deep(code) {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
}

.cron-job__hidden {
  @include cr.visually-hidden;
}

.cron-job__more {
  padding: 8px 0;
}

.cron-job__more-btn {
  background: none;
  border: 0;
  padding: 0;
  cursor: pointer;

  &:disabled {
    cursor: default;
    opacity: 0.6;
  }
}

@media (max-width: 639px) {
  .cron-job {
    padding: 12px;
  }

  .cron-job__table th,
  .cron-job__table td {
    padding: 8px 10px;
  }

  .cron-job__note {
    min-width: 180px;
  }
}
</style>
