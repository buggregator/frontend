<script lang="ts" setup>
import { computed } from 'vue'
import { useRouter, type RouteLocationRaw } from 'vue-router'
import { RouteName } from '@/shared/types'
import {
  describeSchedule,
  groupMonitors,
  historyStrip,
  lastRun,
  monitorStatus,
  nextRun
} from '../../lib/crons'
import type { CronMonitor } from '../../types'
import CronHistoryStrip from './cron-history-strip.vue'
import CronStatusBadge from './cron-status-badge.vue'

// The Crons tab (#6617, design #6600 A): one row per monitor, problems
// first. The job name is the row's link, so rows are reachable with Tab and
// open with Enter; a click anywhere on the row opens it too.
const props = defineProps<{ monitors: CronMonitor[]; now: number }>()

const router = useRouter()

type CronRow = {
  m: CronMonitor
  to: RouteLocationRaw
  status: ReturnType<typeof monitorStatus>
  schedule: ReturnType<typeof describeSchedule>
  last: ReturnType<typeof lastRun>
  next: ReturnType<typeof nextRun>
  strip: ReturnType<typeof historyStrip>
}

const row = (m: CronMonitor): CronRow => ({
  m,
  to: { name: RouteName.SentryCronJob, params: { slug: m.slug }, query: { project: m.project } },
  status: monitorStatus(m, props.now),
  schedule: describeSchedule(m.schedule),
  last: lastRun(m, props.now),
  next: nextRun(m, props.now),
  strip: historyStrip(m, props.now)
})

const groups = computed(() => {
  const { attention, rest } = groupMonitors(props.monitors, props.now)
  return [
    { id: 'attention', title: 'Needs attention', rows: attention.map(row) },
    { id: 'rest', title: attention.length ? 'Running and OK' : '', rows: rest.map(row) }
  ].filter((g) => g.rows.length)
})

const open = (event: MouseEvent, to: RouteLocationRaw) => {
  // The link handles its own click (new tab included); text being selected
  // is not a click; the right button opens the menu.
  if ((event.target as HTMLElement).closest('a')) return
  if (window.getSelection()?.toString()) return
  if (event.button !== 0 && event.button !== 1) return
  // Ctrl/Cmd/Shift or the middle button on the row: a new tab, as on the link.
  if (event.button === 1 || event.ctrlKey || event.metaKey || event.shiftKey) {
    window.open(router.resolve(to).href, '_blank', 'noopener')
    return
  }
  if (event.altKey) return
  router.push(to)
}
</script>

<template>
  <div class="cron-table">
    <table class="cron-table__table">
      <caption class="cron-table__caption">
        Cron jobs
      </caption>
      <thead>
        <tr>
          <th scope="col">
            Job
          </th>
          <th scope="col">
            Schedule
          </th>
          <th scope="col">
            Last run
          </th>
          <th
            scope="col"
            class="cron-table__col-next"
          >
            Next
          </th>
          <th scope="col">
            Recent runs
          </th>
          <th
            scope="col"
            class="cron-table__col-src"
          >
            Source
          </th>
        </tr>
      </thead>
      <tbody
        v-for="group in groups"
        :key="group.id"
        :data-test="`cron-group-${group.id}`"
      >
        <tr
          v-if="group.title"
          class="cron-table__group"
        >
          <th
            colspan="6"
            scope="colgroup"
          >
            {{ group.title }} · {{ group.rows.length }}
          </th>
        </tr>
        <tr
          v-for="r in group.rows"
          :key="`${r.m.project}/${r.m.slug}`"
          class="cron-table__row"
          data-test="cron-row"
          @click="open($event, r.to)"
          @auxclick="open($event, r.to)"
        >
          <td>
            <div class="cron-table__job">
              <RouterLink
                :to="r.to"
                class="cron-table__name"
                :title="r.m.slug"
              >
                {{ r.m.slug }}
              </RouterLink>
              <CronStatusBadge :status="r.status" />
            </div>
          </td>
          <td class="cron-table__schedule">
            <span>{{ r.schedule.words }}</span>
            <span
              v-if="r.schedule.expr"
              class="cron-table__mono"
            >{{ r.schedule.expr }}</span>
          </td>
          <td class="cron-table__last">
            <span>{{ r.last.when }}</span>
            <span
              class="cron-table__sub"
              :class="{ 'cron-table__sub--bad': r.last.bad }"
            >{{ r.last.note }}</span>
          </td>
          <td
            class="cron-table__col-next"
            :title="r.next.clock"
          >
            {{ r.next.text }}
          </td>
          <td class="cron-table__hist">
            <CronHistoryStrip
              :cells="r.strip.cells"
              :summary="r.strip.summary"
              :bad="r.strip.bad"
            />
          </td>
          <td class="cron-table__col-src">
            <span class="cron-table__src">{{ r.m.source === 'ping' ? 'ping URL' : 'Sentry SDK' }}</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style lang="scss" scoped>
