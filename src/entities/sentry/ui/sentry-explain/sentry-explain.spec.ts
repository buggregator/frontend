import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import SentryExplain from './sentry-explain.vue'

const centrifuge = { on: vi.fn(), removeListener: vi.fn() }

vi.mock('@/shared/lib/io', async (orig) => ({
  ...(await orig<typeof import('@/shared/lib/io')>()),
  REST_API_URL: '',
  useCentrifuge: () => ({ centrifuge })
}))

const status = { enabled: true, status: 'connected', project: 'Server', to: 'lead' }
const thread = {
  event_uuid: 'ev1',
  project: 'default',
  conversation: 'c1',
  messages: [
    { from: 'you', text: 'KeyError: 42 <b>x</b>', at: '2026-11-25T10:00:00Z' },
    { from: 'agent', role: 'lead', project: 'Server', text: 'Order 42 is <script>missing</script>', at: '2026-11-25T10:00:05Z' }
  ]
}

const json = (status: number, body: unknown) =>
  Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) } as Response)

let routes: Record<string, () => Promise<Response>>
const fetchMock = vi.fn((url: string, init?: RequestInit) => {
  const key = `${init?.method ?? 'GET'} ${url}`
  return (routes[key] ?? (() => json(404, { code: 'explain_none' })))()
})

beforeEach(() => {
  setActivePinia(createPinia())
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockClear()
  routes = { 'GET /api/explain': () => json(200, status) }
})

afterEach(() => vi.unstubAllGlobals())

const mountIt = async () => {
  const w = mount(SentryExplain, { props: { eventUuid: 'ev1' } })
  await flushPromises()
  return w
}

describe('SentryExplain', () => {
  it('stays hidden when the server has the feature off', async () => {
    routes = {}
    const w = await mountIt()
    expect(w.find('[data-test="sentry-explain"]').exists()).toBe(false)
  })

  it('stays hidden when the server answers HTML (SPA fallback)', async () => {
    routes['GET /api/explain'] = () =>
      Promise.resolve({ ok: true, status: 200, json: () => Promise.reject(new SyntaxError('html')) } as Response)
    const w = await mountIt()
    expect(w.find('[data-test="sentry-explain"]').exists()).toBe(false)
  })

  it('tells apart connecting (retries) and stopped (needs config)', async () => {
    routes['GET /api/explain'] = () => json(200, { ...status, status: 'connecting', reason: 'dial 10.0.0.1' })
    let w = await mountIt()
    expect(w.find('.explain__hint').text()).toContain('once Buggregator connects')
    expect(w.find('.explain__hint').text()).not.toContain('10.0.0.1')
    expect(w.find('.explain__hint').attributes('title')).toBe('dial 10.0.0.1')
    routes['GET /api/explain'] = () => json(200, { ...status, status: 'stopped', reason: 'bad token' })
    w = await mountIt()
    expect(w.find('.explain__hint').text()).toContain('Check explain.url and explain.token, then restart')
    expect(w.find('[data-test="sentry-explain-start"]').attributes('disabled')).toBeDefined()
  })

  it('sends the error and shows the answers as escaped text', async () => {
    routes['POST /api/explain/event/ev1'] = () => json(200, thread)
    const w = await mountIt()
    await w.find('input').setValue('why?')
    await w.find('form').trigger('submit')
    await flushPromises()

    const post = fetchMock.mock.calls.find(([, i]) => i?.method === 'POST')!
    expect(JSON.parse(post[1]!.body as string)).toEqual({ text: 'why?' })
    const msgs = w.findAll('[data-test="sentry-explain-message"]')
    expect(msgs).toHaveLength(2)
    expect(msgs[1].text()).toContain('lead · Server')
    expect(msgs[1].html()).toContain('&lt;script&gt;')
    expect(w.find('[data-test="sentry-explain-send"]').exists()).toBe(true)
  })

  it('sends a follow-up into the same thread', async () => {
    routes['GET /api/explain/event/ev1'] = () => json(200, thread)
    const next = { ...thread, messages: [...thread.messages, { from: 'you', text: 'A test?', at: '2026-11-25T10:01:00Z' }] }
    routes['POST /api/explain/event/ev1/messages'] = () => json(200, next)
    const w = await mountIt()
    await w.find('input').setValue('A test?')
    await w.find('form').trigger('submit')
    await flushPromises()

    expect(w.findAll('[data-test="sentry-explain-message"]')).toHaveLength(3)
    expect(w.text()).toContain('Waiting for an answer')
    expect((w.find('input').element as HTMLInputElement).value).toBe('')
  })

  it('shows a plain error when harnsy is offline', async () => {
    routes['POST /api/explain/event/ev1'] = () => json(503, { code: 'explain_offline', error: 'x' })
    const w = await mountIt()
    await w.find('form').trigger('submit')
    await flushPromises()
    expect(w.find('[role="alert"]').text()).toContain('Not connected to harnsy')
  })

  it('reloads the thread on an explain.message push for this event', async () => {
    const w = await mountIt()
    routes['GET /api/explain/event/ev1'] = () => json(200, thread)
    const handler = centrifuge.on.mock.calls.at(-1)![1]
    handler({ data: { event: 'explain.message', data: { event_uuid: 'other' } } })
    await flushPromises()
    expect(w.findAll('[data-test="sentry-explain-message"]')).toHaveLength(0)
    handler({ data: { event: 'explain.message', data: { event_uuid: 'ev1' } } })
    await flushPromises()
    expect(w.findAll('[data-test="sentry-explain-message"]')).toHaveLength(2)
  })
})
