import { storeToRefs } from 'pinia'
import { onBeforeUnmount, onMounted, watch } from 'vue'
import {
  reloadSentryFilters,
  SENTRY_FILTER_STORAGE_KEYS,
  SERVICE_MAP_PAUSE_STORAGE,
  TRACE_VIEW_STORAGE,
} from '@/entities/sentry'
import { createSettingsRequests, createSettingsSync, type SettingsSync } from '@/shared/lib/settings-sync'
import { useEventsStore, useProfileStore, useSettingsStore } from '@/shared/stores'
import { LocalStorageKeys } from '@/shared/types'

// Preferences kept in localStorage that follow the signed-in person (#6772).
// Not the token, and not what was seen: those belong to this browser. Feed
// filters live in the address, not here.
export const SYNCED_KEYS: readonly string[] = [
  LocalStorageKeys.Theme,
  LocalStorageKeys.Navbar,
  LocalStorageKeys.EventCounts,
  LocalStorageKeys.CodeEditor,
  LocalStorageKeys.SidebarCollapsed,
  LocalStorageKeys.CustomFilePathMapping,
  LocalStorageKeys.IsActiveCustomFilePathMapping,
  LocalStorageKeys.Period,
  LocalStorageKeys.SingleKeyShortcuts,
  LocalStorageKeys.KeyHints,
  LocalStorageKeys.HiddenMenuItems,
  LocalStorageKeys.DesktopNotifications,
  LocalStorageKeys.MonologInlineContext,
  ...SENTRY_FILTER_STORAGE_KEYS,
  TRACE_VIEW_STORAGE,
  SERVICE_MAP_PAUSE_STORAGE,
]

// How often changes made here are looked for and sent.
const PUSH_EVERY_MS = 2000

let sync: SettingsSync | null = null
let syncedToken = ''

// Lets the open app show preferences that were just written to localStorage.
const applyStoredPreferences = () => {
  useSettingsStore().reloadStoredPreferences()
  useEventsStore().reloadStoredPeriod()
  reloadSentryFilters()
}

// Once per sign-in, before the page is drawn (the auth middleware): takes the
// person's saved preferences into this browser. A failure keeps this
// browser's own settings and tries again on the next page.
export const pullSyncedSettings = async (token: string): Promise<void> => {
  if (!token || token === syncedToken) return

  const profileStore = useProfileStore()
  const next = createSettingsSync(
    SYNCED_KEYS,
    createSettingsRequests(() => profileStore.token),
    window.localStorage
  )

  try {
    if (await next.pull()) applyStoredPreferences()
    sync = next
    syncedToken = token
  } catch (e) {
    console.error('Settings sync: cannot read saved settings', e)
  }
}

export const pushSyncedSettings = async (): Promise<void> => {
  try {
    await sync?.push()
  } catch (e) {
    console.error('Settings sync: cannot save settings', e)
  }
}

// Signed out: nothing more is sent until the next sign-in.
export const forgetSyncedSettings = () => {
  sync = null
  syncedToken = ''
}

// In App: sends changes while signed in, and once more when the page is left.
export const useSettingsSync = () => {
  const { token } = storeToRefs(useProfileStore())
  let timer: ReturnType<typeof setInterval> | undefined

  watch(token, (value) => {
    if (!value) forgetSyncedSettings()
  })

  const onHide = () => {
    if (document.visibilityState === 'hidden') pushSyncedSettings()
  }

  onMounted(() => {
    timer = setInterval(pushSyncedSettings, PUSH_EVERY_MS)
    document.addEventListener('visibilitychange', onHide)
  })

  onBeforeUnmount(() => {
    clearInterval(timer)
    document.removeEventListener('visibilitychange', onHide)
  })
}
