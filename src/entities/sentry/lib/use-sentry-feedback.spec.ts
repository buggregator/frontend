import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { useEventsStore } from '@/shared/stores'
import { useEventFeedback, useSentryFeedbackList } from './use-sentry-feedback'

vi.mock('./use-sentry-events-bus', () => ({ onSentryEvent: vi.fn() }))

const item = {
  id: '1', project: 'shop', event_id: 'abc', feedback_id: 'f1', name: 'Ann', email: 'ann@example.com',
  message: 'Broken', url: 'http://shop.test', source: 'feedback', received_at: '2026-11-21T10:00:00Z'
}
const ok = (data: unknown[]) => new Response(JSON.stringify({ data, meta: { total: data.length, page: 1, limit: 50 } }))

const run = <T>(fn: () => T) => {
  let result!: T
  mount(defineComponent({ setup: () => { result = fn(); return () => h('div') } }))
  return result
}

describe('useEventFeedback', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    setActivePinia(createPinia())
    useEventsStore().setActiveProjectKey('shop')
    useEventsStore().setPeriod('7d')
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset()
  })

  afterEach(() => vi.unstubAllGlobals())

  it('asks by event id only, without project or period', async () => {
    fetchMock.mockResolvedValueOnce(ok([item]))
    const { items } = run(() => useEventFeedback('abc'))
    await flushPromises()

    const url = new URL(fetchMock.mock.calls[0][0] as string, 'http://x')
    expect(url.pathname).toBe('/api/sentry/feedback')
    expect(Object.fromEntries(url.searchParams)).toEqual({ event_id: 'abc', limit: '50' })
    expect(items.value).toEqual([item])
  })

  it('takes a 404 (an older server) as no feedback, not an error', async () => {
    fetchMock.mockResolvedValueOnce(new Response('', { status: 404 }))
    const { items, error } = run(() => useEventFeedback('abc'))
    await flushPromises()

    expect(items.value).toEqual([])
    expect(error.value).toBe('')
  })

  it('reports other failures', async () => {
    fetchMock.mockResolvedValueOnce(new Response('', { status: 500, statusText: 'Server Error' }))
    const { error } = run(() => useEventFeedback('abc'))
    await flushPromises()

    expect(error.value).not.toBe('')
  })

  it('asks nothing without an id', async () => {
    run(() => useEventFeedback(''))
    await flushPromises()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('useSentryFeedbackList', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    setActivePinia(createPinia())
    useEventsStore().setActiveProjectKey('shop')
    useEventsStore().setPeriod('7d')
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset()
  })

  afterEach(() => vi.unstubAllGlobals())

  it('lists the feedback of the project and period', async () => {
    fetchMock.mockResolvedValueOnce(ok([item]))
    const list = useSentryFeedbackList()
    await list.fetchList()

    const url = new URL(fetchMock.mock.calls[0][0] as string, 'http://x')
    expect(Object.fromEntries(url.searchParams)).toMatchObject({ project: 'shop', window: '7d', page: '1' })
    expect(list.items.value).toEqual([item])
    expect(list.total.value).toBe(1)
  })
})
