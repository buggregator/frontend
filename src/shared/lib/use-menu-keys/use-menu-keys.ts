import type { Ref } from 'vue'

const ITEMS = '[role="menuitem"], [role="menuitemradio"], [role="menuitemcheckbox"]'

// A popup menu's keyboard contract (WAI-ARIA menu button): the arrows move
// between items and wrap around, Home and End jump to the ends, Escape closes.
// Focus goes to the checked item when the menu opens (focusCurrent); giving
// focus back to the opener on close is the caller's part.
export const useMenuKeys = (root: Ref<HTMLElement | null | undefined>, onClose: () => void) => {
  const items = () => Array.from(root.value?.querySelectorAll<HTMLElement>(ITEMS) ?? [])

  const focusAt = (index: number) => {
    const list = items()
    if (list.length === 0) return
    list[((index % list.length) + list.length) % list.length].focus()
  }

  const focusCurrent = () => {
    const index = items().findIndex(
      (el) => el.getAttribute('aria-checked') === 'true' || el.getAttribute('aria-current') === 'true'
    )
    focusAt(Math.max(index, 0))
  }

  const onKeydown = (e: KeyboardEvent) => {
    const at = items().indexOf(document.activeElement as HTMLElement)

    switch (e.key) {
      case 'ArrowDown':
        focusAt(at + 1)
        break
      case 'ArrowUp':
        focusAt(at < 0 ? -1 : at - 1)
        break
      case 'Home':
        focusAt(0)
        break
      case 'End':
        focusAt(-1)
        break
      case 'Escape':
        onClose()
        break
      default:
        return
    }

    e.preventDefault()
    e.stopPropagation()
  }

  return { onKeydown, focusCurrent }
}
