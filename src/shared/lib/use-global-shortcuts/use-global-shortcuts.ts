import { storeToRefs } from 'pinia'
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '../../stores'
import { RouteName } from '../../types'
import { NAV_TYPES, shortcutFor } from '../shortcuts'
import { hasCommandModifier, isTextFieldFocused } from '../use-keyboard-nav'


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

    const id = shortcutFor('everywhere', e.key)

    if (id === 'help') {
      if (isTextFieldFocused() && !isShortcutsOverlayOpen.value) return
      e.preventDefault()
      isShortcutsOverlayOpen.value = !isShortcutsOverlayOpen.value
      return
    }

    // All other shortcuts: skip if input focused or overlay open
    if (!id || isTextFieldFocused() || isShortcutsOverlayOpen.value) return

    if (id === 'go-home') {
      e.preventDefault()
      router.push({ name: RouteName.Home })
      return
    }

    if (id === 'go-favorites') {
      e.preventDefault()
      router.push({ name: RouteName.Favorites })
      return
    }

    // go-<type>: the digit keys, in NAV_TYPES order
    const type = NAV_TYPES.find((t) => id === `go-${t}`)
    if (type && settingsStore.availableEvents.includes(type)) {
      e.preventDefault()
      router.push({ name: RouteName.EventList, params: { type } })
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
