<script lang="ts" setup>
import { useTitle } from '@vueuse/core'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { LayoutBase, LayoutSidebar } from '@/widgets/ui'
import { RouteName } from '@/shared/types'
import { AppHeader, PeriodSelect } from '@/shared/ui'

useTitle('Sentry | Buggregator')

// The trace detail page has a visible h1 of its own.
const HEADINGS: Partial<Record<string, string>> = {
  [RouteName.SentryExceptions]: 'Sentry exceptions',
  [RouteName.SentryTraces]: 'Sentry traces',
  [RouteName.SentryLogs]: 'Sentry logs',
  [RouteName.SentryMetrics]: 'Sentry metrics'
}
const route = useRoute()
const heading = computed(() => HEADINGS[String(route.name)] ?? '')
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

        <span class="nav__sep">/</span>

        <RouterLink
          to="/sentry/exceptions"
          class="nav__crumb"
        >
          Sentry
        </RouterLink>

        <template #controls>
          <PeriodSelect />
        </template>
      </AppHeader>
    </template>

    <RouterView />
  </LayoutBase>
</template>

<style lang="scss" scoped>
.nav__crumb {
  @apply text-sm text-gray-500 dark:text-gray-400;
  @apply hover:text-gray-800 dark:hover:text-gray-200;
  @apply transition-colors;
}

.nav__sep {
  @apply text-gray-300 dark:text-gray-700 mx-1.5 text-sm;
}
</style>
