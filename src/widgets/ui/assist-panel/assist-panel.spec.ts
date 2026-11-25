import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import {
  assistRecipient,
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

  it('a context without a thread may also come as 200 {thread: null}', async () => {
    routes['GET /api/assist/threads?kind=event&key=ev1'] = () => json(200, { thread: null })
    const w = await mountIt()
    expect(w.findAll('.ap-talk__prompt')).toHaveLength(3)
    w.unmount()
  })

  it('MCP off: a note says agents see only what is sent', async () => {
    routes['GET /api/assist'] = () => json(200, { ...connected, mcp: { on: false } })
    const w = await mountIt()
    expect(w.text()).toContain('read-only mode')
    // The agent has this one event: no ready question about other events.
    expect(w.findAll('.ap-talk__prompt').map((b) => b.text())).toEqual([
      'Why does this fail?›',
      'How do I fix it?›',
      'Write a test that reproduces it›'
    ])
    expect(w.find('.ap-talk__abilities').text()).not.toMatch(/similar|when it started/i)
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

describe('AssistPanel recipient', () => {
  const many = {
    ...connected,
    to: 'lead',
    default: 'lead',
    recipients: [
      { address: 'lead', name: 'server-lid' },
      { address: 'role:42', name: 'Go developer', about: 'server code' }
    ]
  }

  beforeEach(() => {
    assistRecipient.value = ''
  })

  it('one recipient: no picker', async () => {
    routes['GET /api/assist'] = () => json(200, { ...connected, recipients: [{ address: 'lead', name: 'server-lid' }], default: 'lead' })
    const w = await mountIt()
    expect(w.find('select.ap__to-select').exists()).toBe(false)
    w.unmount()
  })

  it('several: a picker on the server default; a new thread goes to the pick, which is remembered', async () => {
    routes['GET /api/assist'] = () => json(200, many)
    routes['POST /api/assist/threads'] = () => json(200, { ...thread, to: 'role:42' })
    const w = await mountIt()
    const select = w.get('select.ap__to-select')
    expect((select.element as HTMLSelectElement).value).toBe('lead')
    expect(select.findAll('option').map((o) => o.text())).toEqual(['server-lid', 'Go developer — server code'])

    await select.setValue('role:42')
    expect(assistRecipient.value).toBe('role:42')
    await w.find('textarea').setValue('Why?')
    await w.find('form').trigger('submit')
    await flushPromises()
    expect(posted('/api/assist/threads')[0].to).toBe('role:42')
    // In a thread the recipient is fixed: text, no picker.
    expect(w.find('select.ap__to-select').exists()).toBe(false)
    expect(w.find('.ap__to').text()).toContain('Go developer')
    w.unmount()
  })

  it('bad_recipient: says so and reloads the list, so the gone one leaves the picker', async () => {
    let list = many
    routes['GET /api/assist'] = () => json(200, list)
    routes['POST /api/assist/threads'] = () => json(400, { code: 'bad_recipient', error: 'gone' })
    const w = await mountIt()
    await w.get('select.ap__to-select').setValue('role:42')
    list = { ...many, recipients: [many.recipients[0], { address: 'role:7', name: 'reviewer' }] }
    await w.find('textarea').setValue('Why?')
    await w.find('form').trigger('submit')
    await flushPromises()
    expect(w.find('.ap-msg__error').text()).toContain('that recipient is not available now')
    const select = w.get('select.ap__to-select')
    expect(select.findAll('option').map((o) => o.text())).toEqual(['server-lid', 'reviewer'])
    expect((select.element as HTMLSelectElement).value).toBe('lead')
    w.unmount()
  })

  it('a remembered pick that is gone falls back to the default', async () => {
    assistRecipient.value = 'role:99'
    routes['GET /api/assist'] = () => json(200, many)
    const w = await mountIt()
    expect((w.get('select.ap__to-select').element as HTMLSelectElement).value).toBe('lead')
    w.unmount()
  })
})

describe('AssistPanel polling', () => {
  const calls = (key: string) => fetchMock.mock.calls.filter(([u, i]) => `${i?.method ?? 'GET'} ${u}` === key).length
  const tick = async (ms: number) => {
    await vi.advanceTimersByTimeAsync(ms)
    await flushPromises()
  }

  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('stopped: never asks again by itself; «Check again» does', async () => {
    routes['GET /api/assist'] = () => json(200, { enabled: true, status: 'stopped', reason: 'x', to: 'lead' })
    const w = await mountIt()
    expect(calls('GET /api/assist')).toBe(1)
    await tick(120000)
    expect(calls('GET /api/assist')).toBe(1)
    await w.find('.ap__note-action').trigger('click')
    await flushPromises()
    expect(calls('GET /api/assist')).toBe(2)
    w.unmount()
  })

  it('connecting: asks again with growing pauses (5, 10, 20, 30 s)', async () => {
    routes['GET /api/assist'] = () => json(200, { enabled: true, status: 'connecting', to: 'lead' })
    const w = await mountIt()
    await tick(5000)
    expect(calls('GET /api/assist')).toBe(2)
    await tick(5000)
    expect(calls('GET /api/assist')).toBe(2)
    await tick(5000)
    expect(calls('GET /api/assist')).toBe(3)
    await tick(20000 + 30000)
    expect(calls('GET /api/assist')).toBe(5)
    w.unmount()
  })

  it('waiting for an answer: checks the thread while open, never while closed', async () => {
    const waitingThread = { ...thread, messages: [...thread.messages, { from: 'you', text: 'And?', at: '2026-11-25T10:01:00Z' }] }
    // A fresh object per answer, as a real fetch gives.
    routes['GET /api/assist/threads?kind=event&key=ev1'] = () => json(200, structuredClone(waitingThread))
    const key = 'GET /api/assist/threads?kind=event&key=ev1'
    const w = await mountIt()
    // Back-off for the thread too: checks at 5, 15, 35, 65 s.
    const first = calls(key)
    await tick(5000)
    expect(calls(key)).toBe(first + 1)
    await tick(9000)
    expect(calls(key)).toBe(first + 1)
    await tick(1000)
    expect(calls(key)).toBe(first + 2)
    await tick(19000)
    expect(calls(key)).toBe(first + 2)
    await tick(1000)
    expect(calls(key)).toBe(first + 3)
    await tick(30000)
    expect(calls(key)).toBe(first + 4)

    isAssistOpen.value = false
    await flushPromises()
    const closed = calls(key)
    await tick(120000)
    expect(calls(key)).toBe(closed)

    // Reopened: one look at once, then the checks go on.
    isAssistOpen.value = true
    await flushPromises()
    expect(calls(key)).toBe(closed + 1)
    await tick(5000)
    expect(calls(key)).toBe(closed + 2)
    w.unmount()
  })
})

afterEach(() => closeAssist())
