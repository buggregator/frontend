// Browser preferences that follow the signed-in person (#6772). They stay in
// localStorage as today; with sign-in on, the same strings are kept on the
// server too (GET/PUT /api/me/settings, one entry per localStorage key).

type Values = Record<string, string | null>

export type SettingsRequests = {
  // The saved settings of the signed-in person.
  get: () => Promise<Record<string, unknown>>
  // Merges; null removes a key.
  put: (changes: Values) => Promise<void>
}

type SyncStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export const createSettingsSync = (
  keys: readonly string[],
  requests: SettingsRequests,
  storage: SyncStorage
) => {
  // What the server holds, as far as this browser knows; null until read.
  let saved: Values | null = null
  let isWriting = false

  const readLocal = (key: string): string | null => {
    try {
      return storage.getItem(key)
    } catch {
      return null
    }
  }

  // Takes the saved settings into this browser. True when one changed here:
  // the caller then lets the app pick them up.
  const pull = async (): Promise<boolean> => {
    const data = await requests.get()
    let isChanged = false
    saved = {}

    for (const key of keys) {
      const value = data[key]
      if (typeof value !== 'string') {
        saved[key] = null
        continue
      }

      saved[key] = value
      if (readLocal(key) !== value) {
        try {
          storage.setItem(key, value)
          isChanged = true
        } catch {
          // Storage blocked: the app keeps its defaults.
        }
      }
    }

    return isChanged
  }

  // Sends what changed here since the server last heard; a failed write is
  // sent again next time.
  const push = async (): Promise<void> => {
    if (!saved || isWriting) return

    const changes: Values = {}
    for (const key of keys) {
      const value = readLocal(key)
      if (value !== saved[key]) changes[key] = value
    }
    if (Object.keys(changes).length === 0) return

    isWriting = true
    try {
      await requests.put(changes)
      saved = { ...saved, ...changes }
    } finally {
      isWriting = false
    }
  }

  // Signed out: stop until the next pull.
  const reset = () => {
    saved = null
  }

  return { pull, push, reset }
}

export type SettingsSync = ReturnType<typeof createSettingsSync>
