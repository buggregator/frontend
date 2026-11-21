<script lang="ts" setup>
import { useResizeObserver } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref, watch } from 'vue'
import { useEventsStore } from '@/shared/stores'
import { useSentryCounts } from '../../lib'
import { useCronMonitors } from '../../lib/crons'
import { onSentryEvent } from '../../lib/use-sentry-events-bus'
import type { SentryTab } from '../../lib/use-sentry-filters'

// Underline tabs of the Sentry header (#5980): the tab name and its count.
// `current`: the tab of the page shown (the trace page belongs to Traces).
const props = defineProps<{ current?: SentryTab | '' }>()

const { counts, fetchCounts } = useSentryCounts()
const { activeProjectKey, period } = storeToRefs(useEventsStore())

onMounted(() => {
  fetchCounts()
})

// The counts follow the same project and period as the lists they label.
watch([activeProjectKey, period], () => {
  fetchCounts()
})

onSentryEvent(() => {
  fetchCounts()
})

const TABS: { id: SentryTab; label: string; to: string }[] = [
  { id: 'exceptions', label: 'Exceptions', to: '/sentry/exceptions' },
  { id: 'traces', label: 'Traces', to: '/sentry/traces' },
  { id: 'logs', label: 'Logs', to: '/sentry/logs' },
  { id: 'metrics', label: 'Metrics', to: '/sentry/metrics' },
  { id: 'feedback', label: 'Feedback', to: '/sentry/feedback' },
  { id: 'crons', label: 'Crons', to: '/sentry/crons' }
]

// Cron monitors are not in /counts and not in the period: the tab counts the
// monitors of the project (#6617). It shows on every server with /api/crons,
// also with no monitors (its empty state has the setup help); an older
// server answers 404: no tab.
const {
  monitors: cronMonitors,
  unsupported: cronsUnsupported,
  hasLoaded: cronsLoaded,
  error: cronsError
} = useCronMonitors()
const hasCrons = computed(() => cronsLoaded.value && !cronsUnsupported.value && !cronsError.value)

const countOf = (id: SentryTab) => (id === 'crons' ? cronMonitors.value.length : (counts.value[id] ?? 0))

// Tabs without data stay hidden; Exceptions and the open tab always show.
const isShown = (id: SentryTab) => {
  if (id === 'exceptions') return true
  if (id === 'crons') return !cronsUnsupported.value && (hasCrons.value || id === props.current)
  return id === props.current || countOf(id) > 0
}
const tabs = computed(() => TABS.filter((t) => isShown(t.id)))

// Sideways scroll when the row is too narrow: an edge fades where more tabs hide.
const nav = ref<HTMLElement | null>(null)
const fadeStart = ref(false)
const fadeEnd = ref(false)
const updateFade = () => {
  const el = nav.value
  if (!el) return
  fadeStart.value = el.scrollLeft > 1
  fadeEnd.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 1
}
// The open tab is kept in view (a phone shows two or three tabs at once).
const revealCurrent = () => {
  const el = nav.value
  const tab = el?.querySelector<HTMLElement>('[aria-current="page"]')
  if (!el || !tab) return
  const left = tab.getBoundingClientRect().left - el.getBoundingClientRect().left + el.scrollLeft
  if (left < el.scrollLeft) el.scrollLeft = left - 16
  else if (left + tab.offsetWidth > el.scrollLeft + el.clientWidth)
    el.scrollLeft = left + tab.offsetWidth - el.clientWidth + 16
  updateFade()
}
useResizeObserver(nav, updateFade)
watch(
  [tabs, () => props.current],
  () => requestAnimationFrame(revealCurrent),
  { immediate: true }
)
</script>

<template>
  <nav
    ref="nav"
    class="sentry-tabs"
    :class="{ 'sentry-tabs--fade-start': fadeStart, 'sentry-tabs--fade-end': fadeEnd }"
    aria-label="Sentry"
    @scroll.passive="updateFade"
  >
    <RouterLink
      v-for="tab in tabs"
      :key="tab.id"
      :to="tab.to"
      class="sentry-tabs__tab"
      :class="{ 'sentry-tabs__tab--current': tab.id === current }"
      :aria-current="tab.id === current ? 'page' : undefined"
      :data-test="`sentry-tab-${tab.id}`"
    >
      {{ tab.label }}
      <span
        v-if="countOf(tab.id) > 0"
        class="sentry-tabs__count"
      >{{ countOf(tab.id) }}</span>
    </RouterLink>
  </nav>
</template>

<style lang="scss" scoped>
.sentry-tabs {
  @apply flex items-stretch gap-5 min-w-0 overflow-x-auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.sentry-tabs--fade-end {
  mask-image: linear-gradient(to right, #000 calc(100% - 24px), transparent);
}

.sentry-tabs--fade-start {
  mask-image: linear-gradient(to right, transparent, #000 24px);
}

.sentry-tabs--fade-start.sentry-tabs--fade-end {
  mask-image: linear-gradient(to right, transparent, #000 24px, #000 calc(100% - 24px), transparent);
}

.sentry-tabs__tab {
  @apply flex flex-none items-center gap-1.5 px-0.5 whitespace-nowrap;
  @apply text-sm text-gray-500 dark:text-gray-400;
  @apply hover:text-gray-700 dark:hover:text-gray-200;
  @apply border-b-2 border-transparent;
  @apply transition-colors;
  // The underline sits on the header's bottom line.
  margin-bottom: -1px;

  &:focus-visible {
    @apply outline-none ring-2 ring-inset ring-blue-600 dark:ring-blue-400 rounded-sm;
  }
}

.sentry-tabs__tab--current {
  @apply font-medium text-gray-800 dark:text-gray-100;
  @apply border-gray-800 dark:border-gray-100;
}

.sentry-tabs__count {
  @apply text-xs font-mono tabular-nums font-normal;
  @apply text-gray-500 dark:text-gray-400;

  .sentry-tabs__tab--current & {
    @apply text-gray-600 dark:text-gray-400;
  }
}
</style>
