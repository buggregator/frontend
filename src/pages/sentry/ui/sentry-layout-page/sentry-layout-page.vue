<script lang="ts" setup>
import { useTitle } from '@vueuse/core'
import { computed, defineAsyncComponent } from 'vue'
import { useRoute } from 'vue-router'
import { LayoutBase, LayoutSidebar, SetupHelpButton } from '@/widgets/ui'
import {
  SentryFilterButton,
  SentryListViews,
  SentrySubNav,
  resetSentryFilter,
  sentryFilterChips,
  useSentryFilters,
  type SentryTab
} from '@/entities/sentry'
import { useEvents } from '@/shared/lib/use-events'
import { EventTypes, RouteName } from '@/shared/types'
import { AppHeader, PeriodSelect, provideHeaderToolbar } from '@/shared/ui'

// Its own chunk, as on the feeds.
const FeedFilterBar = defineAsyncComponent(() => import('@/widgets/ui/feed-filter-bar').then((m) => m.FeedFilterBar))

useTitle('Sentry | Buggregator')

// The trace detail page has a visible h1 of its own.
const HEADINGS: Partial<Record<string, string>> = {
  [RouteName.SentryExceptions]: 'Sentry exceptions',
  [RouteName.SentryTraces]: 'Sentry traces',
  [RouteName.SentryLogs]: 'Sentry logs',
  [RouteName.SentryMetrics]: 'Sentry metrics',
  [RouteName.SentryFeedback]: 'Sentry user feedback',
  [RouteName.SentryCrons]: 'Sentry cron jobs',
  [RouteName.SentryCronJob]: 'Sentry cron job',
  [RouteName.SentryQueues]: 'Sentry queue jobs',
  [RouteName.SentryQueueJob]: 'Sentry queue job'
}
const TAB_OF_ROUTE: Partial<Record<string, SentryTab>> = {
  [RouteName.SentryExceptions]: 'exceptions',
  [RouteName.SentryTraces]: 'traces',
  [RouteName.SentryTraceDetail]: 'traces',
  [RouteName.SentryLogs]: 'logs',
  [RouteName.SentryMetrics]: 'metrics',
  [RouteName.SentryFeedback]: 'feedback',
  [RouteName.SentryCrons]: 'crons',
  [RouteName.SentryCronJob]: 'crons',
  [RouteName.SentryQueues]: 'queues',
  [RouteName.SentryQueueJob]: 'queues'
}
const route = useRoute()
const heading = computed(() => HEADINGS[String(route.name)] ?? '')
const tab = computed(() => TAB_OF_ROUTE[String(route.name)] ?? '')
// The filters belong to a list: none on the trace page; Feedback, Crons and
// Queues have none in the header.
const filterTab = computed(() =>
  route.name === RouteName.SentryTraceDetail || ['feedback', 'crons', 'queues'].includes(tab.value) ? '' : tab.value
)
// Lists with more than one view get the view switch in row 2 (#6543 B, #6737 A).
const viewTab = computed(() => (filterTab.value === 'traces' || filterTab.value === 'exceptions' ? filterTab.value : null))
const isTrace = computed(() => route.name === RouteName.SentryTraceDetail)

// The tab's own filters are chips of the filter bar; the feed filters apply
// only to the exceptions timeline, which is the event feed.
const sentryFilters = useSentryFilters()
const chips = computed(() => (filterTab.value ? sentryFilterChips(filterTab.value) : []))
const feedFacets = computed(() => tab.value === 'exceptions' && sentryFilters.exceptionsView === 'timeline')

// «How to set up» on every Sentry tab once Sentry has events (#5941).
const { getItemsCount } = useEvents()
const hasSentryEvents = computed(() => getItemsCount.value(EventTypes.Sentry) > 0)
// Crons and Queues have their own setup help, always there.
const OWN_SETUP: Partial<Record<SentryTab, { id: string; title: string }>> = {
  crons: { id: 'crons', title: 'Crons' },
  queues: { id: 'queues', title: 'Queues' }
}
const ownSetup = computed(() => (tab.value ? OWN_SETUP[tab.value] : undefined))
const setupSection = computed(() => ownSetup.value ?? { id: 'sentry', title: 'Sentry' })

// Row 1: crumbs, the sections, help; row 2: view, filters, period — or the
// trace page's views, which it puts there itself.
provideHeaderToolbar()
</script>

<template>
  <LayoutBase :heading="heading">
    <template #sidebar>
      <LayoutSidebar />
    </template>

    <template #header>
      <AppHeader>
        <RouterLink
          :to="{ name: RouteName.Home }"
          class="nav__crumb"
        >
          Home
        </RouterLink>

        <span
          class="nav__sep"
          aria-hidden="true"
        >/</span>

        <RouterLink
          to="/sentry/exceptions"
          class="nav__crumb nav__current"
        >
          Sentry
        </RouterLink>

        <!-- The sections; on a phone they fill row 1 and scroll sideways. -->
        <template #tabs>
          <SentrySubNav :current="tab" />
        </template>

        <template #controls>
          <SetupHelpButton
            v-if="hasSentryEvents || ownSetup"
            :key="setupSection.id"
            :section-id="setupSection.id"
            :section-title="setupSection.title"
          />
        </template>

        <template #toolbar>
          <template v-if="!isTrace">
            <SentryListViews
              v-if="viewTab"
              :key="viewTab"
              :tab="viewTab"
            />
            <span
              v-if="viewTab && filterTab"
              class="sentry-layout__sep"
              aria-hidden="true"
            />
            <FeedFilterBar
              v-if="filterTab"
              class="sentry-layout__filters"
              :facets="feedFacets"
              :extra="chips"
              @remove-extra="resetSentryFilter"
            >
              <template #add>
                <SentryFilterButton :tab="filterTab" />
              </template>
            </FeedFilterBar>
            <PeriodSelect class="sentry-layout__period" />
          </template>
        </template>
      </AppHeader>
    </template>

    <RouterView />
  </LayoutBase>
</template>

<style lang="scss" scoped>
.sentry-layout__sep {
  @apply hidden sm:block flex-none w-px h-5 bg-gray-200 dark:bg-gray-700;
}

.sentry-layout__filters {
  @apply flex-1;
}

.sentry-layout__period {
  @apply ml-auto;
}
</style>
