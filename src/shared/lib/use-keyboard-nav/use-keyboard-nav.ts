import { storeToRefs } from 'pinia'
import { ref, onMounted, onBeforeUnmount, type Ref } from 'vue'
import { useSettingsStore } from '../../stores'
import type { EventId } from '../../types'
import { hasCommandModifier, isControlFocused, isTextFieldFocused } from './keyboard-guards'

export type KeyboardNavCallbacks = {
  onOpen?: (id: EventId) => void
  onDelete?: (id: EventId) => void
  onLock?: (id: EventId) => void
  onCopyPayload?: (id: EventId) => void
  onScreenshot?: (id: EventId) => void
  // Brings the focused event into view. Default: scroll its element, which a
  // virtual list may not have rendered.
  scrollToId?: (id: EventId) => void
}

// Shared state for screenshot mode — cards hide controls when their id is here
export const screenshotingEventId = ref<string | null>(null)

// Toast state — shared so any component can display it
export const toastMessage = ref('')
let toastTimer: ReturnType<typeof setTimeout> | null = null

export function showToast(message: string, duration = 2000) {
  toastMessage.value = message
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastMessage.value = '' }, duration)
}

const ACTION_KEYS = new Set(['x', 'l', 'y', 's'])

export function useKeyboardNav(
  eventIds: Ref<EventId[]>,
  options: KeyboardNavCallbacks = {}
) {
  const focusedIndex = ref(-1)
  const focusedId = ref<EventId | null>(null)
  const { isSingleKeyShortcutsEnabled } = storeToRefs(useSettingsStore())

  const scrollToFocused = () => {
    if (!focusedId.value) return
    if (options.scrollToId) {
      options.scrollToId(focusedId.value)
      return
    }
    document.getElementById(focusedId.value)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }

  const updateFocus = (index: number) => {
    const ids = eventIds.value
    if (ids.length === 0) return

    focusedIndex.value = Math.max(0, Math.min(index, ids.length - 1))
    focusedId.value = ids[focusedIndex.value]
    scrollToFocused()
  }

  const handleKeydown = (e: KeyboardEvent) => {
    if (!isSingleKeyShortcutsEnabled.value) return
    if (hasCommandModifier(e) || isTextFieldFocused()) return

    const ids = eventIds.value
    if (ids.length === 0) return

    // Navigation (works without focus)
    switch (e.key) {
      case 'j':
      case 'ArrowDown':
        e.preventDefault()
        updateFocus(focusedIndex.value + 1)
        return
      case 'k':
      case 'ArrowUp':
        e.preventDefault()
        updateFocus(focusedIndex.value - 1)
        return
      case 'Enter':
        if (focusedId.value && options.onOpen && !isControlFocused()) {
          e.preventDefault()
          options.onOpen(focusedId.value)
        }
        return
      case 'Escape':
        focusedIndex.value = -1
        focusedId.value = null
        return
    }

    // Action keys — require focused event
    if (ACTION_KEYS.has(e.key)) {
      if (!focusedId.value) {
        showToast('Press j/k to select an event first')
        return
      }

      e.preventDefault()

      switch (e.key) {
        case 'x':
          if (options.onDelete) {
            const deletedIndex = focusedIndex.value
            options.onDelete(focusedId.value)
            if (ids.length > 1) {
              const nextIndex = deletedIndex < ids.length - 1 ? deletedIndex : deletedIndex - 1
              setTimeout(() => updateFocus(nextIndex), 400)
            } else {
              focusedIndex.value = -1
              focusedId.value = null
            }
          }
          break
        case 'l':
          if (options.onLock) {
            options.onLock(focusedId.value)
          }
          break
        case 'y':
          if (options.onCopyPayload) {
            options.onCopyPayload(focusedId.value)
          }
          break
        case 's':
          if (options.onScreenshot) {
            options.onScreenshot(focusedId.value)
          }
          break
      }
    }
  }

  onMounted(() => {
    document.addEventListener('keydown', handleKeydown)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('keydown', handleKeydown)
  })

  return {
    focusedId,
    focusedIndex,
  }
}
