import { flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useEventsStore } from '@/shared/stores'
import type { MockRequestEvent } from '../types'
import { useMockTraffic } from './use-mock-traffic'

const mockEvent = (uuid: string, ruleId: string | null, project = 'default'): MockRequestEvent => ({
  uuid,
  type: 'http-dump',
  project,
  timestamp: 1,
  payload: {
    request: { method: 'GET', uri: '/mock/users/1', headers: {}, body: '', query: {} },
    mock: {
      matched: !!ruleId, rule_id: ruleId, rule_name: null, status: ruleId ? 200 : 404,
      headers: {}, body: '', body_size: 0, body_truncated: false, delay_ms: 0, near: [],
    },
  },
})

describe('useMockTraffic', () => {
  let served: MockRequestEvent[] = []
  const fetchMock = vi.fn(() => Promise.resolve(new Response(JSON.stringify({ data: served }))))

  beforeEach(() => {
    setActivePinia(createPinia())
    useEventsStore().setActiveProjectKey('default')
    served = [mockEvent('a', 'r1'), mockEvent('b', null)]
    vi.stubGlobal('fetch', fetchMock)
    // the settings store (read by addList) asks for the system theme
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    fetchMock.mockClear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('loads requests and counts hits per rule', async () => {
    const t = useMockTraffic()
    await t.load()

    expect(t.state.value).toBe('ready')
    expect(t.requests.value.map((e) => e.uuid)).toEqual(['a', 'b'])
    expect(t.hitsByRule.value.get('r1')).toBe(1)
    expect(t.noMatchCount.value).toBe(1)
  })

  it('adds live mock requests of the active project on top, once', async () => {
    const t = useMockTraffic()
    await t.load()

    useEventsStore().addList([
      mockEvent('c', 'r1'),
      mockEvent('a', 'r1'),
      mockEvent('d', 'r1', 'shop'),
      { uuid: 'e', type: 'http-dump', project: 'default', timestamp: 1, payload: { request: {} } },
    ])

    expect(t.requests.value.map((e) => e.uuid)).toEqual(['c', 'a', 'b'])
    expect(t.freshIds.value.has('c')).toBe(true)
  })

  it('holds new requests while paused', async () => {
    const t = useMockTraffic()
    await t.load()
    t.setPaused(true)

    useEventsStore().addList([mockEvent('c', 'r1')])
    expect(t.requests.value).toHaveLength(2)
    expect(t.pending.value).toHaveLength(1)

    t.setPaused(false)
    expect(t.requests.value.map((e) => e.uuid)).toEqual(['c', 'a', 'b'])
  })

  it('shows the error state when the list fails', async () => {
    fetchMock.mockImplementationOnce(() => Promise.resolve(new Response('{}', { status: 500 })))
    const t = useMockTraffic()
    await t.load()
    expect(t.state.value).toBe('error')
  })

  it('reloads on a project change', async () => {
    const t = useMockTraffic()
    await t.load()
    useEventsStore().setActiveProjectKey('shop')
    await flushPromises()
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect((fetchMock.mock.calls[1] as unknown as [string])[0]).toContain('project=shop')
  })
})
