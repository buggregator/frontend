import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type Handler = (ctx: unknown) => void
let publish: Handler

vi.mock('@/shared/lib/io', () => ({
  guardHandler: (_: string, fn: Handler) => fn,
  useCentrifuge: () => ({
    centrifuge: {
      on: (_: string, h: Handler) => {
        publish = h
      },
    },
  }),
}))

vi.mock('vue', () => ({ onUnmounted: () => {} }))

const sentryEvent = () => publish({ data: { event: 'event.received', data: { type: 'sentry' } } })

describe('onSentryEvent', () => {
  let onSentryEvent: (cb: () => void) => void

  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-06T12:00:00Z'))
    vi.resetModules()
    ;({ onSentryEvent } = await import('./use-sentry-events-bus'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('notifies 1s after the first event after a quiet period', () => {
    const cb = vi.fn()
    onSentryEvent(cb)

    sentryEvent()
    vi.advanceTimersByTime(999)
    expect(cb).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('notifies at most once per 10s on a continuous stream', () => {
    const cb = vi.fn()
    onSentryEvent(cb)

    // one event every 200ms for 25s
    for (let t = 0; t < 25000; t += 200) {
      sentryEvent()
      vi.advanceTimersByTime(200)
    }

    // at 1s, 11s, 21s
    expect(cb).toHaveBeenCalledTimes(3)
  })

  // Audit 1.5: a delete or a clear made elsewhere left Sentry lists stale.
  it('notifies after a delete or a clear, once per burst', () => {
    const cb = vi.fn()
    onSentryEvent(cb)

    publish({ data: { event: 'event.deleted', data: { uuid: 'a', project: 'default' } } })
    publish({ data: { event: 'events.cleared', data: null } })
    vi.advanceTimersByTime(1000)

    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('ignores events of other types', () => {
    const cb = vi.fn()
    onSentryEvent(cb)

    publish({ data: { event: 'event.received', data: { type: 'monolog' } } })
    vi.advanceTimersByTime(20000)

    expect(cb).not.toHaveBeenCalled()
  })
})
