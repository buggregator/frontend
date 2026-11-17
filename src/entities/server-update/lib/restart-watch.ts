import type { UpdateStatus } from '../types'

export type RestartWatchOptions = {
  fetchStatus: () => Promise<UpdateStatus | null>
  // The server version this tab loaded with: another one answering means
  // the new version runs.
  loadedVersion: string
  onReload: () => void
  // The server answered and is no longer restarting (rolled back, failed…).
  onStatus: (status: UpdateStatus) => void
  onGiveUp: () => void
  interval?: number
  timeout?: number
}

// While the server restarts the socket is down: ask GET /api/update every
// second until a new version answers (reload the page), the update ends
// another way (show it), or the time is up (say so).
export const startRestartWatch = (options: RestartWatchOptions) => {
  const { fetchStatus, loadedVersion, onReload, onStatus, onGiveUp, interval = 1000, timeout = 90_000 } = options

  let stopped = false
  let timer: ReturnType<typeof setTimeout> | null = null
  const startedAt = Date.now()

  const stop = () => {
    stopped = true
    if (timer) clearTimeout(timer)
    timer = null
  }

  const handle = (status: UpdateStatus | null) => {
    if (!status) return false
    if (status.current && status.current !== loadedVersion) {
      stop()
      onReload()
      return true
    }
    if (status.state?.phase !== 'restarting') {
      stop()
      onStatus(status)
      return true
    }
    return false
  }

  const tick = async () => {
    timer = null
    if (stopped) return

    try {
      if (handle(await fetchStatus())) return
    } catch (_) {
      // The server is away: ask again.
    }

    if (stopped) return
    if (Date.now() - startedAt >= timeout) {
      stop()
      onGiveUp()
      return
    }
    timer = setTimeout(tick, interval)
  }

  timer = setTimeout(tick, interval)

  return stop
}
