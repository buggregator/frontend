<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { PERIOD_OPTIONS, useEventsStore } from '@/shared/stores'
import { useSentryFilters, useSentryView, type SentryViewTabName } from '../../lib'
import SentryViewTabs from './sentry-view-tabs.vue'

// The view tabs of a Sentry list (#6543 B), with what the view uses on the right.

type Props = { tab: SentryViewTabName }

const props = defineProps<Props>()

const { views, current, select } = useSentryView(props.tab)
const { period } = storeToRefs(useEventsStore())
const filters = useSentryFilters()

const periodLabel = computed(() => PERIOD_OPTIONS.find((p) => p.value === period.value)?.label ?? period.value)
const SOURCES: Record<string, string> = { '': 'All', sentry: 'Sentry SDK', otel: 'OpenTelemetry' }
</script>

<template>
  <SentryViewTabs
    :tabs="views"
    :current="current"
    :label="tab === 'traces' ? 'Traces view' : 'Exceptions view'"
    @select="select"
  >
    <template #info>
      <span>Period <b class="sentry-list-views__value">{{ periodLabel }}</b></span>
      <span v-if="tab === 'traces'">Source <b class="sentry-list-views__value">{{ SOURCES[filters.source] ?? filters.source }}</b></span>
    </template>
  </SentryViewTabs>
</template>

<style lang="scss" scoped>
.sentry-list-views__value {
  font-weight: 500;
  color: var(--vt-on);
}
</style>
