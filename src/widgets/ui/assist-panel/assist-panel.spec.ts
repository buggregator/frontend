import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import {
  assistWidth,
  closeAssist,
  isAssistOpen,
  openAssist,
  providePageContext,
  resetPageContexts
} from '@/shared/lib/assist'
import AssistPanel from './assist-panel.vue'

const centrifuge = { on: vi.fn(), removeListener: vi.fn() }
const push = vi.fn()

vi.mock('@/shared/lib/io', async (orig) => ({
  ...(await orig<typeof import('@/shared/lib/io')>()),
  REST_API_URL: '',
  useCentrifuge: () => ({ centrifuge })
}))
vi.mock('vue-router', async (orig) => ({
  ...(await orig<typeof import('vue-router')>()),
  useRouter: () => ({ push })
}))

const connected = { enabled: true, status: 'connected', project: 'Server', to: 'lead', mcp: { on: true, read_only: true } }
const thread = {
  id: 7,
  kind: 'event',
  key: 'ev1',
  title: 'Sentry error · OrderError: Order 15 not found',
  project: 'shop',
  conversation: 'c1',
  messages: [
    { from: 'you', text: 'Sentry error\nstack…', at: '2026-11-25T10:00:00Z', context: true },
    { from: 'you', text: 'Why does this fail?', at: '2026-11-25T10:00:01Z' },
    { from: 'agent', role: 'server-lid', text: 'See [Order 14](/sentry/event/0b7e91c2) <script>x</script>', at: '2026-11-25T10:00:05Z' }
  ]
}

const json = (status: number, body: unknown) =>
  Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) } as Response)

let routes: Record<string, (init?: RequestInit) => Promise<Response>>
const fetchMock = vi.fn((url: string, init?: RequestInit) => {
  const key = `${init?.method ?? 'GET'} ${url}`
  return (routes[key] ?? (() => json(404, { code: 'assist_none' })))(init)
})
const posted = (path: string) =>
  fetchMock.mock.calls.filter(([u, i]) => u === path && i?.method === 'POST').map(([, i]) => JSON.parse(String(i?.body)))

// A page with an event context and the panel, as the app has them.
const Host = defineComponent({
  setup() {
    providePageContext(() => ({ kind: 'event', key: 'ev1', title: 'Sentry error · OrderError: Order 15 not found' }))
    return () => h(AssistPanel)
  }
})

const mountIt = async () => {
  const w = mount(Host, { attachTo: document.body })
  await flushPromises()
  return w
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockClear()
  push.mockClear()
  routes = {
    'GET /api/assist': () => json(200, connected),
    'GET /api/assist/threads?kind=event&key=ev1': () => json(404, { code: 'assist_none' })
  }
  openAssist(null)
})

afterEach(() => {
  vi.unstubAllGlobals()
  resetPageContexts()
  isAssistOpen.value = false
  document.body.innerHTML = ''
})

