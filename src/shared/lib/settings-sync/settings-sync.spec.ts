import { describe, expect, it, vi } from 'vitest'
import { createSettingsSync, type SettingsRequests } from './settings-sync'

const KEYS = ['theme', 'period', 'navbar'] as const

const memory = (init: Record<string, string> = {}) => {
  const items = new Map(Object.entries(init))
  return {
    getItem: (k: string) => items.get(k) ?? null,
    setItem: (k: string, v: string) => void items.set(k, v),
    removeItem: (k: string) => void items.delete(k),
    dump: () => Object.fromEntries(items),
  }
}

const requests = (server: Record<string, unknown> = {}) => {
  const put = vi.fn((_body: Record<string, string | null>) => Promise.resolve())
  const api: SettingsRequests = { get: vi.fn(() => Promise.resolve(server)), put }
  return { api, put }
}

// #6772: browser preferences follow the signed-in person (GET/PUT /api/me/settings).
describe('createSettingsSync', () => {
  it('on sign-in takes the saved settings into this browser and says it changed', async () => {
    const storage = memory({ theme: 'light' })
    const { api, put } = requests({ theme: 'dark', period: '24h', other: 'x' })
    const sync = createSettingsSync(KEYS, api, storage)

    expect(await sync.pull()).toBe(true)
    expect(storage.dump()).toEqual({ theme: 'dark', period: '24h' })
    await sync.push()
    expect(put).not.toHaveBeenCalled()
  })

  it('says nothing changed when the browser already has the saved settings', async () => {
    const { api } = requests({ theme: 'dark' })

    expect(await createSettingsSync(KEYS, api, memory({ theme: 'dark' })).pull()).toBe(false)
  })

  it('first sign-in: the account starts with this browser’s settings', async () => {
    const { api, put } = requests({})
    const sync = createSettingsSync(KEYS, api, memory({ theme: 'dark', navbar: 'false' }))

    await sync.pull()
    await sync.push()

    expect(put).toHaveBeenCalledWith({ theme: 'dark', navbar: 'false' })
  })

  it('sends only what changed since the last write, a removed one as null', async () => {
    const storage = memory({ theme: 'dark', period: '1h' })
    const { api, put } = requests({ theme: 'dark', period: '1h' })
    const sync = createSettingsSync(KEYS, api, storage)
    await sync.pull()

    storage.setItem('theme', 'light')
    storage.removeItem('period')
    await sync.push()
    await sync.push()

    expect(put).toHaveBeenCalledTimes(1)
    expect(put).toHaveBeenCalledWith({ theme: 'light', period: null })
  })

  it('tries again on the next push when a write failed', async () => {
    const storage = memory()
    const { api, put } = requests({})
    put.mockRejectedValueOnce(new Error('down'))
    const sync = createSettingsSync(KEYS, api, storage)
    await sync.pull()

    storage.setItem('theme', 'dark')
    await expect(sync.push()).rejects.toThrow('down')
    await sync.push()

    expect(put).toHaveBeenLastCalledWith({ theme: 'dark' })
  })

  it('sends nothing before the saved settings were read', async () => {
    const { api, put } = requests({})

    await createSettingsSync(KEYS, api, memory({ theme: 'dark' })).push()

    expect(put).not.toHaveBeenCalled()
  })

  it('ignores a saved value that is not text', async () => {
    const storage = memory({ theme: 'light' })
    const { api } = requests({ theme: { mode: 'dark' } })

    expect(await createSettingsSync(KEYS, api, storage).pull()).toBe(false)
    expect(storage.dump()).toEqual({ theme: 'light' })
  })
})
