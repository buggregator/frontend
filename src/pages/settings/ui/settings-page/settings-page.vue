<script lang="ts" setup>
import { useTitle } from '@vueuse/core'
import { LayoutBase, LayoutSidebar } from '@/widgets/ui'
import { RouteName } from '@/shared/types'
import { AppHeader } from '@/shared/ui'
import { SettingsPageContent } from '../settings-page-content'

useTitle('Settings | Buggregator')
</script>

<template>
  <LayoutBase class="settings-page">
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
        <span class="nav__current">Settings</span>
      </AppHeader>
    </template>

    <SettingsPageContent />
  </LayoutBase>
</template>

<style lang="scss" scoped>
.settings-page {
  display: block;
}

.nav__crumb {
  @apply text-sm text-gray-500 dark:text-gray-400;
  @apply hover:text-gray-800 dark:hover:text-gray-200;
  @apply transition-colors;
}

.nav__sep {
  @apply text-gray-300 dark:text-gray-700 mx-1.5 text-sm;
}

.nav__current {
  @apply text-sm font-medium text-gray-800 dark:text-gray-200;
}
</style>
