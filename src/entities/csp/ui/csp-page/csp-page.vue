<script lang="ts" setup>
import moment from 'moment'
import { computed } from 'vue'
import type { NormalizedEvent } from '@/shared/types'
import { EventDetailLayout } from '@/shared/ui'
import { isCspViolation, isReportOnly, reportTitle, sourceText } from '../../lib/csp-report'
import type { CspPayload, CspReport } from '../../types'

type Props = {
  event: NormalizedEvent<CspPayload>
}

const props = defineProps<Props>()

const reports = computed(() => props.event.payload.reports ?? [])
const date = computed(() => (props.event.date ? moment(props.event.date).format('DD.MM.YYYY HH:mm:ss') : ''))
const format = computed(() =>
  props.event.payload.format === 'reports+json' ? 'Reporting API' : 'report-uri (csp-report)'
)

type Row = { label: string; value: string; mono?: boolean; link?: boolean }

const rowsOf = (r: CspReport): Row[] =>
  [
    { label: 'Page', value: r.url, link: true },
    { label: 'Directive', value: r.directive, mono: true },
    { label: 'Blocked', value: r.blocked, mono: true },
    { label: 'Source', value: sourceText(r), mono: true },
    { label: 'Sample', value: r.sample, mono: true },
    { label: 'Message', value: r.message },
    { label: 'Browser', value: r.user_agent }
  ].filter((row) => row.value)

const isWebUrl = (v: string) => /^https?:\/\//i.test(v)

const bodyJson = (r: CspReport) => JSON.stringify(r.body ?? r, null, 2)
</script>

<template>
  <EventDetailLayout>
    <template #header>
      <div class="csp-page__header">
        <h2 class="csp-page__title">
          {{ reports.length === 1 ? 'Browser report' : `${reports.length} browser reports` }}
        </h2>
        <div class="csp-page__meta">
          <span>{{ format }}</span>
          <span v-if="date">{{ date }}</span>
        </div>
      </div>
    </template>

    <div class="csp-page__list">
      <section
        v-for="(r, i) in reports"
        :key="r.id || i"
        class="csp-report"
        data-test="csp-report"
      >
        <header class="csp-report__head">
          <h3 class="csp-report__title">
            {{ reportTitle(r) }}
          </h3>
          <span
            class="csp-report__badge"
            :class="isReportOnly(r) ? 'csp-report__badge--report' : 'csp-report__badge--enforce'"
          >{{ isCspViolation(r) ? (isReportOnly(r) ? 'report-only' : 'blocked') : r.type }}</span>
        </header>

        <dl class="csp-report__rows">
          <div
            v-for="row in rowsOf(r)"
            :key="row.label"
            class="csp-report__row"
          >
            <dt class="csp-report__label">
              {{ row.label }}
            </dt>
            <dd
              class="csp-report__value"
              :class="{ 'csp-report__value--mono': row.mono }"
            >
              <a
                v-if="row.link && isWebUrl(row.value)"
                :href="row.value"
                target="_blank"
                rel="noopener noreferrer"
              >{{ row.value }}</a>
              <template v-else>
                {{ row.value }}
              </template>
            </dd>
          </div>
        </dl>

        <details
          v-if="r.policy"
          class="csp-report__more"
        >
          <summary>Policy</summary>
          <pre class="csp-report__pre">{{ r.policy }}</pre>
        </details>
        <details class="csp-report__more">
          <summary>Raw report</summary>
          <pre class="csp-report__pre">{{ bodyJson(r) }}</pre>
        </details>
      </section>
    </div>
  </EventDetailLayout>
</template>

<style lang="scss" scoped>
.csp-page__header {
  @apply flex flex-col gap-1;
}

.csp-page__title {
  @apply text-base md:text-lg lg:text-xl font-semibold;
}

.csp-page__meta {
  @apply flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400;
}

.csp-page__list {
  @apply flex flex-col gap-4;
}

.csp-report {
  @apply rounded-lg overflow-hidden;
  @apply border border-gray-200 dark:border-gray-700;
}

.csp-report__head {
  @apply flex items-start justify-between gap-3 px-4 py-2.5;
  @apply bg-gray-50 dark:bg-gray-900;
}

.csp-report__title {
  @apply text-sm font-mono font-medium text-gray-900 dark:text-gray-100 break-all;
}

.csp-report__badge {
  @apply text-2xs font-mono font-semibold uppercase px-2 py-0.5 rounded flex-shrink-0;
}

.csp-report__badge--enforce {
  @apply bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400;
}

.csp-report__badge--report {
  @apply bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300;
}

.csp-report__rows {
  @apply divide-y divide-gray-100 dark:divide-gray-800;
}

.csp-report__row {
  @apply flex flex-col gap-0.5 px-4 py-2;
}

.csp-report__label {
  @apply text-xs text-gray-500 dark:text-gray-400 flex-shrink-0;
}

// Label and value side by side from 640 px (plain CSS: no new utilities).
@media (min-width: 640px) {
  .csp-report__row {
    flex-direction: row;
    gap: 1rem;
  }

  .csp-report__label {
    width: 6rem;
  }
}

.csp-report__value {
  @apply text-sm text-gray-800 dark:text-gray-200 min-w-0 break-all;

  a {
    @apply text-blue-700 dark:text-blue-300 hover:underline;
  }
}

.csp-report__value--mono {
  @apply font-mono text-xs;
}

.csp-report__more {
  @apply px-4 py-2 border-t border-gray-100 dark:border-gray-800;

  summary {
    @apply cursor-pointer text-xs font-medium text-gray-600 dark:text-gray-300;
  }
}

.csp-report__pre {
  @apply mt-2 p-2 rounded text-xs font-mono whitespace-pre-wrap break-all;
  @apply bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300;
}
</style>
