<script lang="ts" setup>
import { useTitle } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { LayoutBase, LayoutSidebar } from '@/widgets/ui'
import { useServerUpdateStore } from '@/entities/server-update'
import { RouteName } from '@/shared/types'
import { AppHeader } from '@/shared/ui'
import { SettingsPageContent } from '../settings-page-content'

useTitle('Settings | Buggregator')

// A link to a section (/settings#keyboard; the Settings dot and the header
// pill link to #updates). The page scrolls inside <main>, so the section is
// brought into view by hand: on the link, and again once About & updates has
// its content (it waits for GET /api/update).
const route = useRoute()
const { status: updateStatus } = storeToRefs(useServerUpdateStore())

watch(
  [() => route.hash, () => !!updateStatus.value],
  async ([hash]) => {
    const id = hash.slice(1)
    if (!id) return
    await nextTick()
    document.getElementById(id)?.scrollIntoView({ block: 'start' })
  },
  { immediate: true }
)
</script>

<template>
  <LayoutBase
    class="settings-page"
    heading="Settings"
  >
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
</style>
