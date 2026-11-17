<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { onBeforeUnmount, onMounted, watch } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import { useServerUpdateStore } from '@/entities/server-update/lib'
import { useAppBadge } from '@/shared/lib/use-app-badge'
import { useEventsStore, useProfileStore, useSettingsStore } from '@/shared/stores'
import { StatusPanel } from '@/shared/ui'

const { initialize } = useEventsStore()
const { token } = storeToRefs(useProfileStore())
// Without settings the app cannot work; say why instead of a blank page.
const { fetchError: settingsError } = storeToRefs(useSettingsStore())

const reload = () => window.location.reload()

// Self-update: the state is read once the token is known, then follows the
// socket (`update.progress`). Older servers answer 404 and see nothing new.
const updateStore = useServerUpdateStore()

// The auth middleware of the first navigation loads the stored token; asking
// for the projects before it ends sends no token (401 with auth on). A login
// changes the token: the projects are asked for again.
// The watcher is made in setup, so it ends with the component.
let isRouterReady = false

watch(token, (value) => {
  if (isRouterReady && value) {
    initialize()
    updateStore.load()
  }
})

useRouter()
  .isReady()
  .then(() => {
    isRouterReady = true
    initialize()
    updateStore.init()
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
