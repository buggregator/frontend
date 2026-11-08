import { storeToRefs } from 'pinia'
import { ref, onMounted, onBeforeUnmount, type Ref } from 'vue'
import { useSettingsStore } from '../../stores'
import type { EventId } from '../../types'
import { shortcutFor } from '../shortcuts'
import { hasCommandModifier, isControlFocused, isModalOpen, isTextFieldFocused } from './keyboard-guards'

export type KeyboardNavCallbacks = {
  onOpen?: (id: EventId) => void
  onDelete?: (id: EventId) => void
  onLock?: (id: EventId) => void
  onCopyPayload?: (id: EventId) => void
  onScreenshot?: (id: EventId) => void
  // Brings the focused event into view. Default: scroll its element, which a
  // virtual list may not have rendered. Keyboard focus moves to the card after it.
  scrollToId?: (id: EventId) => void | Promise<void>
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

const ACTION_IDS = new Set(['list-delete', 'list-pin', 'list-copy', 'list-screenshot'])

export function useKeyboardNav(
  eventIds: Ref<EventId[]>,
  options: KeyboardNavCallbacks = {}
) {
  const focusedIndex = ref(-1)
  const focusedId = ref<EventId | null>(null)
  const { isSingleKeyShortcutsEnabled } = storeToRefs(useSettingsStore())

  // The selection is also keyboard focus, so a screen reader reads the card.
  // A virtual list renders the card only once it is scrolled to.
  const scrollToFocused = async () => {
    const id = focusedId.value
    if (!id) return
    if (options.scrollToId) {
      await options.scrollToId(id)
    } else {
      document.getElementById(id)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
    if (focusedId.value === id) document.getElementById(id)?.focus({ preventScroll: true })
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
    if (hasCommandModifier(e) || isTextFieldFocused() || isModalOpen()) return

    const ids = eventIds.value
    if (ids.length === 0) return

    const id = shortcutFor('event-list', e.key)
    if (!id) return

    // Navigation (works without focus)
    switch (id) {
      case 'list-next':
        e.preventDefault()
        updateFocus(focusedIndex.value + 1)
        return
      case 'list-prev':
        e.preventDefault()
        updateFocus(focusedIndex.value - 1)
        return
      case 'list-open':
        if (focusedId.value && options.onOpen && !isControlFocused()) {
          e.preventDefault()
          options.onOpen(focusedId.value)
        }
        return
      case 'list-clear':
        focusedIndex.value = -1
        focusedId.value = null
        return
    }

    // Action keys — require focused event
    if (ACTION_IDS.has(id)) {
      if (!focusedId.value) {
        showToast('Press j/k to select an event first')
        return
      }

      e.preventDefault()

      switch (id) {
        case 'list-delete':
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
        case 'list-pin':
          if (options.onLock) {
            options.onLock(focusedId.value)
          }
          break
        case 'list-copy':
          if (options.onCopyPayload) {
            options.onCopyPayload(focusedId.value)
          }
          break
        case 'list-screenshot':
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
