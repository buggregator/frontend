<script lang="ts" setup>
import { computed } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import { RouteName } from '@/shared/types'
import { formatClock, formatRelative } from '../../lib/crons'
import { attemptsLabel, durationShare, formatJobMs, jobName, jobStatus, localTimeZone, QUEUE_STATUS } from '../../lib/queues'
import { useRowLink } from '../../lib/use-row-link'
import type { QueueJob } from '../../types'
import CronStatusBadge from '../sentry-crons/cron-status-badge.vue'

// The Queues tab (#6713): one row per job, newest last attempt first. The
// job name is the row's link (Tab, Enter); a click on the row opens it too.
const props = defineProps<{ jobs: QueueJob[]; now: number }>()

const open = useRowLink()
const tz = localTimeZone()

const rows = computed(() => {
  const max = Math.max(0, ...props.jobs.map((j) => j.duration_ms ?? 0))
  return props.jobs.map((j) => {
    const status = jobStatus(j)
    return {
      j,
      to: { name: RouteName.SentryQueueJob, params: { id: j.id } } as RouteLocationRaw,
      meta: QUEUE_STATUS[status],
      status,
      name: jobName(j.job),
      attempts: attemptsLabel(j),
      duration: formatJobMs(j.duration_ms),
      share: durationShare(j.duration_ms, max),
      finished: formatRelative(j.finished_at, props.now) || '—',
      clock: formatClock(j.finished_at, tz, props.now, true)
    }
  })
})
</script>

<template>
  <div class="queue-table">
    <table class="queue-table__table">
      <caption class="queue-table__caption">
        Queue jobs
      </caption>
      <thead>
        <tr>
          <th scope="col">
            Job
          </th>
          <th scope="col">
            Status
          </th>
          <th scope="col">
            Queue
          </th>
          <th scope="col">
            Attempts
          </th>
          <th scope="col">
            Duration
          </th>
          <th scope="col">
            Finished
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="r in rows"
          :key="r.j.id"
          class="queue-table__row"
          data-test="queue-row"
          @click="open($event, r.to)"
          @auxclick="open($event, r.to)"
        >
          <td class="queue-table__job">
            <RouterLink
              :to="r.to"
              class="queue-table__name"
              :title="r.j.job"
            >
              {{ r.name.short }}
            </RouterLink>
            <span
              v-if="r.name.ns"
              class="queue-table__ns"
            >{{ r.name.ns }}</span>
          </td>
          <td class="queue-table__status">
            <CronStatusBadge
              :status="r.status"
              :meta="r.meta"
            />
          </td>
          <td class="queue-table__queue">
            <span
              class="queue-table__chip"
              :title="r.j.connection ? `connection ${r.j.connection}` : undefined"
            >{{ r.j.queue || 'default' }}</span>
          </td>
          <td class="queue-table__attempts">
            <span>{{ r.attempts.text }}</span>
            <span
              v-if="r.attempts.note"
              class="queue-table__sub queue-table__sub--bad"
            >{{ r.attempts.note }}</span>
          </td>
          <td class="queue-table__duration">
            <span class="queue-table__mono">{{ r.duration }}</span>
            <span
              class="queue-table__track"
              aria-hidden="true"
            ><span
              class="queue-table__bar"
              :class="`queue-table__bar--${r.meta.tone}`"
              :style="{ width: `${r.share}%` }"
            /></span>
          </td>
          <td
            class="queue-table__finished"
            :title="r.clock || undefined"
          >
            {{ r.finished }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style lang="scss" scoped>
@use 'src/entities/sentry/ui/sentry-crons/cron-tokens' as cr;

.queue-table {
  @include cr.tokens;
  @include cr.panel;

  overflow-x: auto;
}

.queue-table__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.queue-table__caption {
  @include cr.visually-hidden;
}

th,
td {
  @apply border-b border-gray-200 dark:border-gray-700;

  text-align: left;
  vertical-align: top;
}

thead th {
  @apply text-gray-500 dark:text-gray-400;

  padding: 8px 12px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

td {
  @apply text-gray-800 dark:text-gray-200;

  padding: 10px 12px;
}

tbody tr:last-child td {
  border-bottom: 0;
}

.queue-table__row {
  cursor: pointer;

  &:hover td {
    @apply bg-gray-50 dark:bg-gray-700/40;
  }
}

.queue-table__job {
  min-width: 0;
  max-width: 380px;
}

.queue-table__name {
  @include cr.focus-ring;
  @include cr.mono;
  @apply text-gray-900 dark:text-gray-100;

  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
    text-underline-offset: 2px;
  }
}

.queue-table__ns,
.queue-table__sub {
  @apply text-gray-500 dark:text-gray-400;

  display: block;
  margin-top: 2px;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.queue-table__sub--bad {
  color: var(--cr-err);
}

.queue-table__chip {
  @include cr.mono;
  @apply text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600;

  padding: 0 6px;
  border-radius: 3px;
  font-size: 11px;
  line-height: 18px;
  white-space: nowrap;
}

.queue-table__mono {
  @include cr.mono;
}

.queue-table__attempts,
.queue-table__finished,
.queue-table__status {
  white-space: nowrap;
}

.queue-table__duration {
  min-width: 110px;
  white-space: nowrap;
}

.queue-table__track {
  display: block;
  height: 4px;
  margin-top: 4px;
  border-radius: 2px;
  background: var(--cr-track);
  overflow: hidden;
}

.queue-table__bar {
  display: block;
  height: 100%;
  border-radius: 2px;
}

.queue-table__bar--ok {
  background: var(--cr-ok);
}

.queue-table__bar--err {
  background: var(--cr-err);
}

.queue-table__bar--miss {
  background: var(--cr-miss);
}

// Phone: each job is a small card: name and status, then queue, attempts,
// duration and when.
@media (max-width: 639px) {
  .queue-table {
    overflow: visible;
  }

  .queue-table__table,
  .queue-table__table tbody {
    display: block;
  }

  .queue-table__table thead {
    display: none;
  }

  .queue-table__row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 6px 12px;
    padding: 12px;

    @apply border-b border-gray-200 dark:border-gray-700;

    &:last-child {
      border-bottom: 0;
    }

    td {
      display: block;
      padding: 0;
      border: 0;
    }
  }

  .queue-table__job {
    max-width: none;
  }

  .queue-table__status,
  .queue-table__attempts,
  .queue-table__finished {
    text-align: right;
  }

  .queue-table__attempts {
    span {
      display: inline;
    }

    &::before {
      content: 'attempts ';
      color: var(--cr-wait);
    }

    .queue-table__sub {
      margin-left: 6px;
    }
  }

  .queue-table__duration {
    min-width: 0;
  }
}
</style>
