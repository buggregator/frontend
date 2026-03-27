import { ref, onMounted, onBeforeUnmount, type Ref } from 'vue'
import type { EventId } from '../../types'

export function useKeyboardNav(
  eventIds: Ref<EventId[]>,
  options: {
    onOpen?: (id: EventId) => void
  } = {}
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
