import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { REST_API_URL } from '@/shared/lib/io'
import { useEventsStore, useProfileStore } from '@/shared/stores'
import { emptyDraft } from './mock-rule'
import { MockApiError, useMockRequests } from './use-mock-requests'

const json = (body: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }))

describe('useMockRequests', () => {
  const fetchMock = vi.fn(() => json({ data: [] }))

  beforeEach(() => {
    setActivePinia(createPinia())
    useEventsStore().setActiveProjectKey('shop')
    useProfileStore().setToken('t0k')
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockClear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const call = (i = 0) => {
    const [url, init = {}] = fetchMock.mock.calls[i] as unknown as [string, RequestInit?]
    return { url, method: init.method ?? 'GET', headers: init.headers as Record<string, string>, body: init.body }
  }

  it('lists rules with the auth token', async () => {
    await useMockRequests().getRules()
    expect(call()).toMatchObject({ url: `${REST_API_URL}/api/mocks`, method: 'GET', headers: { 'X-Auth-Token': 't0k' } })
  })

  it('lists captured requests of the active project', async () => {
    await useMockRequests().getRequests()
    expect(call().url).toBe(`${REST_API_URL}/api/mocks/requests?project=shop&limit=200`)
  })

  it('creates, updates, deletes and reorders', async () => {
    const api = useMockRequests()
    const rule = { ...emptyDraft(), path: '/users' }
    await api.createRule(rule)
    await api.updateRule('r1', rule)
    await api.deleteRule('r1')
    await api.reorderRules(['r2', 'r1'])

    expect([0, 1, 2, 3].map((i) => [call(i).method, call(i).url.replace(REST_API_URL, '')])).toEqual([
      ['POST', '/api/mocks'],
      ['PUT', '/api/mocks/r1'],
      ['DELETE', '/api/mocks/r1'],
      ['POST', '/api/mocks/order'],
    ])
    expect(JSON.parse(String(call(0).body))).toMatchObject({ path: '/users', method: 'GET' })
    expect(JSON.parse(String(call(3).body))).toEqual({ ids: ['r2', 'r1'] })
  })

  it('turns a 422 into field errors', async () => {
    fetchMock.mockImplementationOnce(() =>
      json({ message: 'invalid mock rule: path: must start with /', code: 422, errors: { path: 'must start with /' } }, 422)
    )

    const err = await useMockRequests().createRule(emptyDraft()).catch((e) => e)

    expect(err).toBeInstanceOf(MockApiError)
    expect(err.status).toBe(422)
    expect(err.fields).toEqual({ path: 'must start with /' })
  })
})
