import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import type { DesktopNotifier, NotifyPermission } from '@/shared/lib/desktop-notify'
import { useSettingsStore } from '@/shared/stores'

export type DesktopNotificationsState = 'unsupported' | 'blocked' | 'off' | 'on'

/**
 * The «Desktop notifications» switch: on only with the person's choice and
 * the browser's permission. Turning it on asks the browser (from the click)
 * and shows a test notification.
 */
export const useDesktopNotificationsSetting = (notifier: DesktopNotifier) => {
  const store = useSettingsStore()
  const { isDesktopNotificationsEnabled } = storeToRefs(store)

  const permission = ref<NotifyPermission>(notifier.permission())
  const isAsking = ref(false)

  const state = computed<DesktopNotificationsState>(() => {
    if (!notifier.isSupported()) return 'unsupported'
    if (permission.value === 'denied') return 'blocked'
    return isDesktopNotificationsEnabled.value && permission.value === 'granted' ? 'on' : 'off'
  })

  const toggle = async () => {
    if (state.value === 'on') {
      store.setDesktopNotifications(false)
      return
    }
    if (state.value === 'unsupported' || isAsking.value) return

    isAsking.value = true
    try {
      // The browser may have been changed meanwhile (site settings).
      permission.value = await notifier.requestPermission()
    } finally {
      isAsking.value = false
    }

    if (permission.value === 'granted') {
      store.setDesktopNotifications(true)
      notifier.showTest()
    }
  }

  // Back from the browser's site settings: read the permission again.
  const refresh = () => {
    permission.value = notifier.permission()
  }

  return { state, isAsking, toggle, refresh, showTest: () => notifier.showTest() }
}
