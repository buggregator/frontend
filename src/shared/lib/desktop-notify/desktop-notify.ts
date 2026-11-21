import type { ServerEvent } from '../../types'

// Desktop notifications for new errors (#6604): a browser notification while
// the person works in another window. Off until they turn it on in Settings.

export type NotifyPermission = 'default' | 'granted' | 'denied'

type NotificationLike = Pick<Notification, 'onclick' | 'close'>

export type DesktopNotifyEnv = {
  // The browser's Notification constructor; undefined where there is none.
  Notification?: {
    new (title: string, options?: NotificationOptions): NotificationLike
    readonly permission: NotifyPermission
    requestPermission: () => Promise<NotifyPermission | undefined>
  }
  document: Pick<Document, 'visibilityState' | 'hasFocus'> & Partial<Pick<Document, 'addEventListener'>>
  focusWindow: () => void
  now: () => number
  // Shared by the tabs of this origin (localStorage): which tab is looking.
  storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
  tabId?: string
  // window.addEventListener for focus, blur and pagehide.
  onWindow?: (type: 'focus' | 'blur' | 'pagehide', fn: () => void) => void
}

export type ErrorNotice = { title: string; body: string; uuid: string }

// Several errors in this window make one notification «N new errors».
export const BURST_MS = 10_000

const BODY_MAX = 160
const TAG = 'buggregator-new-error'
const WATCH_KEY = 'desktop_notify_watch'
// A record older than this is from a tab that died while looking.
export const WATCH_STALE_MS = 30 * 60_000

const clip = (text: string) => (text.length > BODY_MAX ? `${text.slice(0, BODY_MAX - 1)}…` : text)

type SentryLike = {
  level?: string
  exception?: { values?: Array<{ type?: string; value?: string }> }
  message?: string | { formatted?: string; message?: string }
  logentry?: { formatted?: string; message?: string }
}

const messageOf = (p: SentryLike): string => {
  const m = p.message ?? p.logentry
  if (typeof m === 'string') return m
  return m?.formatted || m?.message || ''
}

/**
 * The notice for an error event, or null when the event is no error: a Sentry
 * event with an exception, or a message at level error or fatal.
 */
export const errorNotice = (event: ServerEvent<unknown>): ErrorNotice | null => {
  if (event.type !== 'sentry') return null
  const p = (event.payload ?? {}) as SentryLike
  const values = p.exception?.values ?? []
  // Sentry lists the chain oldest first: the last one is what was thrown.
  const main = values[values.length - 1]
  const level = (p.level || '').toLowerCase()

  if (!main && level !== 'error' && level !== 'fatal') return null
  const body = main ? [main.type, main.value].filter(Boolean).join(': ') : messageOf(p)

  const project = event.project ? ` in ${event.project}` : ''
  return { title: `New error${project}`, body: clip(body || 'Sentry error'), uuid: event.uuid }
}

export type DesktopNotifier = {
  isSupported: () => boolean
  permission: () => NotifyPermission
  /** Asks the browser; call from a click. Resolves to the answer, 'denied' when there is no API. */
  requestPermission: () => Promise<NotifyPermission>
  /** Call for every received event; shows a notification when on, allowed and the window is away. */
  onEventReceived: (event: ServerEvent<unknown>, enabled: boolean) => void
  /** A notification that says it works, right after turning it on. False: the browser refused it. */
  showTest: () => boolean
  /** What a click on a notification opens. */
  setOpener: (open: (uuid: string) => void) => void
}

export const createDesktopNotifier = (env: DesktopNotifyEnv): DesktopNotifier => {
  const N = env.Notification
  let open: (uuid: string) => void = () => {}
  let burstCount = 0
  let lastShownAt = -Infinity

  // Chrome on Android has the API, but `new Notification` throws there.
  let refused = false
  const isSupported = () => typeof N === 'function' && !refused
  const permission = (): NotifyPermission => (N ? N.permission : 'denied')
  const requestPermission = async (): Promise<NotifyPermission> => {
    if (!N) return 'denied'
    if (N.permission !== 'default') return N.permission
    try {
      // Older Safari takes a callback and returns nothing: read the answer.
      return (await N.requestPermission()) ?? N.permission
    } catch {
      return N.permission
    }
  }

  const isAway = () => env.document.visibilityState === 'hidden' || !env.document.hasFocus()

  // «N new errors» counts errors not seen yet: back in the tab, or a click on
  // the notice, starts the count again.
  const resetBurst = () => {
    burstCount = 0
    lastShownAt = -Infinity
  }
  // Tabs tell each other who is looking: a hidden tab stays quiet about an
  // error another Buggregator tab shows right now.
  const tabId = env.tabId ?? Math.random().toString(36).slice(2)
  const readWatch = (): { tab: string; at: number } | null => {
    try {
      return JSON.parse(env.storage?.getItem(WATCH_KEY) ?? 'null')
    } catch {
      return null
    }
  }
  const syncWatch = () => {
    if (!env.storage) return
    try {
      if (!isAway()) {
        env.storage.setItem(WATCH_KEY, JSON.stringify({ tab: tabId, at: env.now() }))
      } else if (readWatch()?.tab === tabId) {
        env.storage.removeItem(WATCH_KEY)
      }
    } catch {
      // Storage off: every tab decides for itself.
    }
  }
  const leave = () => {
    try {
      if (readWatch()?.tab === tabId) env.storage?.removeItem(WATCH_KEY)
    } catch {
      // As above.
    }
  }
  const otherTabLooking = () => {
    const w = readWatch()
    return !!w && w.tab !== tabId && env.now() - w.at < WATCH_STALE_MS
  }

  env.document.addEventListener?.('visibilitychange', () => {
    if (env.document.visibilityState === 'visible') resetBurst()
    syncWatch()
  })
  env.onWindow?.('focus', syncWatch)
  env.onWindow?.('blur', syncWatch)
  env.onWindow?.('pagehide', leave)
  syncWatch()

  /** False when the browser refused to show it. */
  const show = (title: string, body: string, uuid?: string): boolean => {
    if (!N || refused) return false
    try {
      // One tag: a newer notice replaces the older one instead of stacking up.
      const n = new N(title, { body, tag: TAG, icon: '/favicon/android-chrome-192x192.png' })
      n.onclick = () => {
        resetBurst()
        env.focusWindow()
        if (uuid) open(uuid)
        n.close()
      }
      return true
    } catch {
      refused = true
      return false
    }
  }

  const onEventReceived = (event: ServerEvent<unknown>, enabled: boolean) => {
    // The looking tab keeps its record fresh, so a long stay is not taken as stale.
    if (!isAway()) syncWatch()
    if (!enabled || !N || N.permission !== 'granted' || !isAway() || otherTabLooking()) return
    const notice = errorNotice(event)
    if (!notice) return

    const now = env.now()
    burstCount = now - lastShownAt < BURST_MS ? burstCount + 1 : 1
    lastShownAt = now

    if (burstCount === 1) {
      show(notice.title, notice.body, notice.uuid)
    } else {
      show(`${burstCount} new errors`, `Latest: ${notice.body}`, notice.uuid)
    }
  }

  const showTest = (): boolean =>
    N?.permission === 'granted' &&
    show('Notifications are on', 'Buggregator will tell you about new errors while you work elsewhere.')

  return {
    isSupported,
    permission,
    requestPermission,
    onEventReceived,
    showTest,
    setOpener: (fn) => {
      open = fn
    }
  }
}
