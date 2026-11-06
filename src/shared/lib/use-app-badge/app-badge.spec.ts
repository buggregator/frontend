import { describe, expect, it, vi } from 'vitest'
import { createAppBadge, type AppBadgeEnv } from './app-badge'

const makeEnv = (opts: { supported?: boolean; visible?: boolean; focused?: boolean } = {}) => {
  const { supported = true } = opts
  const state = { visible: opts.visible ?? true, focused: opts.focused ?? true }
  const listeners: Record<string, Array<() => void>> = {}
  const on = (type: string, cb: () => void) => {
    (listeners[type] ||= []).push(cb)
  }
  const off = (type: string, cb: () => void) => {
    listeners[type] = (listeners[type] || []).filter((l) => l !== cb)
  }

  const setAppBadge = vi.fn(() => Promise.resolve())
  const clearAppBadge = vi.fn(() => Promise.resolve())

  const env: AppBadgeEnv = {
    navigator: (supported ? { setAppBadge, clearAppBadge } : {}) as AppBadgeEnv['navigator'],
    document: {
      get visibilityState() {
        return state.visible ? 'visible' : 'hidden'
      },
      hasFocus: () => state.focused,
      addEventListener: on,
      removeEventListener: off,
    } as unknown as AppBadgeEnv['document'],
    window: {
      addEventListener: on,
      removeEventListener: off,
    } as unknown as AppBadgeEnv['window'],
  }

  const fire = (type: string) => (listeners[type] || []).forEach((cb) => cb())
  const count = (type: string) => (listeners[type] || []).length

  return { env, state, fire, count, setAppBadge, clearAppBadge }
}

describe('createAppBadge', () => {
  it('does not count events while the window is focused', () => {
    const { env, setAppBadge } = makeEnv({ focused: true })
    const badge = createAppBadge(env)

    badge.onEventsReceived(3)

    expect(setAppBadge).not.toHaveBeenCalled()
  })

  it('counts events received while the window is not focused', () => {
    const { env, setAppBadge } = makeEnv({ focused: false })
    const badge = createAppBadge(env)

    badge.onEventsReceived()
    badge.onEventsReceived(2)

    expect(setAppBadge).toHaveBeenLastCalledWith(3)
  })

  it('counts events received while the window is hidden', () => {
    const { env, setAppBadge } = makeEnv({ visible: false, focused: true })
    const badge = createAppBadge(env)

    badge.onEventsReceived()

    expect(setAppBadge).toHaveBeenLastCalledWith(1)
  })

  it('clears the badge and resets the count when the window gets focus', () => {
    const { env, state, fire, setAppBadge, clearAppBadge } = makeEnv({ focused: false })
    const badge = createAppBadge(env)
    badge.start()
    badge.onEventsReceived(2)

    state.focused = true
    fire('focus')

    expect(clearAppBadge).toHaveBeenCalled()

    state.focused = false
    badge.onEventsReceived()
    expect(setAppBadge).toHaveBeenLastCalledWith(1)
  })

  it('clears a leftover badge on start', () => {
    const { env, clearAppBadge } = makeEnv()
    createAppBadge(env).start()

    expect(clearAppBadge).toHaveBeenCalledTimes(1)
  })

  it('removes its listeners on stop', () => {
    const { env, count } = makeEnv()
    const stop = createAppBadge(env).start()
    expect(count('focus')).toBe(1)

    stop()

    expect(count('focus')).toBe(0)
  })

  it('does nothing and does not throw where the Badging API is missing', () => {
    const { env, fire } = makeEnv({ supported: false, focused: false })
    const badge = createAppBadge(env)

    expect(() => {
      badge.start()
      badge.onEventsReceived(5)
      fire('focus')
    }).not.toThrow()
  })

  it('swallows a rejected badge call', async () => {
    const { env, setAppBadge } = makeEnv({ focused: false })
    setAppBadge.mockImplementation(() => Promise.reject(new Error('NotAllowedError')))
    const badge = createAppBadge(env)

    expect(() => badge.onEventsReceived()).not.toThrow()
    await Promise.resolve()
  })
})
