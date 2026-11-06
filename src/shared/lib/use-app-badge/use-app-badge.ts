import { createAppBadge, type AppBadge } from './app-badge'

let instance: AppBadge | null = null

/** One app-wide badge counter, bound to the real browser window on first use. */
export const useAppBadge = (): AppBadge => {
  if (!instance) {
    instance = createAppBadge({
      navigator: window.navigator,
      document: window.document,
      window,
    })
  }

  return instance
}
