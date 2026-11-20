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

describe('useSentryTraces: source filter (#6523)', () => {
  beforeEach(() => {
    getTraces.mockReset()
    getTraces.mockResolvedValue({ data: [], meta: { total: 0 } })
  })

  it('sends source only when one is chosen', async () => {
    const traces = useSentryTraces()
    await traces.fetchList()
    expect(getTraces).toHaveBeenLastCalledWith({ page: '1' })

    traces.filters.source = 'otel'
    await traces.fetchList()
    expect(getTraces).toHaveBeenLastCalledWith({ page: '1', source: 'otel' })
  })
})

describe('useSentryTraces: service filter (#6544)', () => {
  beforeEach(() => {
    getTraces.mockReset()
    getTraces.mockResolvedValue({ data: [], meta: { total: 0 } })
  })

  it('sends service with the source when set', async () => {
    const traces = useSentryTraces()
    traces.filters.service = 'checkout-api'
    traces.filters.source = 'otel'
    await traces.fetchList()
    expect(getTraces).toHaveBeenLastCalledWith({ page: '1', source: 'otel', service: 'checkout-api' })
  })
})
