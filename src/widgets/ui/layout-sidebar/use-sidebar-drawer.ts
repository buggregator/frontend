import { readonly, ref } from 'vue'

// The main menu open over the page (below 1280 px). One state for the whole
// app: the rail's expand button and the header's burger (phones, where the
// rail is hidden) open the same drawer.
const isOpen = ref(false)
// Whoever opened the drawer gets the focus back when it closes.
let opener: HTMLElement | null = null

// Still on the page and not hidden (the burger is display:none above md).
const isShown = (el: HTMLElement | null): el is HTMLElement =>
  !!el && el.isConnected && el.checkVisibility?.() !== false

export const useSidebarDrawer = () => {
  // `trigger`: the control that opens it. A tap does not focus a button on
  // iOS Safari, so the focused element is only the fallback.
  const open = (trigger?: EventTarget | null) => {
    const active = trigger instanceof HTMLElement ? trigger : document.activeElement
    opener = active instanceof HTMLElement && active !== document.body ? active : null
    isOpen.value = true
  }

  // Closes the drawer; returns the element that should get the focus back
  // (the opener when it is still on screen), or null.
  const close = (): HTMLElement | null => {
    if (!isOpen.value) return null
    isOpen.value = false
    const back = isShown(opener) ? opener : null
    opener = null
    return back
  }

  return { isOpen: readonly(isOpen), open, close }
}
