import { ref, watch } from 'vue'
import { LocalStorageKeys } from '../../types'

// The agents panel (#7116): one per app, mounted by the layout. Its state
// lives here, so the header button (shared/ui) and the `a` key can open it
// without knowing the widget. Open state and width are a per-viewer
// convenience: kept in this browser only.

export const ASSIST_WIDTH = { min: 360, max: 640, initial: 420, step: 20 } as const

type Stored = { open?: boolean; width?: number; to?: string }

const read = (): Stored => {
  try {
    const raw = window.localStorage.getItem(LocalStorageKeys.AssistPanel)
    return raw ? (JSON.parse(raw) as Stored) : {}
  } catch {
    return {}
  }
}

export const clampAssistWidth = (w: number): number =>
  Math.round(Math.min(ASSIST_WIDTH.max, Math.max(ASSIST_WIDTH.min, Number.isFinite(w) ? w : ASSIST_WIDTH.initial)))

const stored = read()

export const isAssistOpen = ref(stored.open === true)
export const assistWidth = ref(clampAssistWidth(stored.width ?? ASSIST_WIDTH.initial))
// The last recipient picked for a new thread (an h2a address; '' = default).
export const assistRecipient = ref(typeof stored.to === 'string' ? stored.to : '')

watch([isAssistOpen, assistWidth, assistRecipient], ([open, width, to]) => {
  try {
    window.localStorage.setItem(LocalStorageKeys.AssistPanel, JSON.stringify({ open, width, to }))
  } catch {
    // Private window or blocked storage: the panel still works, it just forgets.
  }
})

// Where focus goes back when the panel closes: the button or the element
// that had focus when `a` was pressed.
let opener: HTMLElement | null = null

export const openAssist = (from?: HTMLElement | null) => {
  opener = from ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null)
  isAssistOpen.value = true
}

export const closeAssist = () => {
  isAssistOpen.value = false
  const target = opener
  opener = null
  if (target?.isConnected) target.focus()
}

export const toggleAssist = (from?: HTMLElement | null) => {
  if (isAssistOpen.value) closeAssist()
  else openAssist(from)
}
