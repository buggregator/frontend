import { createDesktopNotifier, type DesktopNotifier } from './desktop-notify'

let instance: DesktopNotifier | null = null

/** One app-wide notifier, bound to the real browser window on first use. */
export const useDesktopNotify = (): DesktopNotifier => {
  if (!instance) {
    instance = createDesktopNotifier({
      // Only in a secure context (https or localhost); elsewhere there is none.
      Notification: window.isSecureContext && 'Notification' in window ? window.Notification : undefined,
      document: window.document,
      focusWindow: () => window.focus(),
      now: () => Date.now()
    })
  }

  return instance
}
