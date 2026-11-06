// Shortcuts are single keys. A key held with Ctrl, Alt or Cmd belongs to the
// browser or the OS (Ctrl+X, Ctrl+S, Alt+1…), never to us. Shift stays: `?`.
export const hasCommandModifier = (e: KeyboardEvent): boolean =>
  e.ctrlKey || e.metaKey || e.altKey

const TEXT_FIELDS = new Set(['input', 'textarea', 'select'])
const CONTROLS = new Set(['button', 'a', 'summary'])

export const isTextFieldFocused = (): boolean => {
  const active = document.activeElement
  if (!active) return false
  return TEXT_FIELDS.has(active.tagName.toLowerCase()) || (active as HTMLElement).isContentEditable
}

// Enter on a focused button or link must press it, not open the selected event.
export const isControlFocused = (): boolean => {
  const active = document.activeElement
  if (!active) return false
  return CONTROLS.has(active.tagName.toLowerCase()) || active.getAttribute('role') === 'button'
}
