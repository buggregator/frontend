// Badging API (https://w3c.github.io/badging/) is not in lib.dom yet everywhere.
type BadgeNavigator = {
  setAppBadge?: (contents?: number) => Promise<void>
  clearAppBadge?: () => Promise<void>
}

export type AppBadgeEnv = {
  navigator: BadgeNavigator
  document: Pick<Document, 'visibilityState' | 'hasFocus'>
  window: Pick<Window, 'addEventListener' | 'removeEventListener'>
}

export type AppBadge = {
  /** Call for every new event; counts only while the window is hidden or unfocused. */
  onEventsReceived: (count?: number) => void
  /** Clears any leftover badge and resets it whenever the window gets focus. Returns a stop function. */
  start: () => () => void
}

const ignore = () => {}

/**
 * Owns the "new events" counter shown on the installed app icon.
 * Where the Badging API is missing (or the app is not installed),
 * every call is a no-op.
 */
export const createAppBadge = (env: AppBadgeEnv): AppBadge => {
  const { navigator: nav, document: doc, window: win } = env
  const isSupported = typeof nav.setAppBadge === 'function' && typeof nav.clearAppBadge === 'function'

  let unseen = 0

  const isAway = () => doc.visibilityState === 'hidden' || !doc.hasFocus()

  const clear = () => {
    unseen = 0
    if (isSupported) {
      nav.clearAppBadge!().catch(ignore)
    }
  }

  const onEventsReceived = (count = 1) => {
    if (!isSupported || count <= 0 || !isAway()) {
      return
    }

    unseen += count
    nav.setAppBadge!(unseen).catch(ignore)
  }

  const start = () => {
    clear()
    win.addEventListener('focus', clear)

    return () => win.removeEventListener('focus', clear)
  }

  return { onEventsReceived, start }
}
