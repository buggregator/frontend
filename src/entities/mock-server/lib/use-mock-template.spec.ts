import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'
import { REST_API_URL } from '@/shared/lib/io'
import { emptyDraft } from './mock-rule'
import { samplePath, useMockHelpers, useMockPreview, resetMockHelpersCache } from './use-mock-template'

const json = (body: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }))

const RESULT = { status: 200, headers: { 'Content-Type': 'application/json' }, body: '{"id": 42}', matched: true, error: null }

describe('samplePath', () => {
  it('fills params and the wildcard so the sample request matches the rule', () => {
    expect(samplePath('/users/{id}/files/*')).toBe('/users/42/files/a/b.png')
    expect(samplePath('')).toBe('/')
  })
})

describe('useMockHelpers', () => {
  const fetchMock = vi.fn(() => json({ helpers: [{ name: 'path' }], fake: [{ name: 'email' }] }))

  beforeEach(() => {
    setActivePinia(createPinia())
    resetMockHelpersCache()
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockClear()
  })
  afterEach(() => vi.unstubAllGlobals())

  it('loads the helper list once for every editor', async () => {
    const a = useMockHelpers()
    const b = useMockHelpers()
    await Promise.all([a.load(), b.load()])

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect((fetchMock.mock.calls[0] as unknown as [string])[0]).toBe(`${REST_API_URL}/api/mocks/helpers`)
    expect(b.state.value).toBe('ready')
    expect(b.fakes.value.map((f) => f.name)).toEqual(['email'])
  })

  it('reports an error and loads again on the next try', async () => {
    fetchMock.mockImplementationOnce(() => json({ message: 'down' }, 500))
    const h = useMockHelpers()
    await h.load()
    expect(h.state.value).toBe('error')

    await h.load()
    expect(h.state.value).toBe('ready')
  })
})

describe('useMockPreview', () => {
  const fetchMock = vi.fn(() => json(RESULT))

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockClear()
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  const lastBody = () => JSON.parse((fetchMock.mock.calls.at(-1) as unknown as [string, RequestInit])[1].body as string)

  it('sends the unsaved rule and the sample request', async () => {
    const rule = ref({ ...emptyDraft(), method: 'POST' as const, path: '/users/{id}', template: true, body: '{{ path "id" }}' })
    const p = useMockPreview(rule)
    p.sample.value.headers = 'X-A: 1'
    p.sample.value.path = '/users/42?page=2'
    await p.run()

    expect(lastBody()).toEqual({
      rule: rule.value,
      // as the field shows it: under /mock (a rule /mockups/{id} must not lose «ups»)
      request: { method: 'POST', path: '/mock/users/42?page=2', headers: { 'X-A': '1' }, body: '' },
    })
    expect(p.result.value).toEqual(RESULT)
  })

  it('starts from a request that matches the rule', () => {
    const p = useMockPreview(ref({ ...emptyDraft(), method: 'ANY' as const, path: '/orders/{id}' }))
    expect(p.sample.value).toMatchObject({ method: 'GET', path: '/orders/42' })
  })

  it('shows the message of a rejected rule and keeps no result', async () => {
    fetchMock.mockImplementationOnce(() =>
      json({ message: 'validation failed', errors: { body: 'template: body:1: unexpected "}"' } }, 422)
    )
    const p = useMockPreview(ref({ ...emptyDraft(), path: '/a', template: true }))
    await p.run()

    expect(p.result.value).toBeNull()
    expect(p.problem.value).toBe('template: body:1: unexpected "}"')
  })

  // Under /mock the server takes any sample path, so the client checks it.
  it('does not send a sample path without a leading slash and names the field', async () => {
    const p = useMockPreview(ref({ ...emptyDraft(), path: '/a' }))
    p.sample.value.path = 'users/42'
    await p.run()

    expect(fetchMock).not.toHaveBeenCalled()
    expect(p.problem.value).toBe('Sample path must start with /')
    expect(p.problemField.value).toBe('path')
  })

  it('names the rule field of a rejected rule', async () => {
    fetchMock.mockImplementationOnce(() =>
      json({ message: 'invalid mock rule: path: must start with /', errors: { path: 'must start with /' } }, 422)
    )
    const p = useMockPreview(ref({ ...emptyDraft(), path: 'users/42' }))
    await p.run()

    expect(p.problem.value).toBe('Rule path must start with /')
    expect(p.problemField.value).toBe('')
  })

  // The person must know the sample path is wrong, not the rule.
  it('names the sample path field when the server rejects it', async () => {
    fetchMock.mockImplementationOnce(() =>
      json({ message: 'validation failed', errors: { 'request.path': 'must start with /' } }, 422)
    )
    const p = useMockPreview(ref({ ...emptyDraft(), path: '/a' }))
    await p.run()

    expect(p.problem.value).toBe('Sample path must start with /')
    expect(p.problemField.value).toBe('path')
  })

  it('keeps the newest answer when an older, slower one lands later', async () => {
    let slow: (r: Response) => void = () => {}
    fetchMock
      .mockImplementationOnce(() => new Promise<Response>((res) => (slow = res)))
      .mockImplementationOnce(() => json({ ...RESULT, status: 201 }))
    const p = useMockPreview(ref({ ...emptyDraft(), path: '/a', template: true }))
    const first = p.run()
    await p.run()
    slow(new Response(JSON.stringify({ ...RESULT, status: 500 })))
    await first

    expect(p.result.value?.status).toBe(201)
    expect(p.pending.value).toBe(false)
  })

  it('stops the rerun timer when the editor closes', async () => {
    const rule = ref({ ...emptyDraft(), path: '/a', template: true, body: '1' })
    const scope = effectScope()
    const p = scope.run(() => useMockPreview(rule))!
    await p.run()
    rule.value = { ...rule.value, body: '2' }
    await nextTick()
    scope.stop()
    await vi.advanceTimersByTimeAsync(1000)

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('runs again by itself after the rule changes, once the person ran it', async () => {
    const rule = ref({ ...emptyDraft(), path: '/a', template: true, body: '1' })
    const p = useMockPreview(rule)
    rule.value = { ...rule.value, body: '2' }
    await nextTick()
    await vi.advanceTimersByTimeAsync(1000)
    expect(fetchMock).not.toHaveBeenCalled()

    await p.run()
    rule.value = { ...rule.value, body: '3' }
    await nextTick()
    rule.value = { ...rule.value, body: '4' }
    await nextTick()
    await vi.advanceTimersByTimeAsync(1000)

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(lastBody().rule.body).toBe('4')
  })
})
