<script lang="ts" setup>
import { useTitle } from '@vueuse/core'
import { useRouter } from 'vue-router'
import { LayoutBase, LayoutSidebar } from '@/widgets/ui'
import { ProfileCompare, useProfilerCompare } from '@/entities/profiler'
import { RouteName } from '@/shared/types'
import { AppHeader, IconSvg } from '@/shared/ui'

const router = useRouter()
const { compareBase, compareTarget, isReady, reset } = useProfilerCompare()

useTitle('Profile Comparison | Buggregator')

const onClear = () => {
  reset()
  router.push({ name: RouteName.EventList, params: { type: 'profiler' } })
}

// Redirect if no comparison selected
if (!isReady.value) {
  router.push({ name: RouteName.EventList, params: { type: 'profiler' } })
}
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
          :to="{ name: RouteName.EventList, params: { type: 'profiler' } }"
          class="nav__crumb"
        >
          Profiler
        </RouterLink>

        <span class="nav__sep">/</span>

        <span class="nav__current">Comparison</span>

        <template #controls>
          <button
            class="action-btn action-btn--danger"
            title="Clear comparison"
            @click="onClear"
          >
            <IconSvg
              name="times"
              class="action-btn__icon"
            />
            <span class="action-btn__text">Clear</span>
          </button>
        </template>
      </AppHeader>
    </template>

    <ProfileCompare
      v-if="isReady"
      :base-id="compareBase!"
      :compare-id="compareTarget!"
    />
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

.nav__current {
  @apply text-sm font-medium text-gray-800 dark:text-gray-200;
}

.action-btn {
  @apply h-7 flex items-center gap-1.5 px-2.5 rounded;
  @apply text-xs font-medium;
  @apply text-gray-500 dark:text-gray-400;
  @apply bg-gray-100 dark:bg-gray-700;
  @apply hover:text-gray-700 dark:hover:text-gray-200;
  @apply hover:bg-gray-200 dark:hover:bg-gray-600;
  @apply transition-colors cursor-pointer;
}

.action-btn--danger {
  @apply hover:text-red-600 dark:hover:text-red-400;
  @apply hover:bg-red-50 dark:hover:bg-red-500/10;
}

.action-btn__icon {
  @apply w-3.5 h-3.5;
}

.action-btn__text {
  @apply hidden sm:inline;
}
</style>
