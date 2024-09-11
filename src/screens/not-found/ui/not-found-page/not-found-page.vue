<script lang="ts" setup>
import { useTitle } from '@vueuse/core'
import { RouteName } from '@/shared/types/app'
import { LayoutBase, LayoutSidebar, PageHeader } from '@/widgets/ui'
import { PAGE_TYPES } from '@/shared/constants'

useTitle('404 | Buggregator')
</script>

<template>
  <LayoutBase class="settings-page">
    <template #sidebar>
      <LayoutSidebar />
    </template>

    <div class="error">
      <h1 class="error__title">
        404
        <br />
        Page not found
      </h1>

      <RouterLink :to="{ name: RouteName.Home }"> Go to home </RouterLink>
    </div>
  </LayoutBase>
</template>

<style lang="scss" scoped>
@import 'src/assets/mixins';

.error {
  @apply text-gray-600 dark:text-gray-300;
  @apply flex flex-col justify-between items-center text-center p-6 m-auto;
}

.error__title {
  font-size: 100px;
}
</style>
