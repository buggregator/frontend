import { onMounted, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '../../stores'
import { RouteName, EventTypes } from '../../types'

const NAV_TYPES: EventTypes[] = [
  EventTypes.Sentry,
  EventTypes.Profiler,
  EventTypes.Smtp,
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

  const isInputFocused = () => {
    const active = document.activeElement
    if (!active) return false
    const tag = active.tagName.toLowerCase()
    return tag === 'input' || tag === 'textarea' || tag === 'select' || (active as HTMLElement).isContentEditable
  }

  const handleKeydown = (e: KeyboardEvent) => {
    // ? always works (toggle overlay)
    if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
      if (isInputFocused() && !isShortcutsOverlayOpen.value) return
      e.preventDefault()
      isShortcutsOverlayOpen.value = !isShortcutsOverlayOpen.value
      return
    }

    // Escape closes overlay
    if (e.key === 'Escape' && isShortcutsOverlayOpen.value) {
      e.preventDefault()
      isShortcutsOverlayOpen.value = false
      return
    }

    // All other shortcuts: skip if input focused or overlay open
    if (isInputFocused() || isShortcutsOverlayOpen.value) return

    // 0 — go to all events (home)
    if (e.key === '0' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault()
      router.push({ name: RouteName.Home })
      return
    }

    // 1-8 — navigate to event type
    const num = parseInt(e.key, 10)
    if (num >= 1 && num <= NAV_TYPES.length && !e.ctrlKey && !e.metaKey) {
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