describe('AssistPanel', () => {
  it('not set up (module off: HTML answer): explains and links the guide, no box', async () => {
    routes['GET /api/assist'] = () =>
      Promise.resolve({ ok: true, status: 200, json: () => Promise.reject(new SyntaxError('html')) } as Response)
    const w = await mountIt()
    expect(w.text()).toContain('Agents are not connected')
    expect(w.text()).toContain('Not set up')
    expect(w.find('a[href*="docs.buggregator.dev/config/agents"]').exists()).toBe(true)
    expect(w.find('textarea').exists()).toBe(false)
    w.unmount()
  })

  it('empty: the context chip, «Server · lead», three ready questions', async () => {
    const w = await mountIt()
    expect(w.find('.ap__chip').text()).toContain('OrderError: Order 15 not found')
    expect(w.find('.ap__status').text()).toContain('Server · lead')
    expect(w.text()).toContain('Ask about this error')
    expect(w.findAll('.ap-talk__prompt').map((b) => b.text())).toEqual([
      'Why does this fail?›',
      'When did this start, and how often?›',
      'Write a test that reproduces it›'
    ])
    expect(w.text()).not.toContain('read-only mode')
    w.unmount()
  })

  it('a ready question starts the thread with the event context only (the server builds the text)', async () => {
    routes['POST /api/assist/threads'] = () => json(200, thread)
    const w = await mountIt()
    await w.findAll('.ap-talk__prompt')[0].trigger('click')
    await flushPromises()
    expect(posted('/api/assist/threads')).toEqual([
      { context: { kind: 'event', key: 'ev1', title: 'Sentry error · OrderError: Order 15 not found' }, text: 'Why does this fail?' }
    ])
    // The context folded, the question, the answer as Markdown with an in-app chip, no raw HTML.
    expect(w.find('details.ap-msg__context summary').text()).toContain('Context sent')
    expect(w.find('.ap-msg__you').text()).toBe('Why does this fail?')
    expect(w.find('.ap-msg--agent .ap-msg__who').text()).toBe('server-lid')
    await vi.dynamicImportSettled()
    await flushPromises()
    expect(w.find('.ap-msg--agent a.md-text__chip').attributes('href')).toBe('/sentry/event/0b7e91c2')
    expect(w.find('.ap-msg--agent script').exists()).toBe(false)
    w.unmount()
  })

  it('a question in a thread is a follow-up; our last word shows «Waiting for an answer…»', async () => {
    routes['GET /api/assist/threads?kind=event&key=ev1'] = () => json(200, thread)
    const waitingThread = { ...thread, messages: [...thread.messages, { from: 'you', text: 'And now?', at: '2026-11-25T10:01:00Z' }] }
    routes['POST /api/assist/threads/7/messages'] = () => json(200, waitingThread)
    const w = await mountIt()
    await w.find('textarea').setValue('And now?')
    await w.find('textarea').trigger('keydown', { key: 'Enter' })
    await flushPromises()
    expect(posted('/api/assist/threads/7/messages')).toEqual([{ text: 'And now?' }])
    expect(w.find('textarea').element.value).toBe('')
    expect(w.find('.ap-msg--waiting').text()).toContain('Waiting for an answer…')
    w.unmount()
  })

  it('409 assist_exists (another tab started it): the question goes on as a follow-up', async () => {
    routes['POST /api/assist/threads'] = () => json(409, { code: 'assist_exists', error: 'exists', thread })
    routes['POST /api/assist/threads/7/messages'] = () => json(200, thread)
    const w = await mountIt()
    await w.find('textarea').setValue('Hi')
    await w.find('form').trigger('submit')
    await flushPromises()
    expect(posted('/api/assist/threads/7/messages')).toEqual([{ text: 'Hi' }])
    w.unmount()
  })

  it('a failed send stays with its error and «Try again», which sends it again', async () => {
    routes['POST /api/assist/threads'] = () => json(503, { code: 'h2a_no_holder', error: 'no holder' })
    const w = await mountIt()
    await w.find('textarea').setValue('Why?')
    await w.find('form').trigger('submit')
    await flushPromises()
    const alert = w.find('.ap-msg__error[role="alert"]')
    expect(alert.text()).toContain('Not sent: nobody is available to answer in project Server.')
    expect(w.find('.ap-msg__you').text()).toBe('Why?')
    // The box keeps the text too.
    expect(w.find('textarea').element.value).toBe('Why?')

    routes['POST /api/assist/threads'] = () => json(200, thread)
    await w.find('.ap-msg__retry').trigger('click')
    await flushPromises()
    expect(posted('/api/assist/threads')).toHaveLength(2)
    expect(w.find('.ap-msg__error').exists()).toBe(false)
    w.unmount()
  })

  it('connecting: send is off with its reason; stopped: the raw reason only in the title', async () => {
    routes['GET /api/assist'] = () => json(200, { enabled: true, status: 'connecting', to: 'lead' })
    let w = await mountIt()
    expect(w.find('.ap__note[role="status"]').text()).toContain('harnsy is not reachable yet')
    await w.find('textarea').setValue('x')
    expect(w.find('.ap-compose__send').attributes('disabled')).toBeDefined()
    expect(w.find('.ap-compose__send').attributes('title')).toBe('Not connected')
    w.unmount()

    routes['GET /api/assist'] = () =>
      json(200, { enabled: true, status: 'stopped', reason: 'dial tcp: refused', to: 'lead' })
    w = await mountIt()
    expect(w.find('.ap__note[role="alert"]').text()).toContain('Check explain.url and explain.token')
    expect(w.find('.ap__status').attributes('title')).toBe('dial tcp: refused')
    expect(w.text()).not.toContain('dial tcp')
    w.unmount()
  })

  it('MCP off: a note says agents see only what is sent', async () => {
    routes['GET /api/assist'] = () => json(200, { ...connected, mcp: { on: false } })
    const w = await mountIt()
    expect(w.text()).toContain('read-only mode')
    w.unmount()
  })

  it('Esc closes; ← → on the edge resize by 20 px within 360–640', async () => {
    assistWidth.value = 420
    const w = await mountIt()
    const grip = w.find('[role="separator"]')
    await grip.trigger('keydown', { key: 'ArrowLeft' })
    expect(assistWidth.value).toBe(440)
    assistWidth.value = 640
    await grip.trigger('keydown', { key: 'ArrowLeft' })
    expect(assistWidth.value).toBe(640)
    expect(grip.attributes('aria-valuemax')).toBe('640')

    await w.find('textarea').trigger('keydown', { key: 'Escape' })
    expect(isAssistOpen.value).toBe(false)
    w.unmount()
  })

  it('Recent lists the last threads; a page thread opens its page', async () => {
    routes['GET /api/assist/threads?recent=10'] = () =>
      json(200, {
        threads: [
          { id: 3, kind: 'page', key: '/sentry/exceptions?project=shop', title: 'Sentry exceptions', project: 'shop', updated_at: new Date().toISOString() }
        ]
      })
    const w = await mountIt()
    await w.find('[aria-label="Recent threads"]').trigger('click')
    await flushPromises()
    const item = w.find('.ap-recent__item')
    expect(item.text()).toContain('Sentry exceptions')
    await item.trigger('click')
    await flushPromises()
    expect(push).toHaveBeenCalledWith('/sentry/exceptions?project=shop')
    w.unmount()
  })
})

afterEach(() => closeAssist())
