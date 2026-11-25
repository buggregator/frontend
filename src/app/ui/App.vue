<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import { useServerUpdateStore } from '@/entities/server-update/lib'
import { isAssistOpen } from '@/shared/lib/assist'
import { useDesktopNotify } from '@/shared/lib/desktop-notify'
import { useAppBadge } from '@/shared/lib/use-app-badge'
import { useEventsStore, useProfileStore, useSettingsStore } from '@/shared/stores'
import { RouteName } from '@/shared/types'
import { StatusPanel } from '@/shared/ui'
import { useSettingsSync } from '../lib/settings-sync'

const { initialize } = useEventsStore()
const { token } = storeToRefs(useProfileStore())
// Without settings the app cannot work; say why instead of a blank page.
const settingsStore = useSettingsStore()
const { fetchError: settingsError } = storeToRefs(settingsStore)
// Theme «System» follows the system while the app is open.
settingsStore.watchSystemTheme()
// Signed in: preferences follow the person (#6772); signed out or auth off,
// they stay in this browser only.
useSettingsSync()

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

const router = useRouter()

// A click on a new-error notification opens that error.
useDesktopNotify().setOpener((uuid) => router.push(`/sentry/event/${uuid}`))

router
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

// The agents panel (#7116): one for the whole app, so it stays open with its
// thread and draft across pages. Loaded on first open (its own chunk); kept
// mounted after that. Not on the sign-in page.
const AssistPanel = defineAsyncComponent(() => import('@/widgets/ui/assist-panel').then((m) => m.AssistPanel))
const route = useRoute()
const assistAllowed = computed(() => !settingsError.value && route.name !== RouteName.Login)
const assistMounted = ref(false)
watch(
  () => isAssistOpen.value && assistAllowed.value,
  (show) => {
    if (show) assistMounted.value = true
  },
  { immediate: true }
)
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

  <AssistPanel
    v-if="assistMounted"
    v-show="isAssistOpen && assistAllowed"
  />
</template>

<style lang="scss" scoped>
.app-unreachable {
  @apply min-h-screen flex items-center justify-center;
  @apply bg-white dark:bg-gray-900;
}
</style>
