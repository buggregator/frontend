<script lang="ts" setup>
import { computed } from 'vue'
import type { NormalizedEvent } from '@/shared/types'
import { CodeSnippet, EventDetailLayout, TableBase, TableBaseRow } from '@/shared/ui'
import { isCspViolation, isReportOnly, reportTitle, sourceText } from '../../lib/csp-report'
import type { CspPayload, CspReport } from '../../types'

type Props = {
  event: NormalizedEvent<CspPayload>
}

const props = defineProps<Props>()

const reports = computed(() => props.event.payload.reports ?? [])
const title = computed(() =>
  reports.value.length === 1 ? 'Browser report' : `${reports.value.length} browser reports`
)
const format = computed(() =>
  props.event.payload.format === 'reports+json' ? 'Reporting API' : 'report-uri (csp-report)'
)

type Row = { label: string; value: string; link?: boolean; copy?: boolean }

const rowsOf = (r: CspReport): Row[] =>
  [
    { label: 'Page', value: r.url ?? '', link: true },
    { label: 'Directive', value: r.directive ?? '', copy: true },
    { label: 'Blocked', value: r.blocked ?? '', copy: true },
    { label: 'Source', value: sourceText(r) },
    { label: 'Sample', value: r.sample ?? '' },
    { label: 'Message', value: r.message ?? '' },
    { label: 'Browser', value: r.user_agent ?? '' }
  ].filter((row) => row.value)

// Blocked: red; reported only: amber; other report types: grey.
const badgeClass = (r: CspReport) =>
  !isCspViolation(r)
    ? 'csp-report__badge--other'
    : isReportOnly(r)
      ? 'csp-report__badge--report'
      : 'csp-report__badge--enforce'

const isWebUrl = (v: string) => /^https?:\/\//i.test(v)

const rawOf = (r: CspReport) => (r.body ?? r) as Record<string, unknown>
</script>

<template>
  <EventDetailLayout
    :title="title"
    :subtitle="format"
    :date="event.date"
  >
    <section
      v-for="(r, i) in reports"
      :key="`${i}-${r.id}`"
      class="csp-report"
      data-test="csp-report"
    >
      <header class="csp-report__head">
        <h3 class="csp-report__title">
          {{ reportTitle(r) }}
        </h3>
        <span
          class="csp-report__badge"
          :class="badgeClass(r)"
        >{{ isCspViolation(r) ? (isReportOnly(r) ? 'report-only' : 'blocked') : r.type }}</span>
      </header>

      <TableBase>
        <TableBaseRow
          v-for="row in rowsOf(r)"
          :key="row.label"
          :title="row.label"
          :copy-value="row.copy ? row.value : ''"
        >
          <a
            v-if="row.link && isWebUrl(row.value)"
            :href="row.value"
            target="_blank"
            rel="noopener noreferrer"
            class="csp-report__link"
          >{{ row.value }}</a>
          <template v-else>
            {{ row.value }}
          </template>
        </TableBaseRow>
      </TableBase>

      <details
        v-if="r.policy"
        class="csp-report__more"
      >
        <summary>Policy</summary>
        <CodeSnippet
          class="csp-report__code"
          :code="r.policy"
        />
      </details>
      <details class="csp-report__more">
        <summary>Raw report</summary>
        <CodeSnippet
          class="csp-report__code"
          :code="rawOf(r)"
          language="json"
        />
      </details>
    </section>
  </EventDetailLayout>
</template>

<style lang="scss" scoped>
.csp-report {
  @apply flex flex-col gap-2;
}

.csp-report__head {
  @apply flex items-start justify-between gap-3;
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

.csp-report__badge--other {
  @apply bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300;
}

.csp-report__link {
  @apply text-blue-700 dark:text-blue-300 hover:underline;
}

.csp-report__more summary {
  @apply cursor-pointer text-xs font-medium text-gray-600 dark:text-gray-300;
}

.csp-report__code {
  @apply mt-2;
}
</style>
