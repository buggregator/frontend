import { describe, expect, it, vi } from 'vitest'
import { useMetrics } from './use-metrics'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const sample = {
  events: { received: { sentry: 3 }, stored: { sentry: 2 }, errors: 0 },
  connections: { websocket: 1, tcp: {} },
  http: { requests_total: 7 },
  webhooks: { sent: 0, failed: 0 }
}

describe('useMetrics', () => {
  it('starts loading and shows the numbers the server sent', async () => {
    const m = useMetrics(vi.fn().mockResolvedValue(json(sample)))
    expect(m.state.value).toBe('loading')
    await m.load()
    expect(m.state.value).toBe('ready')
    expect(m.metrics.value?.http.requests_total).toBe(7)
  })

  // With metrics off the server has no /api/metrics route: the SPA answers with HTML.
  it('says metrics are off when the server answers with the HTML page', async () => {
    const html = new Response('<!doctype html><html></html>', { status: 200, headers: { 'Content-Type': 'text/html' } })
    const m = useMetrics(vi.fn().mockResolvedValue(html))
    await m.load()
    expect(m.state.value).toBe('off')
    expect(m.metrics.value).toBeNull()
  })

  it('says metrics are off on 404', async () => {
    const m = useMetrics(vi.fn().mockResolvedValue(new Response('', { status: 404 })))
    await m.load()
    expect(m.state.value).toBe('off')
  })

  it('shows an error, not zeros, when the request fails', async () => {
    const m = useMetrics(vi.fn().mockResolvedValue(json({ error: 'boom' }, 500)))
    await m.load()
    expect(m.state.value).toBe('error')
    expect(m.error.value).toContain('500')
    expect(m.metrics.value).toBeNull()

    const net = useMetrics(vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    await net.load()
    expect(net.state.value).toBe('error')
    expect(net.error.value).toContain('Failed to fetch')
  })

  it('keeps the last numbers when a later refresh fails, and marks them stale', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(json(sample)).mockRejectedValueOnce(new TypeError('offline'))
    const m = useMetrics(fetcher)
    await m.load()
    await m.load()
    expect(m.state.value).toBe('ready')
    expect(m.stale.value).toBe(true)
    expect(m.metrics.value?.http.requests_total).toBe(7)
  })
})
