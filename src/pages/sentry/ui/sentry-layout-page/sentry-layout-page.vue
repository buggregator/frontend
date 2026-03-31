<script lang="ts" setup>
import { useTitle } from '@vueuse/core'
import { LayoutBase, LayoutSidebar } from '@/widgets/ui'
import { RouteName } from '@/shared/types'
import { AppHeader } from '@/shared/ui'

useTitle('Sentry | Buggregator')
</script>

<template>
  <LayoutBase>
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
