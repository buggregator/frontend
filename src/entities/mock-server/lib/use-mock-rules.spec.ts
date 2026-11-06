import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { MockRule } from '../types'
import { useMockRules } from './use-mock-rules'

const rule = (id: string, readOnly = false): MockRule => ({
  id, project: '', name: id, method: 'GET', path: `/${id}`, status: 200, headers: {}, body: '',
  delay_ms: 0, enabled: true, position: 0, source: readOnly ? 'config' : 'api', read_only: readOnly,
})

describe('useMockRules', () => {
  const list = [rule('y1', true), rule('a'), rule('b'), rule('c')]
  const fetchMock = vi.fn((url: string, init?: RequestInit) => {
    if (url.endsWith('/order')) {
      const { ids } = JSON.parse(String(init?.body))
      return Promise.resolve(new Response(JSON.stringify({ data: [list[0], ...ids.map((id: string) => rule(id))] })))
    }
    if (init?.method === 'PUT') {
      return Promise.resolve(new Response(JSON.stringify({ ...rule('a'), ...JSON.parse(String(init.body)) })))
    }
    return Promise.resolve(new Response(JSON.stringify({ data: list })))
  })

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockClear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('splits yaml rules from editable ones', async () => {
    const r = useMockRules()
    await r.load()
    expect(r.configRules.value.map((x) => x.id)).toEqual(['y1'])
    expect(r.ownRules.value.map((x) => x.id)).toEqual(['a', 'b', 'c'])
  })

  it('moves an editable rule and sends only editable ids', async () => {
    const r = useMockRules()
    await r.load()
    await r.move('c', -1)

    const [, init] = fetchMock.mock.calls[1] as unknown as [string, RequestInit]
    expect(JSON.parse(String(init.body))).toEqual({ ids: ['a', 'c', 'b'] })
    expect(r.ownRules.value.map((x) => x.id)).toEqual(['a', 'c', 'b'])
  })

  it('does not move past the ends', async () => {
    const r = useMockRules()
    await r.load()
    await r.move('a', -1)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('toggles a rule through PUT with the rule kept', async () => {
    const r = useMockRules()
    await r.load()
    await r.toggle(r.rules.value[1])

    const [url, init] = fetchMock.mock.calls[1] as unknown as [string, RequestInit]
    expect(url).toMatch(/\/api\/mocks\/a$/)
    expect(JSON.parse(String(init.body))).toMatchObject({ path: '/a', enabled: false })
    expect(r.rules.value[1].enabled).toBe(false)
  })
})
