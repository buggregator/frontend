<script lang="ts" setup>
import { computed } from 'vue'
import { RouteName } from '@/shared/types'
import { EventDetailSection, TableBase, TableBaseRow } from '@/shared/ui'
import { formatClock, formatRelative } from '../../lib/crons'
import {
  attemptScale,
  attemptsLabel,
  attemptStatus,
  formatJobMs,
  jobName,
  jobStatus,
  localTimeZone,
  QUEUE_STATUS,
  statusLine
} from '../../lib/queues'
import type { QueueJobDetail } from '../../types'
import CronStatusBadge from '../sentry-crons/cron-status-badge.vue'

// The page of one queue job (#6713): how it ended in words, where it was
// queued from, its attempts on one time scale with the pauses between them,
// and each attempt's exception and trace.
const props = defineProps<{ job: QueueJobDetail; now: number }>()

const j = computed(() => props.job)
const name = computed(() => jobName(j.value.job))
const status = computed(() => jobStatus(j.value))
const meta = computed(() => QUEUE_STATUS[status.value])
const headline = computed(() => statusLine(j.value))
const attemptsKpi = computed(() => {
  const a = attemptsLabel(j.value)
  return a.note ? `${a.text} · ${a.note}` : a.text
})
const scale = computed(() => attemptScale(j.value.attempt_list))
const tz = localTimeZone()
const clock = (iso: string | null) => (iso ? formatClock(iso, tz, props.now, true) : '')

const attempts = computed(() =>
  j.value.attempt_list.map((a) => {
    const s = attemptStatus(a)
    return {
      a,
      status: s,
      meta: QUEUE_STATUS[s],
      when: clock(a.finished_at ?? a.started_at),
      duration: formatJobMs(a.duration_ms),
      waited: a.latency_ms === null ? '' : formatJobMs(a.latency_ms),
      gap: a.gap_ms === null ? '' : formatJobMs(a.gap_ms)
    }
  })
)
</script>

