import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ServerEvent } from '../../types'
import { startEventsStream } from './events-stream'

class FakeCentrifuge {
  listeners = new Map<string, Set<(ctx?: unknown) => void>>()

  on(event: string, listener: (ctx?: unknown) => void) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set())
    this.listeners.get(event)!.add(listener)
  }

  removeListener(event: string, listener: (ctx?: unknown) => void) {
    this.listeners.get(event)?.delete(listener)
  }

  emit(event: string, ctx?: unknown) {
    this.listeners.get(event)?.forEach((listener) => listener(ctx))
  }

  publish(event: string, data: unknown) {
    this.emit('publication', { data: { event, data } })
  }

  count() {
    return [...this.listeners.values()].reduce((sum, set) => sum + set.size, 0)
  }
}

const event = (uuid: string, project = 'p1') =>
  ({ uuid, type: 'smtp', project, timestamp: 1, payload: {} }) as unknown as ServerEvent<unknown>

describe('startEventsStream', () => {
  let centrifuge: FakeCentrifuge
  let project: string
  let stop: () => void
  const setConnected = vi.fn()
  const addEvents = vi.fn()
  const dropEvents = vi.fn()
  const resync = vi.fn(() => Promise.resolve())

  beforeEach(() => {
    vi.useFakeTimers()
    centrifuge = new FakeCentrifuge()
    project = 'p1'
    ;[setConnected, addEvents, dropEvents, resync].forEach((fn) => fn.mockClear())
    stop = startEventsStream({
      centrifuge: centrifuge as never,
      getProject: () => project,
      setConnected,
      addEvents,
      dropEvents,
      resync,
    })
  })

  afterEach(() => {
    stop()
    vi.useRealTimers()
  })

  it('adds the batch of the current project', () => {
    centrifuge.publish('event.received', event('a'))
    centrifuge.publish('event.received', event('b', 'p2'))
    vi.advanceTimersByTime(500)

    expect(addEvents).toHaveBeenCalledWith([event('a')])
  })

  // Audit 1.6: events of the old project leaked into the new one when the
  // project changed within the 500 ms batch.
  it('drops a waiting event when the project changes before the flush', () => {
    centrifuge.publish('event.received', event('a'))
    project = 'p2'
    vi.advanceTimersByTime(500)

    expect(addEvents).not.toHaveBeenCalled()
  })

  // Audit 1.5: a delete made in another tab stayed on screen.
  it('drops an event the server deleted in this project', () => {
    centrifuge.publish('event.deleted', { uuid: 'a', project: 'p1' })
    centrifuge.publish('event.deleted', { uuid: 'b', project: 'p2' })

    expect(dropEvents).toHaveBeenCalledTimes(1)
    expect(dropEvents).toHaveBeenCalledWith(['a'])
  })

  it('fetches the list again once after a burst of clears', () => {
    centrifuge.publish('events.cleared', null)
    centrifuge.publish('events.cleared', null)
    vi.advanceTimersByTime(300)

    expect(resync).toHaveBeenCalledTimes(1)
  })

  // Audit 1.4: events sent during a drop never showed up.
  it('fetches the list again after a reconnect, not on the first connect', () => {
    centrifuge.emit('connected')
    vi.advanceTimersByTime(300)
    expect(resync).not.toHaveBeenCalled()

    centrifuge.emit('disconnected')
    centrifuge.emit('connected')
    vi.advanceTimersByTime(300)

    expect(resync).toHaveBeenCalledTimes(1)
    expect(setConnected).toHaveBeenLastCalledWith(true)
  })

  it('polls over REST while disconnected and stops once connected', () => {
    centrifuge.emit('disconnected')
    vi.advanceTimersByTime(20000)
    expect(resync).toHaveBeenCalledTimes(2)

    centrifuge.emit('connected')
    resync.mockClear()
    vi.advanceTimersByTime(20000)
    expect(resync).not.toHaveBeenCalled()
  })

  // Audit 1.13: any socket error was taken for a drop.
  it('does not mark the socket down on an error', () => {
    centrifuge.emit('connected')
    setConnected.mockClear()
    centrifuge.emit('error', { error: { code: 1, message: 'rpc failed' } })

    expect(setConnected).not.toHaveBeenCalled()
  })

  it('removes every listener on stop', () => {
    stop()
    expect(centrifuge.count()).toBe(0)
  })
})
