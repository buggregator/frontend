import { describe, expect, it, vi } from 'vitest'
import type { ServerEvent } from '../../types'
import { BURST_MS, createDesktopNotifier, errorNotice, type NotifyPermission } from './desktop-notify'

const sentry = (payload: unknown, project: string | null = 'shop', uuid = 'e1'): ServerEvent<unknown> => ({
  uuid,
  type: 'sentry',
  payload,
  project,
  timestamp: 1
})

const exception = { exception: { values: [{ type: 'PDOException', value: 'gone away' }, { type: 'RuntimeException', value: 'Checkout failed' }] } }

const makeEnv = (
  opts: { permission?: NotifyPermission; answer?: NotifyPermission; away?: boolean; supported?: boolean } = {}
) => {
  const shown: Array<{ title: string; options?: NotificationOptions; n: { onclick: null | (() => void); close: () => void } }> = []
  let now = 0
  class FakeNotification {
    static permission: NotifyPermission = opts.permission ?? 'granted'
    static requestPermission = vi.fn(async () => {
      FakeNotification.permission = opts.answer ?? 'granted'
      return FakeNotification.permission
    })
    onclick: null | (() => void) = null
    close = vi.fn()
    constructor(title: string, options?: NotificationOptions) {
      shown.push({ title, options, n: this })
    }
  }
  const focusWindow = vi.fn()
  const away = opts.away ?? true
  const env = {
    Notification: opts.supported === false ? undefined : (FakeNotification as never),
    document: { visibilityState: away ? 'hidden' : 'visible', hasFocus: () => !away } as never,
    focusWindow,
    now: () => now
  }
  return { env, shown, focusWindow, tick: (ms: number) => (now += ms) }
}

describe('errorNotice', () => {
  it('names the thrown exception and the project', () => {
    expect(errorNotice(sentry(exception))).toEqual({
      title: 'New error in shop',
      body: 'RuntimeException: Checkout failed',
      uuid: 'e1'
    })
  })

  it.each([
    ['error', { level: 'error', message: 'Payment declined' }, 'Payment declined'],
    ['fatal', { level: 'fatal', logentry: { formatted: 'Out of memory' } }, 'Out of memory'],
    ['formatted', { level: 'error', message: { formatted: 'Order 5 failed' } }, 'Order 5 failed']
  ])('takes the message of a %s message event', (_, payload, body) => {
    expect(errorNotice(sentry(payload))?.body).toBe(body)
  })

  it.each([
    ['an info message', sentry({ level: 'info', message: 'hello' })],
    ['another type', { ...sentry(exception), type: 'monolog' }]
  ])('skips %s', (_, event) => {
    expect(errorNotice(event)).toBeNull()
  })

  it('leaves the project out when there is none and clips long text', () => {
    const notice = errorNotice(sentry({ exception: { values: [{ type: 'E', value: 'x'.repeat(400) }] } }, null))
    expect(notice?.title).toBe('New error')
    expect(notice?.body.length).toBe(160)
    expect(notice?.body.endsWith('…')).toBe(true)
  })
})