<template>
  <article class="queue-job">
    <nav
      class="queue-job__crumb"
      aria-label="Breadcrumb"
    >
      <RouterLink
        :to="{ name: RouteName.SentryQueues }"
        class="queue-job__link"
      >
        Queues
      </RouterLink>
      <span aria-hidden="true">/</span>
      <span>{{ name.short }}</span>
    </nav>

    <header class="queue-job__head">
      <h2
        class="queue-job__title"
        :title="j.job"
      >
        {{ name.short }}
      </h2>
      <p
        v-if="name.ns"
        class="queue-job__ns"
      >
        {{ j.job }}
      </p>
      <div class="queue-job__meta">
        <!-- The status in a sentence: «✕ Failed after 3 attempts». -->
        <CronStatusBadge
          class="queue-job__headline"
          :status="status"
          :meta="{ ...meta, label: headline }"
          data-test="queue-headline"
        />
        <span>queue <b>{{ j.queue || 'default' }}</b><template v-if="j.connection"> · {{ j.connection }}</template></span>
        <span
          v-if="j.finished_at"
          :title="clock(j.finished_at)"
        >finished {{ formatRelative(j.finished_at, now) }}</span>
      </div>
    </header>

    <p
      class="queue-job__from"
      data-test="queue-dispatched"
    >
      <span class="queue-job__faint">Dispatched from</span>
      <RouterLink
        v-if="j.dispatched_by"
        :to="{ name: RouteName.SentryTraceDetail, params: { traceId: j.dispatched_by.trace_id } }"
        class="queue-job__link queue-job__mono"
      >
        {{ j.dispatched_by.transaction_name || 'the request' }}
      </RouterLink>
      <span
        v-else
        class="queue-job__faint"
      >— not known: the trace that queued it is not stored here</span>
    </p>

    <dl class="queue-job__kpis">
      <div>
        <dt>attempts</dt>
        <dd>{{ attemptsKpi }}</dd>
      </div>
      <div>
        <dt>last attempt took</dt>
        <dd>{{ formatJobMs(j.duration_ms) }}</dd>
      </div>
      <div>
        <dt>waited in the queue</dt>
        <dd>{{ formatJobMs(j.latency_ms) }}</dd>
      </div>
      <div>
        <dt>first started</dt>
        <dd class="queue-job__small">
          {{ clock(j.started_at) || '—' }}
        </dd>
      </div>
    </dl>

    <EventDetailSection
      class="queue-job__panel"
      title="Attempts"
      :count="attempts.length"
    >
      <template #actions>
        <span class="queue-job__faint">oldest first · {{ tz }}</span>
      </template>

      <div
        v-if="scale.bars.length > 1"
        class="queue-job__scale"
        role="img"
        :aria-label="`${attempts.length} attempts on a time scale, with the pauses between them`"
        data-test="queue-scale"
      >
        <span
          v-for="gap in scale.gaps"
          :key="gap.key"
          class="queue-job__gap"
          :style="{ left: `${gap.left}%`, width: `${gap.width}%` }"
          :title="`Pause of ${gap.label}`"
        ><span class="queue-job__gap-label">{{ gap.label }}</span></span>
        <span
          v-for="bar in scale.bars"
          :key="bar.key"
          class="queue-job__bar"
          :class="[`queue-job__bar--${bar.tone}`, { 'queue-job__bar--end': bar.left + bar.width > 90 }]"
          :style="{ left: `${bar.left}%`, width: `${bar.width}%` }"
          :title="bar.title"
        ><span class="queue-job__bar-label">{{ bar.label }}</span></span>
      </div>

      <ol class="queue-job__attempts">
        <li
          v-for="r in attempts"
          :key="r.a.transaction_id || r.a.attempt"
          class="queue-job__attempt"
          data-test="queue-attempt"
        >
          <p
            v-if="r.gap"
            class="queue-job__pause"
            data-test="queue-pause"
          >
            paused {{ r.gap }} before this attempt
          </p>
          <div class="queue-job__attempt-head">
            <b>Attempt #{{ r.a.attempt }}</b>
            <CronStatusBadge
              :status="r.status"
              :meta="r.meta"
            />
            <span class="queue-job__mono">{{ r.duration }}</span>
            <span
              v-if="r.waited"
              class="queue-job__faint"
            >waited {{ r.waited }}</span>
            <span
              v-if="r.when"
              class="queue-job__faint queue-job__mono"
            >{{ r.when }}</span>
            <RouterLink
              v-if="r.a.trace_id"
              :to="{ name: RouteName.SentryTraceDetail, params: { traceId: r.a.trace_id } }"
              class="queue-job__link queue-job__trace"
            >
              Trace of attempt #{{ r.a.attempt }}
            </RouterLink>
          </div>
          <ul
            v-if="r.a.errors.length"
            class="queue-job__errors"
          >
            <li
              v-for="e in r.a.errors"
              :key="e.id"
              data-test="queue-error"
            >
              <RouterLink
                :to="{ name: RouteName.SentryExceptionDetail, params: { id: e.id } }"
                class="queue-job__error"
              >
                <b>{{ e.exception_type || 'Error' }}</b>
                <span v-if="e.exception_value">: {{ e.exception_value }}</span>
              </RouterLink>
            </li>
          </ul>
          <p
            v-else-if="r.a.failed"
            class="queue-job__faint"
          >
            No exception of this attempt was stored.
          </p>
        </li>
      </ol>
    </EventDetailSection>

    <EventDetailSection
      class="queue-job__panel"
      title="Details"
    >
      <TableBase>
        <TableBaseRow
          title="Job"
          :copy-value="j.job"
        >
          <span class="queue-job__mono">{{ j.job }}</span>
        </TableBaseRow>
        <TableBaseRow
          v-if="j.message_id"
          title="Message ID"
          :copy-value="j.message_id"
        >
          <span class="queue-job__mono">{{ j.message_id }}</span>
        </TableBaseRow>
        <TableBaseRow title="Queue">
          {{ j.queue || 'default' }}
        </TableBaseRow>
        <TableBaseRow
          v-if="j.connection"
          title="Connection"
        >
          {{ j.connection }}
        </TableBaseRow>
        <TableBaseRow title="Project">
          {{ j.project }}
        </TableBaseRow>
        <TableBaseRow title="Payload">
          <span class="queue-job__faint">Sentry does not send the job payload.</span>
        </TableBaseRow>
      </TableBase>
    </EventDetailSection>

    <p
      class="queue-job__note"
      data-test="queue-retry-note"
    >
      Retries are run by your queue worker. Buggregator shows them; it does not retry jobs.
      A failed job shows the same whether the worker will try it again or has given up: Sentry does not say which.
    </p>
  </article>
