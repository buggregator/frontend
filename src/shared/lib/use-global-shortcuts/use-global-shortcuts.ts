import { storeToRefs } from 'pinia'
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '../../stores'
import { RouteName, EventTypes } from '../../types'
import { hasCommandModifier, isTextFieldFocused } from '../use-keyboard-nav'

const NAV_TYPES: EventTypes[] = [
  EventTypes.Sentry,
  EventTypes.Profiler,
  EventTypes.Smtp,
  EventTypes.Sms,
  EventTypes.HttpDump,
  EventTypes.Inspector,
  EventTypes.VarDump,
  EventTypes.Monolog,
  EventTypes.RayDump,
]

export const isShortcutsOverlayOpen = ref(false)

export function useGlobalShortcuts() {
  const router = useRouter()
  const settingsStore = useSettingsStore()
  const { isSingleKeyShortcutsEnabled } = storeToRefs(settingsStore)

  const handleKeydown = (e: KeyboardEvent) => {
    // Escape closes overlay
    if (e.key === 'Escape' && isShortcutsOverlayOpen.value) {
      e.preventDefault()
      isShortcutsOverlayOpen.value = false
      return
    }

    // Every shortcut below is a single key (WCAG 2.1.4: it can be turned off)
    if (!isSingleKeyShortcutsEnabled.value || hasCommandModifier(e)) return

    // ? toggles the overlay
    if (e.key === '?') {
      if (isTextFieldFocused() && !isShortcutsOverlayOpen.value) return
      e.preventDefault()
      isShortcutsOverlayOpen.value = !isShortcutsOverlayOpen.value
      return
    }

    // All other shortcuts: skip if input focused or overlay open
    if (isTextFieldFocused() || isShortcutsOverlayOpen.value) return

    // 0 — go to all events (home)
    if (e.key === '0') {
      e.preventDefault()
      router.push({ name: RouteName.Home })
      return
    }

    // f — favorites
    if (e.key === 'f') {
      e.preventDefault()
      router.push({ name: RouteName.Favorites })
      return
    }

    // 1-8 — navigate to event type
    const num = parseInt(e.key, 10)
    if (num >= 1 && num <= NAV_TYPES.length) {
      const type = NAV_TYPES[num - 1]
      const available = settingsStore.availableEvents
      if (available.includes(type)) {
        e.preventDefault()
        router.push({ name: RouteName.EventList, params: { type } })
      }
      return
    }
  }

  onMounted(() => {
    document.addEventListener('keydown', handleKeydown)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('keydown', handleKeydown)
  })

  return {
    isShortcutsOverlayOpen,
  }
}