describe('createDesktopNotifier', () => {
  it('shows a notification for an error while the window is away', () => {
    const { env, shown } = makeEnv()
    createDesktopNotifier(env).onEventReceived(sentry(exception), true)

    expect(shown).toHaveLength(1)
    expect(shown[0].title).toBe('New error in shop')
    expect(shown[0].options?.body).toBe('RuntimeException: Checkout failed')
  })

  it.each([
    ['turned off', { enabled: false }],
    ['not allowed', { permission: 'default' as const }],
    ['blocked', { permission: 'denied' as const }],
    ['the window in front', { away: false }],
    ['no Notification API', { supported: false }]
  ])('shows nothing when %s', (_, opts: Parameters<typeof makeEnv>[0] & { enabled?: boolean }) => {
    const { env, shown } = makeEnv(opts)
    createDesktopNotifier(env).onEventReceived(sentry(exception), opts.enabled ?? true)
    expect(shown).toHaveLength(0)
  })

  it('makes a burst one «N new errors» notice, then starts again after a pause', () => {
    const { env, shown, tick } = makeEnv()
    const notifier = createDesktopNotifier(env)

    notifier.onEventReceived(sentry(exception, 'shop', 'a'), true)
    tick(1000)
    notifier.onEventReceived(sentry(exception, 'shop', 'b'), true)
    tick(1000)
    notifier.onEventReceived(sentry(exception, 'shop', 'c'), true)

    expect(shown.map((s) => s.title)).toEqual(['New error in shop', '2 new errors', '3 new errors'])
    expect(shown.every((s) => s.options?.tag === shown[0].options?.tag)).toBe(true)

    tick(BURST_MS)
    notifier.onEventReceived(sentry(exception, 'shop', 'd'), true)
    expect(shown[3].title).toBe('New error in shop')
  })

  // #6604 review: the count is of errors not seen yet, so a click or coming
  // back to the tab starts it again.
  it('starts the count again after a click on the notice', () => {
    const { env, shown, tick } = makeEnv()
    const notifier = createDesktopNotifier(env)

    notifier.onEventReceived(sentry(exception, 'shop', 'a'), true)
    tick(1000)
    notifier.onEventReceived(sentry(exception, 'shop', 'b'), true)
    shown[1].n.onclick?.()
    tick(1000)
    notifier.onEventReceived(sentry(exception, 'shop', 'c'), true)

    expect(shown.map((s) => s.title)).toEqual(['New error in shop', '2 new errors', 'New error in shop'])
  })

  it('starts the count again when the tab is shown', () => {
    const { env, shown, tick } = makeEnv()
    const listeners: Record<string, () => void> = {}
    const doc = env.document as unknown as { visibilityState: string; addEventListener: unknown }
    doc.addEventListener = (type: string, fn: () => void) => void (listeners[type] = fn)
    const notifier = createDesktopNotifier(env)

    notifier.onEventReceived(sentry(exception, 'shop', 'a'), true)
    doc.visibilityState = 'visible'
    listeners.visibilitychange?.()
    doc.visibilityState = 'hidden'
    tick(1000)
    notifier.onEventReceived(sentry(exception, 'shop', 'b'), true)

    expect(shown.map((s) => s.title)).toEqual(['New error in shop', 'New error in shop'])
  })

  it('opens the error on click and focuses the window', () => {
    const { env, shown, focusWindow } = makeEnv()
    const notifier = createDesktopNotifier(env)
    const open = vi.fn()
    notifier.setOpener(open)

    notifier.onEventReceived(sentry(exception, 'shop', 'abc'), true)
    shown[0].n.onclick?.()

    expect(focusWindow).toHaveBeenCalled()
    expect(open).toHaveBeenCalledWith('abc')
    expect(shown[0].n.close).toHaveBeenCalled()
  })

  it('shows the test notice only with permission', () => {
    const granted = makeEnv()
    createDesktopNotifier(granted.env).showTest()
    expect(granted.shown[0].title).toBe('Notifications are on')

    const blocked = makeEnv({ permission: 'denied' })
    createDesktopNotifier(blocked.env).showTest()
    expect(blocked.shown).toHaveLength(0)
  })

  it('reports support and permission', () => {
    expect(createDesktopNotifier(makeEnv().env).isSupported()).toBe(true)
    const none = createDesktopNotifier(makeEnv({ supported: false }).env)
    expect(none.isSupported()).toBe(false)
    expect(none.permission()).toBe('denied')
  })

  it.each([
    ['asks once and takes a yes', 'default', 'granted', 'granted'],
    ['asks once and takes a no', 'default', 'denied', 'denied'],
    ['does not ask again after a no', 'denied', 'granted', 'denied']
  ] as const)('requestPermission %s', async (_, permission, answer, expected) => {
    const { env } = makeEnv({ permission, answer })
    expect(await createDesktopNotifier(env).requestPermission()).toBe(expected)
  })

  // Older Safari: requestPermission() takes a callback and returns nothing.
  it('requestPermission reads the permission when the browser returns nothing', async () => {
    const { env } = makeEnv({ permission: 'default', answer: 'granted' })
    const N = env.Notification as unknown as { requestPermission: () => unknown; permission: string }
    N.requestPermission = () => {
      N.permission = 'granted'
      return undefined
    }
    expect(await createDesktopNotifier(env).requestPermission()).toBe('granted')
  })

  it('requestPermission answers denied without the API', async () => {
    expect(await createDesktopNotifier(makeEnv({ supported: false }).env).requestPermission()).toBe('denied')
  })

  // #6607: tabs share who is looking, so a hidden tab stays quiet about an
  // error another tab of Buggregator shows right now.
  describe('several tabs', () => {
    const memory = () => {
      const items = new Map<string, string>()
      return {
        getItem: (k: string) => items.get(k) ?? null,
        setItem: (k: string, v: string) => void items.set(k, v),
        removeItem: (k: string) => void items.delete(k)
      }
    }
    const tab = (storage: ReturnType<typeof memory>, id: string, away: boolean) => {
      const made = makeEnv({ away })
      const listeners: Record<string, () => void> = {}
      const doc = made.env.document as unknown as { visibilityState: string; hasFocus: () => boolean; addEventListener: unknown }
      doc.addEventListener = (type: string, fn: () => void) => void (listeners[type] = fn)
      const win = (type: string, fn: () => void) => void (listeners[type] = fn)
      const notifier = createDesktopNotifier({ ...made.env, storage, tabId: id, onWindow: win })
      const setAway = (a: boolean) => {
        doc.visibilityState = a ? 'hidden' : 'visible'
        doc.hasFocus = () => !a
        listeners.visibilitychange?.()
        listeners[a ? 'blur' : 'focus']?.()
      }
      return { ...made, notifier, setAway, listeners }
    }

    it('a hidden tab stays quiet while another tab is looking', () => {
      const storage = memory()
      const a = tab(storage, 'a', true)
      const b = tab(storage, 'b', true)
      a.setAway(false)

      b.notifier.onEventReceived(sentry(exception), true)
      expect(b.shown).toHaveLength(0)

      a.setAway(true)
      b.notifier.onEventReceived(sentry(exception, 'shop', 'e2'), true)
      expect(b.shown).toHaveLength(1)
    })

    it('a closed tab stops counting as looking', () => {
      const storage = memory()
      const a = tab(storage, 'a', true)
      const b = tab(storage, 'b', true)
      a.setAway(false)
      a.listeners.pagehide?.()

      b.notifier.onEventReceived(sentry(exception), true)
      expect(b.shown).toHaveLength(1)
    })

    it('a stale record left by a crashed tab is ignored', () => {
      const storage = memory()
      const a = tab(storage, 'a', true)
      const b = tab(storage, 'b', true)
      a.setAway(false)
      b.tick(31 * 60_000)

      b.notifier.onEventReceived(sentry(exception), true)
      expect(b.shown).toHaveLength(1)
    })
  })

  // #6607: Chrome on Android has the API, but `new Notification` throws.
  it('turns unsupported when the browser refuses to show one', () => {
    const { env } = makeEnv()
    class Throwing {
      static permission: NotifyPermission = 'granted'
      static requestPermission = async () => 'granted' as const
      constructor() {
        throw new TypeError('Illegal constructor. Use ServiceWorkerRegistration.showNotification() instead.')
      }
    }
    const notifier = createDesktopNotifier({ ...env, Notification: Throwing as never })
    expect(notifier.isSupported()).toBe(true)

    expect(notifier.showTest()).toBe(false)
    expect(notifier.isSupported()).toBe(false)
  })
})
