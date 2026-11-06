<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { onBeforeUnmount, onMounted, watch } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import { useAppBadge } from '@/shared/lib/use-app-badge'
import { useEventsStore, useProfileStore, useSettingsStore } from '@/shared/stores'
import { StatusPanel } from '@/shared/ui'

const { initialize } = useEventsStore()
const { token } = storeToRefs(useProfileStore())
// Without settings the app cannot work; say why instead of a blank page.
const { fetchError: settingsError } = storeToRefs(useSettingsStore())

const reload = () => window.location.reload()

// The auth middleware of the first navigation loads the stored token; asking
// for the projects before it ends sends no token (401 with auth on). A login
// changes the token: the projects are asked for again.
// The watcher is made in setup, so it ends with the component.
let isRouterReady = false

watch(token, (value) => {
  if (isRouterReady && value) {
    initialize()
  }
})

useRouter()
  .isReady()
  .then(() => {
    isRouterReady = true
    initialize()
  })

let stopAppBadge = () => {}

onMounted(() => {
  stopAppBadge = useAppBadge().start()
})

onBeforeUnmount(() => stopAppBadge())
</script>

<template>
  <main
    v-if="settingsError"
    class="app-unreachable"
  >
    <StatusPanel
      tone="error"
      title="Cannot reach the Buggregator server"
      :text="settingsError"
      action-label="Try again"
      @action="reload"
    />
  </main>

  <RouterView v-else />
</template>

<style lang="scss" scoped>
.app-unreachable {
  @apply min-h-screen flex items-center justify-center;
  @apply bg-white dark:bg-gray-900;
}
</style>
