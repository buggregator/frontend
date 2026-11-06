import { describe, expect, it, vi } from 'vitest'
import { useSentryMetrics } from './use-sentry-metrics'

const getMetrics = vi.fn()

vi.mock('./use-sentry-requests', () => ({
  useSentryRequests: () => ({ getMetrics }),
}))

const deferred = () => {
  let resolve!: (v: unknown) => void
  const promise = new Promise((r) => { resolve = r })
  return { promise, resolve }
}

const page = { data: [{ name: 'm' }], meta: { total: 1 } }

describe('useSentryMetrics', () => {
  it('reports the first load as initial loading', async () => {
    const d = deferred()
    getMetrics.mockReturnValueOnce(d.promise)
    const { fetchList, isInitialLoading } = useSentryMetrics()

    const run = fetchList()
    expect(isInitialLoading.value).toBe(true)

    d.resolve(page)
    await run
    expect(isInitialLoading.value).toBe(false)
  })

  it('keeps the list in place on a background refresh', async () => {
    getMetrics.mockResolvedValueOnce(page)
    const { fetchList, isInitialLoading, loading, metrics } = useSentryMetrics()
    await fetchList()

    const d = deferred()
    getMetrics.mockReturnValueOnce(d.promise)
    const run = fetchList()

    expect(loading.value).toBe(true)
    expect(isInitialLoading.value).toBe(false)
    expect(metrics.value).toHaveLength(1)

    d.resolve(page)
    await run
  })

  it('counts a failed first load as loaded, so a retry does not blank the page', async () => {
    getMetrics.mockRejectedValueOnce(new Error('500'))
    const { fetchList, hasLoaded } = useSentryMetrics()

    await expect(fetchList()).rejects.toThrow('500')
    expect(hasLoaded.value).toBe(true)
  })
})