</template>

<style lang="scss" scoped>
@use 'src/entities/sentry/ui/sentry-crons/cron-tokens' as cr;

.queue-job {
  @include cr.tokens;
  @apply text-gray-800 dark:text-gray-200;

  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  font-size: 13px;
  min-width: 0;
}

.queue-job__crumb {
  @apply text-gray-500 dark:text-gray-400;

  display: flex;
  gap: 6px;
  font-size: 12px;
  min-width: 0;
  overflow-wrap: anywhere;
}

.queue-job__link {
  @include cr.link;
}

.queue-job__mono {
  @include cr.mono;
}

.queue-job__faint {
  @apply text-gray-500 dark:text-gray-400;

  font-size: 12px;
}

.queue-job__head {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.queue-job__title {
  @include cr.mono;
  @apply text-gray-900 dark:text-gray-100;

  margin: 0;
  font-size: 20px;
  font-weight: 600;
  word-break: break-all;
}

.queue-job__ns {
  @include cr.mono;
  @apply text-gray-500 dark:text-gray-400;

  margin: 0;
  font-size: 12px;
  overflow-wrap: anywhere;
}

.queue-job__meta {
  @apply text-gray-500 dark:text-gray-400;

  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 16px;
  margin-top: 2px;
  font-size: 12px;

  b {
    @apply text-gray-800 dark:text-gray-200;

    font-weight: 500;
  }
}

.queue-job__meta .queue-job__headline {
  font-size: 13px;
}

.queue-job__from {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 8px;
  margin: 0;
  overflow-wrap: anywhere;
}

.queue-job__kpis {
  @include cr.kpis;
}

.queue-job__kpis .queue-job__small {
  font-size: 13px;
  line-height: 27px;
}

.queue-job__panel {
  min-width: 0;
  margin-top: 8px;
}

.queue-job__scale {
  @include cr.panel;

  position: relative;
  height: 56px;
  margin-bottom: 8px;
  overflow: hidden;
}

.queue-job__bar,
.queue-job__gap {
  position: absolute;
  top: 10px;
  height: 18px;
}

.queue-job__bar {
  min-width: 4px;
  border-radius: 2px;
}

.queue-job__bar--ok {
  background: var(--cr-ok);
}

.queue-job__bar--err {
  background: var(--cr-err);
}

.queue-job__bar-label,
.queue-job__gap-label {
  @include cr.mono;

  position: absolute;
  top: 22px;
  left: 0;
  font-size: 11px;
  white-space: nowrap;
}

.queue-job__bar-label {
  @apply text-gray-700 dark:text-gray-300;
}

// The last bar's label sits under its right edge: no clipping at the end.
.queue-job__bar--end .queue-job__bar-label {
  left: auto;
  right: 0;
}

.queue-job__gap {
  border-bottom: 1px dashed var(--cr-future);
  height: 9px;
}

.queue-job__gap-label {
  @apply text-gray-500 dark:text-gray-400;

  top: 12px;
  left: 50%;
  transform: translateX(-50%);
}

.queue-job__attempts {
  @include cr.panel;

  margin: 0;
  padding: 0;
  list-style: none;
}

.queue-job__attempt {
  @apply border-b border-gray-200 dark:border-gray-700;

  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 14px;

  &:last-child {
    border-bottom: 0;
  }

  p {
    margin: 0;
  }
}

.queue-job__pause {
  @apply text-gray-500 dark:text-gray-400;

  font-size: 12px;
  font-style: italic;
}

.queue-job__attempt-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 14px;
}

.queue-job__trace {
  margin-left: auto;
}

.queue-job__errors {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.queue-job__error {
  @include cr.focus-ring;
  @include cr.mono;

  display: inline-block;
  color: var(--cr-err);
  font-size: 12px;
  overflow-wrap: anywhere;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
    text-underline-offset: 2px;
  }
}

.queue-job__note {
  @apply text-gray-500 dark:text-gray-400;

  margin: 0;
  font-size: 12px;
}

@media (max-width: 639px) {
  .queue-job {
    padding: 12px;
  }

  .queue-job__trace {
    margin-left: 0;
  }
}
</style>
