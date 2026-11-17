import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { doneStatus, restartingStatus, rolledBackStatus } from '../mocks'
import type { UpdateStatus } from '../types'
import { startRestartWatch } from './restart-watch'

describe('startRestartWatch', () => {
  const onReload = vi.fn()
  const onGiveUp = vi.fn()
  const onStatus = vi.fn()
  let fetchStatus: ReturnType<typeof vi.fn<() => Promise<UpdateStatus | null>>>
  let stop: () => void

  const start = () => {
    stop = startRestartWatch({ fetchStatus, loadedVersion: '2.9.0', onReload, onGiveUp, onStatus })
  }

  beforeEach(() => {
    vi.useFakeTimers()
    ;[onReload, onGiveUp, onStatus].forEach((fn) => fn.mockClear())
    fetchStatus = vi.fn<() => Promise<UpdateStatus | null>>()
  })

  afterEach(() => {
    stop?.()
    vi.useRealTimers()
  })

  it('asks every second while the server is away and reloads once a new version answers', async () => {
    fetchStatus
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(restartingStatus)
      .mockResolvedValue(doneStatus)
    start()

    await vi.advanceTimersByTimeAsync(1000)
    await vi.advanceTimersByTimeAsync(1000)
    await vi.advanceTimersByTimeAsync(1000)
    expect(fetchStatus).toHaveBeenCalledTimes(3)
    expect(onReload).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1000)
    expect(onReload).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(5000)
    expect(fetchStatus).toHaveBeenCalledTimes(4)
  })

  // The old version is back: show it, no reload.
  it('stops without a reload when the update was rolled back', async () => {
    fetchStatus.mockResolvedValue(rolledBackStatus)
    start()

    await vi.advanceTimersByTimeAsync(1000)

    expect(onStatus).toHaveBeenCalledWith(rolledBackStatus)
    expect(onReload).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(5000)
    expect(fetchStatus).toHaveBeenCalledTimes(1)
  })

  it('gives up after about 90 seconds of silence', async () => {
    fetchStatus.mockRejectedValue(new TypeError('Failed to fetch'))
    start()

    await vi.advanceTimersByTimeAsync(89_000)
    expect(onGiveUp).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(2000)
    expect(onGiveUp).toHaveBeenCalledTimes(1)
    const calls = fetchStatus.mock.calls.length
    await vi.advanceTimersByTimeAsync(5000)
    expect(fetchStatus).toHaveBeenCalledTimes(calls)
    expect(onReload).not.toHaveBeenCalled()
  })

  it('does not ask twice at once when the server is slow', async () => {
    fetchStatus.mockImplementation(() => new Promise(() => {}))
    start()

    await vi.advanceTimersByTimeAsync(5000)

    expect(fetchStatus).toHaveBeenCalledTimes(1)
  })

  it('stops on demand', async () => {
    fetchStatus.mockResolvedValue(restartingStatus)
    start()
    stop()

    await vi.advanceTimersByTimeAsync(3000)

    expect(fetchStatus).not.toHaveBeenCalled()
  })
})
