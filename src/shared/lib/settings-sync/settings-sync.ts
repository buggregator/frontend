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

// 400/413: this request will never pass as it is; anything else may.
const isRefused = (e: unknown): boolean => {
  const status = (e as { status?: unknown })?.status
  return status === 400 || status === 413
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
  // the caller then lets the app pick them up. replaceLocal: this browser
  // holds someone else's settings; the ones the account lacks are dropped
  // here instead of being sent to it.
  const pull = async ({ replaceLocal = false }: { replaceLocal?: boolean } = {}): Promise<boolean> => {
    const data = await requests.get()
    let isChanged = false
    saved = {}

    for (const key of keys) {
      const value = data[key]
      if (typeof value !== 'string') {
        saved[key] = null
        if (replaceLocal && readLocal(key) !== null) {
          try {
            storage.removeItem(key)
            isChanged = true
          } catch {
            // Storage blocked: nothing to drop.
          }
        }
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
    } catch (e) {
      if (!isRefused(e)) throw e
      await sendOneByOne(changes)
    } finally {
      isWriting = false
    }
  }

  // The server refused the batch (a value too big, too many keys): each key
  // goes alone, and one it refuses is skipped until it changes again, so it
  // does not hold back the rest.
  const sendOneByOne = async (changes: Values) => {
    for (const [key, value] of Object.entries(changes)) {
      try {
        await requests.put({ [key]: value })
      } catch (e) {
        if (!isRefused(e)) throw e
        console.warn(`Settings sync: the server refused «${key}»; it stays in this browser only`)
      }
      if (saved) saved[key] = value
    }
  }

  // Signed out: stop until the next pull.
  const reset = () => {
    saved = null
  }

  return { pull, push, reset }
}

export type SettingsSync = ReturnType<typeof createSettingsSync>
