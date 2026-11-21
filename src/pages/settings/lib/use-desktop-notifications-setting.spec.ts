import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { DesktopNotifier, NotifyPermission } from '@/shared/lib/desktop-notify'
import { useSettingsStore } from '@/shared/stores'
import { useDesktopNotificationsSetting } from './use-desktop-notifications-setting'

const notifier = (opts: { supported?: boolean; permission?: NotifyPermission; answer?: NotifyPermission } = {}) => {
  let permission = opts.permission ?? 'default'
  return {
    isSupported: () => opts.supported ?? true,
    permission: () => permission,
    requestPermission: vi.fn(async () => {
      if (permission === 'default') permission = opts.answer ?? 'granted'
      return permission
    }),
    onEventReceived: vi.fn(),
    showTest: vi.fn(),
    setOpener: vi.fn()
  } satisfies DesktopNotifier
}

describe('useDesktopNotificationsSetting', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('asks the browser on turning on, stores it and sends a test', async () => {
    const n = notifier()
    const s = useDesktopNotificationsSetting(n)
    expect(s.state.value).toBe('off')

    await s.toggle()

    expect(n.requestPermission).toHaveBeenCalled()
    expect(s.state.value).toBe('on')
    expect(useSettingsStore().isDesktopNotificationsEnabled).toBe(true)
    expect(localStorage.getItem('desktop_notifications')).toBe('true')
    expect(n.showTest).toHaveBeenCalled()
  })

  it('stays off and says blocked when the person says no', async () => {
    const s = useDesktopNotificationsSetting(notifier({ answer: 'denied' }))
    await s.toggle()
    expect(s.state.value).toBe('blocked')
    expect(useSettingsStore().isDesktopNotificationsEnabled).toBe(false)
  })

  it('turns off without asking', async () => {
    const n = notifier({ permission: 'granted' })
    useSettingsStore().setDesktopNotifications(true)
    const s = useDesktopNotificationsSetting(n)
    expect(s.state.value).toBe('on')

    await s.toggle()

    expect(s.state.value).toBe('off')
    expect(n.requestPermission).not.toHaveBeenCalled()
  })

  it('cannot be turned on where the browser has no notifications', async () => {
    const n = notifier({ supported: false })
    const s = useDesktopNotificationsSetting(n)
    await s.toggle()
    expect(s.state.value).toBe('unsupported')
    expect(n.requestPermission).not.toHaveBeenCalled()
  })

  it('shows off when the stored choice is on but the site lost its permission', () => {
    useSettingsStore().setDesktopNotifications(true)
    expect(useDesktopNotificationsSetting(notifier({ permission: 'default' })).state.value).toBe('off')
  })
})
