import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { MockRule } from '../types'
import { MockApiError } from './use-mock-requests'
import { useMockRules } from './use-mock-rules'

const rule = (id: string, group = ''): MockRule => ({
  id, project: '', name: id, method: 'GET', path: `/${id}`, status: 200, headers: {}, body: '',
  delay_ms: 0, enabled: true, position: 0, source: 'api', read_only: false, group,
})

describe('useMockRules: OpenAPI groups', () => {
  let stored: MockRule[] = []
  const fetchMock = vi.fn((url: string, init?: RequestInit) => {
    if (url.endsWith('/import/openapi')) {
      const body = JSON.parse(String(init?.body))
      if (!body.spec) {
        return Promise.resolve(new Response(JSON.stringify({
          message: 'invalid mock rule: spec: the spec has no paths', code: 422, errors: { spec: 'the spec has no paths' },
        }), { status: 422 }))
      }
      stored = [rule('a'), rule('p1', 'openapi:Shop'), rule('p2', 'openapi:Shop')]
      return Promise.resolve(new Response(JSON.stringify({
        group: 'openapi:Shop', title: 'Shop', rules: stored.slice(1), skipped: [{ method: 'GET', path: '/f/{n}.json', reason: 'bad' }],
      })))
    }
    if (init?.method === 'DELETE') {
      stored = stored.filter((r) => !r.group)
      return Promise.resolve(new Response(JSON.stringify({ deleted: 2 })))
    }
    return Promise.resolve(new Response(JSON.stringify({ data: stored })))
  })

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockClear()
    stored = [rule('a')]
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('imports a spec and reloads the list', async () => {
    const r = useMockRules()
    await r.load()
    const res = await r.importOpenAPI({ spec: 'openapi: 3.0.0' })

    expect(res.rules).toHaveLength(2)
    expect(res.skipped[0].reason).toBe('bad')
    expect(r.rules.value.map((x) => x.id)).toEqual(['a', 'p1', 'p2'])
  })

  it('hands the field errors of a refused import to the form', async () => {
    const r = useMockRules()
    const err = await r.importOpenAPI({ url: 'https://x' }).catch((e) => e)
    expect(err).toBeInstanceOf(MockApiError)
    expect(err.status).toBe(422)
    expect(err.fields).toEqual({ spec: 'the spec has no paths' })
  })

  // Group names are free text: spaces and ':' go into the path encoded.
  it('deletes a group by its encoded name and reloads the list', async () => {
    stored = [rule('a'), rule('p1', 'openapi:Shop API')]
    const r = useMockRules()
    await r.load()
    await r.removeGroup('openapi:Shop API')

    const del = fetchMock.mock.calls.find(([, init]) => init?.method === 'DELETE')
    expect(del?.[0]).toMatch(/\/api\/mocks\/groups\/openapi%3AShop%20API$/)
    expect(r.rules.value.map((x) => x.id)).toEqual(['a'])
  })
})
