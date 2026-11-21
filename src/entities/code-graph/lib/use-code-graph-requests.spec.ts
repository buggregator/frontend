import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CodeGraphApiError, useCodeGraphRequests } from './use-code-graph-requests'

const reply = (body: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(body), { status }))

describe('useCodeGraphRequests', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const url = (call = 0) => new URL(fetchMock.mock.calls[call][0] as string, 'http://x')

  it('asks callers with depth and limit', async () => {
    fetchMock.mockReturnValue(reply({ nodes: [], edges: [], truncated: false }))
    await useCodeGraphRequests().getCallers(42, 2, 9)
    expect(url().pathname).toBe('/api/code/symbols/42/callers')
    expect(Object.fromEntries(url().searchParams)).toEqual({ depth: '2', limit: '9' })
  })

  it('leaves empty params out of the query', async () => {
    fetchMock.mockReturnValue(reply({ symbols: [] }))
    await useCodeGraphRequests().search('place', { root: undefined, limit: 20 })
    expect(Object.fromEntries(url().searchParams)).toEqual({ q: 'place', limit: '20' })
  })

  it('reads an old server without the module as «off»', async () => {
    fetchMock.mockReturnValue(reply({ error: 'not found' }, 404))
    await expect(useCodeGraphRequests().getRoots()).resolves.toEqual({ enabled: false, snippets: false, roots: [] })
  })

  it('throws the server code on errors', async () => {
    fetchMock.mockReturnValue(reply({ code: 'not_found', error: 'no symbol' }, 404))
    const err = await useCodeGraphRequests().getSymbol(1).catch((e) => e)
    expect(err).toBeInstanceOf(CodeGraphApiError)
    expect(err.code).toBe('not_found')
  })

  it('resolves a frame by absolute file and line', async () => {
    fetchMock.mockReturnValue(reply({ id: 7 }))
    await useCodeGraphRequests().resolve('/var/www/html/app/A.php', 88)
    expect(url().pathname).toBe('/api/code/resolve')
    expect(Object.fromEntries(url().searchParams)).toEqual({ file: '/var/www/html/app/A.php', line: '88' })
  })
})
