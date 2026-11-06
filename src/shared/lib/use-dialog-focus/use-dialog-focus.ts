import { onBeforeUnmount, onMounted, type Ref } from 'vue'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

// A modal dialog's keyboard contract: focus goes in on open, Tab and Shift+Tab
// stay inside, Escape closes, and focus returns to the opener on close.
export const useDialogFocus = (root: Ref<HTMLElement | null>, onClose: () => void) => {
  let opener: HTMLElement | null = null

  const focusables = () =>
    Array.from(root.value?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])

  const onKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      onClose()
      return
    }
    if (e.key !== 'Tab') return
    const items = focusables()
    if (!items.length) {
      e.preventDefault()
      return
    }
    const first = items[0]
    const last = items[items.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  onMounted(() => {
    opener = document.activeElement as HTMLElement | null
    root.value?.addEventListener('keydown', onKeydown)
    ;(focusables()[0] ?? root.value)?.focus()
  })

  onBeforeUnmount(() => {
    root.value?.removeEventListener('keydown', onKeydown)
    if (opener && document.contains(opener)) opener.focus()
  })
}
