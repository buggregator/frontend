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
  <LayoutBase heading="Profile comparison">
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
          :to="{ name: RouteName.EventList, params: { type: 'profiler' } }"
          class="nav__crumb"
        >
          Profiler
        </RouterLink>

        <span
          class="nav__sep"
          aria-hidden="true"
        >/</span>

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

