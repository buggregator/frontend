<script lang="ts" setup>
import { useMediaQuery, useTitle } from '@vueuse/core'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { LayoutBase, LayoutSidebar, SetupHelpButton } from '@/widgets/ui'
import { SentryFilterButton, SentryListViews, SentrySubNav, type SentryTab } from '@/entities/sentry'
import { useEvents } from '@/shared/lib/use-events'
import { EventTypes, RouteName } from '@/shared/types'
import { AppHeader, PeriodSelect } from '@/shared/ui'

useTitle('Sentry | Buggregator')

// The trace detail page has a visible h1 of its own.
const HEADINGS: Partial<Record<string, string>> = {
  [RouteName.SentryExceptions]: 'Sentry exceptions',
  [RouteName.SentryTraces]: 'Sentry traces',
  [RouteName.SentryLogs]: 'Sentry logs',
  [RouteName.SentryMetrics]: 'Sentry metrics'
}
const TAB_OF_ROUTE: Partial<Record<string, SentryTab>> = {
  [RouteName.SentryExceptions]: 'exceptions',
  [RouteName.SentryTraces]: 'traces',
  [RouteName.SentryTraceDetail]: 'traces',
  [RouteName.SentryLogs]: 'logs',
  [RouteName.SentryMetrics]: 'metrics'
}
const route = useRoute()
const heading = computed(() => HEADINGS[String(route.name)] ?? '')
const tab = computed(() => TAB_OF_ROUTE[String(route.name)] ?? '')
// The filters belong to a list: none on the trace page.
const filterTab = computed(() => (route.name === RouteName.SentryTraceDetail ? '' : tab.value))
// Lists with more than one view get the view tabs under the header (#6543 B).
const viewTab = computed(() => (filterTab.value === 'traces' || filterTab.value === 'exceptions' ? filterTab.value : null))

// «How to set up» on every Sentry tab once Sentry has events (#5941).
const { getItemsCount } = useEvents()
const hasSentryEvents = computed(() => getItemsCount.value(EventTypes.Sentry) > 0)

// One row from sm up (crumbs, tabs | Period, filters, #5980); on a phone the
// tabs are a second row under the bar. One instance of the tabs at a time:
// they fetch their counts.
const isWide = useMediaQuery('(min-width: 640px)')
</script>

<template>
  <LayoutBase :heading="heading">
    <template #sidebar>
      <LayoutSidebar />
    </template>

    <template #header>
      <AppHeader keep-title>
        <RouterLink
          :to="{ name: RouteName.Home }"
          class="nav__crumb nav__home"
        >
          Home
        </RouterLink>

        <span
          class="nav__sep"
          aria-hidden="true"
        >/</span>

        <RouterLink
          v-if="isWide"
          to="/sentry/exceptions"
          class="nav__crumb nav__current"
        >
          Sentry
        </RouterLink>
        <!-- Phone: the page title, not a link (the Exceptions tab is right under it). -->
        <span
          v-else
          class="nav__current"
        >Sentry</span>

        <template
          v-if="isWide"
          #tabs
        >
          <SentrySubNav :current="tab" />
        </template>

        <template #controls>
          <PeriodSelect />
          <SentryFilterButton
            v-if="filterTab"
            :tab="filterTab"
          />
          <SetupHelpButton
            v-if="hasSentryEvents"
            section-id="sentry"
            section-title="Sentry"
          />
        </template>
      </AppHeader>
    </template>

    <!-- Siblings, not wrapped: the page stays the content's own child. -->
    <SentrySubNav
      v-if="!isWide"
      :current="tab"
      class="sentry-layout__phone-tabs"
    />
    <SentryListViews
      v-if="viewTab"
      :key="viewTab"
      :tab="viewTab"
    />
    <RouterView />
  </LayoutBase>
</template>

<style lang="scss" scoped>
.nav__crumb {
  @apply text-sm text-gray-600 dark:text-gray-400;
  @apply hover:text-gray-900 dark:hover:text-gray-100;
  @apply transition-colors;
}

.nav__current {
  @apply font-medium text-gray-900 dark:text-gray-100;
}

.nav__sep {
  @apply text-gray-500 mx-1.5 text-sm;
}

// Phone: «Sentry» alone, larger.
@media (max-width: 639px) {
  .nav__home,
  .nav__sep {
    @apply hidden;
  }

  .nav__current {
    @apply text-base font-semibold pl-1;
  }
}

.sentry-layout__phone-tabs {
  @apply sticky top-0 z-10 h-11 px-4 flex-none;
  @apply bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700;
}
</style>
