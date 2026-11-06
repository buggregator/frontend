import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSentryTraces } from './use-sentry-traces'

const getTraces = vi.fn()

vi.mock('./use-sentry-requests', () => ({
  useSentryRequests: () => ({ getTraces, getTraceDetail: vi.fn() }),
}))

// Audit 5.3: a 500 showed "No traces yet", as if the SDK sent nothing.
describe('useSentryTraces: load error', () => {
  beforeEach(() => {
    getTraces.mockReset()
  })

  it('keeps the reason of a failed load and clears it on the next success', async () => {
    getTraces.mockRejectedValueOnce(Object.assign(new Error('Request failed'), { status: 500 }))
    const traces = useSentryTraces()

    await traces.fetchList()
    expect(traces.error.value).toBe('The server answered 500.')
    expect(traces.hasLoaded.value).toBe(true)

    getTraces.mockResolvedValueOnce({ data: [], meta: { total: 0 } })
    await traces.fetchList()
    expect(traces.error.value).toBe('')
  })
})
