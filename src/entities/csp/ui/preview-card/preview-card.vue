<script lang="ts" setup>
import { computed } from 'vue'
import type { NormalizedEvent } from '@/shared/types'
import { PreviewCard } from '@/shared/ui'
import { isReportOnly, pageText, reportTitle } from '../../lib/csp-report'
import type { CspPayload } from '../../types'

type Props = {
  event: NormalizedEvent<CspPayload>
}

const props = defineProps<Props>()

const SHOWN = 3

const eventLink = computed(() => `/csp/${props.event.id}`)
const reports = computed(() => props.event.payload.reports ?? [])
const shown = computed(() => reports.value.slice(0, SHOWN))
const more = computed(() => Math.max(0, reports.value.length - SHOWN))
const page = computed(() => pageText(reports.value[0]?.url))
</script>

<template>
  <PreviewCard :event="event">
    <RouterLink
      :to="eventLink"
      class="csp-card"
      data-test="csp-card"
    >
      <span
        v-if="page"
        class="csp-card__page"
      >{{ page }}</span>

      <ul class="csp-card__list">
        <li
          v-for="(r, i) in shown"
          :key="r.id || i"
          class="csp-card__row"
        >
          <span class="csp-card__title">{{ reportTitle(r) }}</span>
          <span
            v-if="isReportOnly(r)"
            class="csp-card__badge"
            title="Content-Security-Policy-Report-Only: reported, not blocked"
          >report-only</span>
        </li>
      </ul>

      <span
        v-if="more > 0"
        class="csp-card__more"
      >+{{ more }} more</span>
    </RouterLink>
  </PreviewCard>
</template>

<style lang="scss" scoped>
.csp-card {
  @apply block p-3 rounded cursor-pointer;
  @apply bg-gray-50 dark:bg-gray-900;
  @apply border border-gray-200 dark:border-gray-700;
  @apply hover:border-gray-300 dark:hover:border-gray-600 transition-colors;
}

.csp-card__page {
  @apply block text-xs text-gray-500 dark:text-gray-400 truncate mb-1;
}

.csp-card__list {
  @apply flex flex-col gap-1;
}

.csp-card__row {
  @apply flex items-center gap-2 min-w-0;
}

.csp-card__title {
  @apply text-sm font-mono text-gray-800 dark:text-gray-200 truncate;
}

.csp-card__badge {
  @apply text-2xs font-mono px-1.5 py-0.5 rounded flex-shrink-0;
  @apply bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300;
}

.csp-card__more {
  @apply block mt-1 text-xs text-gray-500 dark:text-gray-400;
}
</style>
