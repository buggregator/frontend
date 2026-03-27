<script lang="ts" setup>
import { useTitle } from '@vueuse/core'
import { LayoutBase, LayoutSidebar } from '@/widgets/ui'
import { RouteName } from '@/shared/types'

useTitle('404 | Buggregator')
</script>

<template>
  <LayoutBase class="not-found-page">
    <template #sidebar>
      <LayoutSidebar />
    </template>

    <div class="not-found">
      <h1 class="not-found__code">
        404
      </h1>
      <p class="not-found__text">
        The page you're looking for doesn't exist
      </p>
      <RouterLink
        :to="{ name: RouteName.Home }"
        class="not-found__button"
      >
        Back to events
      </RouterLink>
    </div>
  </LayoutBase>
</template>

<style lang="scss" scoped>
.not-found {
  @apply flex flex-col justify-center items-center text-center p-6 m-auto;
  @apply text-gray-600 dark:text-gray-300;
}

.not-found__code {
  @apply text-6xl font-bold text-gray-300 dark:text-gray-600;
}

.not-found__text {
  @apply text-sm text-gray-500 dark:text-gray-400 mt-3 mb-6;
}

.not-found__button {
  @apply px-4 py-2 text-sm font-medium rounded-md;
  @apply bg-blue-500 hover:bg-blue-600 text-white;
  @apply transition-colors;
}
</style>