@use 'src/entities/sentry/ui/sentry-crons/cron-tokens' as cr;

.cron-table {
  @include cr.tokens;
  @apply bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700;

  border-radius: 6px;
  overflow-x: auto;
}

.cron-table__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.cron-table__caption {
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

tbody:last-child tr:last-child td {
  border-bottom: 0;
}

.cron-table__group th {
  @apply bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400;

  padding: 6px 12px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.cron-table__row {
  cursor: pointer;

  &:hover td {
    @apply bg-gray-50 dark:bg-gray-700/40;
  }
}

.cron-table__job {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  min-width: 0;
}

.cron-table__name {
  @include cr.focus-ring;
  @apply text-gray-900 dark:text-gray-100;

  display: block;
  max-width: 340px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: 'JetBrains Mono Variable', ui-monospace, monospace;
  font-variant-ligatures: none;
  font-weight: 600;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
    text-underline-offset: 2px;
  }
}

.cron-table__schedule,
.cron-table__last {
  white-space: nowrap;

  > span {
    display: block;
  }
}

.cron-table__mono {
  @apply text-gray-500 dark:text-gray-400;

  margin-top: 2px;
  font-family: 'JetBrains Mono Variable', ui-monospace, monospace;
  font-variant-ligatures: none;
  font-size: 11px;
}

.cron-table__sub {
  @apply text-gray-500 dark:text-gray-400;

  margin-top: 2px;
  font-size: 12px;
}

.cron-table__sub--bad {
  color: var(--cr-err);
}

.cron-table__col-next {
  white-space: nowrap;
}

.cron-table__src {
  @apply text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-600;

  padding: 0 6px;
  border-radius: 3px;
  font-family: 'JetBrains Mono Variable', ui-monospace, monospace;
  font-size: 11px;
  line-height: 18px;
  white-space: nowrap;
}

// Phone: each monitor is a small card; Next and Source drop out.
@media (max-width: 639px) {
  .cron-table {
    overflow: visible;
  }

  .cron-table__table,
  .cron-table__table tbody {
    display: block;
  }

  .cron-table__table thead {
    display: none;
  }

  .cron-table__row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 6px 12px;
    padding: 12px;

    @apply border-b border-gray-200 dark:border-gray-700;

    td {
      display: block;
      padding: 0;
      border: 0;
    }
  }

  tbody:last-child .cron-table__row:last-child {
    border-bottom: 0;
  }

  .cron-table__group {
    display: block;

    th {
      display: block;
    }
  }

  .cron-table__name {
    max-width: 100%;
  }

  .cron-table__schedule {
    grid-row: 2;
    grid-column: 1 / 3;
    white-space: normal;
  }

  .cron-table__last {
    text-align: right;
  }

  .cron-table__hist {
    grid-column: 1 / 3;
    overflow: hidden;
  }

  .cron-table__col-next,
  .cron-table__col-src {
    display: none !important;
  }
}
</style>
