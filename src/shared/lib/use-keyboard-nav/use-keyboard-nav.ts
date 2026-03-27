import { ref, onMounted, onBeforeUnmount, type Ref } from 'vue'
import type { EventId } from '../../types'

export type KeyboardNavCallbacks = {
  onOpen?: (id: EventId) => void
  onDelete?: (id: EventId) => void
  onLock?: (id: EventId) => void
  onCopyPayload?: (id: EventId) => void
  onScreenshot?: (id: EventId) => void
}

// Toast state — shared so any component can display it
export const toastMessage = ref('')
let toastTimer: ReturnType<typeof setTimeout> | null = null

export function showToast(message: string, duration = 2000) {
  toastMessage.value = message
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastMessage.value = '' }, duration)
}

export function useKeyboardNav(
  eventIds: Ref<EventId[]>,
  options: KeyboardNavCallbacks = {}
) {
  const focusedIndex = ref(-1)
  const focusedId = ref<EventId | null>(null)

  const isInputFocused = () => {
    const active = document.activeElement
    if (!active) return false
    const tag = active.tagName.toLowerCase()
    return tag === 'input' || tag === 'textarea' || tag === 'select' || (active as HTMLElement).isContentEditable
  }

  const scrollToFocused = () => {
    if (focusedId.value) {
      const el = document.getElementById(focusedId.value)
      el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }

  const updateFocus = (index: number) => {
    const ids = eventIds.value
    if (ids.length === 0) return

    focusedIndex.value = Math.max(0, Math.min(index, ids.length - 1))
    focusedId.value = ids[focusedIndex.value]
    scrollToFocused()
  }

  const handleKeydown = (e: KeyboardEvent) => {
    if (isInputFocused()) return

    const ids = eventIds.value
    if (ids.length === 0) return

    switch (e.key) {
      case 'j':
      case 'ArrowDown':
        e.preventDefault()
        updateFocus(focusedIndex.value + 1)
        break
      case 'k':
      case 'ArrowUp':
        e.preventDefault()
        updateFocus(focusedIndex.value - 1)
        break
      case 'Enter':
        if (focusedId.value && options.onOpen) {
          e.preventDefault()
          options.onOpen(focusedId.value)
        }
        break
      case 'Escape':
        focusedIndex.value = -1
        focusedId.value = null
        break
      case 'x':
        if (focusedId.value && options.onDelete) {
          e.preventDefault()
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
        if (focusedId.value && options.onLock) {
          e.preventDefault()
          options.onLock(focusedId.value)
        }
        break
      case 'y':
        if (focusedId.value && options.onCopyPayload) {
          e.preventDefault()
          options.onCopyPayload(focusedId.value)
        }
        break
      case 's':
        if (focusedId.value && options.onScreenshot) {
          e.preventDefault()
          options.onScreenshot(focusedId.value)
        }
        break
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
