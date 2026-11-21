import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'
import { useCodeRoots } from './use-code-roots'

const reply = (body: unknown) => Promise.resolve(new Response(JSON.stringify(body)))
const roots = (state: string) => ({ enabled: true, snippets: false, roots: [{ name: 'app', path: '/code', state }] })

describe('useCodeRoots', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.useFakeTimers()
    setActivePinia(createPinia())
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  const start = () => {
    const scope = effectScope()
    const state = scope.run(() => useCodeRoots({ interval: 2000 }))!
    return { scope, state }
  }
  const calls = () => fetchMock.mock.calls.map(([url, init]) => `${init?.method ?? 'GET'} ${new URL(url, 'http://x').pathname}`)

  it('polls while a folder is indexed and stops when it is ready', async () => {
    fetchMock
      .mockReturnValueOnce(reply(roots('indexing')))
      .mockReturnValueOnce(reply(roots('ready')))
    const { state } = start()
    await vi.advanceTimersByTimeAsync(0)
    expect(state.data.value?.roots[0].state).toBe('indexing')

    await vi.advanceTimersByTimeAsync(2000)
    expect(state.data.value?.roots[0].state).toBe('ready')
    await vi.advanceTimersByTimeAsync(10_000)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('stops polling when the section goes away', async () => {
    fetchMock.mockImplementation(() => reply(roots('pending')))
    const { scope } = start()
    await vi.advanceTimersByTimeAsync(0)
    scope.stop()
    await vi.advanceTimersByTimeAsync(10_000)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('reindexes a folder and polls its progress', async () => {
    fetchMock
      .mockReturnValueOnce(reply(roots('ready')))
      .mockReturnValueOnce(reply({ name: 'app', path: '/code', state: 'indexing' }))
      .mockReturnValueOnce(reply(roots('ready')))
    const { state } = start()
    await vi.advanceTimersByTimeAsync(0)

    const done = state.reindex('app')
    expect(state.sending.value).toEqual(['app'])
    await done
    expect(state.sending.value).toEqual([])
    expect(state.data.value?.roots[0].state).toBe('indexing')

    await vi.advanceTimersByTimeAsync(2000)
    expect(calls()).toEqual(['GET /api/code/roots', 'POST /api/code/roots/app/reindex', 'GET /api/code/roots'])
  })

  it('keeps the error to show it', async () => {
    fetchMock.mockReturnValueOnce(Promise.reject(new Error('offline')))
    const { state } = start()
    await vi.advanceTimersByTimeAsync(0)
    expect(state.error.value).toBe('offline')
    expect(state.isLoading.value).toBe(false)
  })
})
