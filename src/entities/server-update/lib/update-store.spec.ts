import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  availableStatus,
  doneStatus,
  downloadingStatus,
  failedStatus,
  installingStatus,
  restartingStatus,
  rolledBackStatus,
  upToDateStatus,
} from '../mocks'
import type { UpdateStatus } from '../types'
import { dispatchUpdatePublication } from './update-bus'
import { useServerUpdateStore } from './update-store'

type Route = (init: RequestInit | undefined) => Response | Promise<Response>

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })

// Answers by "METHOD path"; a queue answers in turn, its last answer repeats.
const serve = (routes: Record<string, Route | Route[]>) => {
  const fetchMock = vi.fn((url: string, init?: RequestInit) => {
    const key = `${init?.method ?? 'GET'} ${new URL(url).pathname}`
    const route = routes[key]
    if (!route) return Promise.resolve(new Response('', { status: 404 }))
    const next = Array.isArray(route) ? (route.length > 1 ? route.shift()! : route[0]) : route
    return Promise.resolve(next(init))
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

const answer = (status: UpdateStatus, code = 200): Route => () => json(status, code)

describe('useServerUpdateStore', () => {
  const reload = vi.fn()

  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    setActivePinia(createPinia())
    reload.mockClear()
  })

  afterEach(() => {
    useServerUpdateStore().$dispose()
    useServerUpdateStore().stop()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  const init = async () => {
    const store = useServerUpdateStore()
    await store.init({ reload, listen: false })
    return store
  }

  describe('older server', () => {
    it('hides the feature when /api/update is unknown', async () => {
      serve({})
      const store = await init()

      expect(store.supported).toBe(false)
      expect(store.status).toBeNull()
      expect(store.hasAttention).toBe(false)
      expect(store.indicator).toBeNull()
    })

    it('stays unknown, not hidden, when the server cannot be reached', async () => {
      vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))))
      const store = await init()

      expect(store.supported).toBeNull()
    })
  })

  describe('load', () => {
    it('keeps the status and the version the tab loaded with', async () => {
      serve({ 'GET /api/update': answer(availableStatus) })
      const store = await init()

      expect(store.supported).toBe(true)
      expect(store.status).toEqual(availableStatus)
      expect(store.loadedVersion).toBe('2.9.0')
    })
  })

  describe('settings dot', () => {
    it.each([
      ['available', availableStatus, true, 'Buggregator 2.10.0 is available'],
      ['up to date', upToDateStatus, false, ''],
      ['downloading', downloadingStatus, false, ''],
      ['failed', failedStatus, true, 'The update failed'],
      ['rolled back', rolledBackStatus, true, 'The update was rolled back'],
      ['done', doneStatus, false, ''],
    ])('%s → %s', async (_, status, visible, text) => {
      serve({ 'GET /api/update': answer(status) })
      const store = await init()

      expect(store.hasAttention).toBe(visible)
      expect(store.attentionText).toBe(text)
    })
  })

  describe('header pill', () => {
    it('shows the download percent', async () => {
      serve({ 'GET /api/update': answer(downloadingStatus) })
      const store = await init()

      expect(store.indicator).toEqual({
        label: 'Updating',
        percent: 42,
        restarting: false,
        ariaLabel: 'Updating to 2.10.0, 42%. Show details',
      })
    })

    it('has no percent while installing and says restarting while it restarts', async () => {
      serve({ 'GET /api/update': [answer(installingStatus), answer(restartingStatus)] })
      const store = await init()
      expect(store.indicator).toMatchObject({ label: 'Updating', percent: null })

      store.applyState(restartingStatus.state)
      expect(store.indicator).toMatchObject({ label: 'Restarting…', restarting: true })
    })

    it('is hidden when nothing runs', async () => {
      serve({ 'GET /api/update': answer(availableStatus) })
      const store = await init()

      expect(store.indicator).toBeNull()
    })
  })

  describe('progress over the socket', () => {
    it('applies update.progress states', async () => {
      serve({ 'GET /api/update': answer(availableStatus) })
      const store = await init()
      const stop = (await import('./update-bus')).onUpdateProgress((state) => store.applyState(state), { listen: false })

      dispatchUpdatePublication({ data: { event: 'update.progress', data: downloadingStatus.state } })

      expect(store.status?.state.phase).toBe('downloading')
      expect(store.indicator?.percent).toBe(42)
      stop()
    })

    it('asks the server while the socket is down during a download', async () => {
      const fetchMock = serve({ 'GET /api/update': [answer(downloadingStatus), answer(installingStatus)] })
      const store = await init()

      await vi.advanceTimersByTimeAsync(2000)

      expect(fetchMock).toHaveBeenCalledTimes(2)
      expect(store.status?.state.phase).toBe('installing')
    })
  })

  describe('restart', () => {
    it('reloads the page once the new version answers', async () => {
      serve({
        'GET /api/update': [
          answer(restartingStatus),
          () => Promise.reject(new TypeError('Failed to fetch')),
          answer(doneStatus),
        ],
      })
      await init()

      await vi.advanceTimersByTimeAsync(1000)
      expect(reload).not.toHaveBeenCalled()
      await vi.advanceTimersByTimeAsync(1000)
      expect(reload).toHaveBeenCalledTimes(1)
    })

    it('shows the rollback without a reload', async () => {
      serve({ 'GET /api/update': [answer(restartingStatus), answer(rolledBackStatus)] })
      const store = await init()

      await vi.advanceTimersByTimeAsync(1000)

      expect(reload).not.toHaveBeenCalled()
      expect(store.status?.state.phase).toBe('rolled_back')
    })

    it('gives up after 90 s and says so', async () => {
      serve({ 'GET /api/update': [answer(restartingStatus), () => Promise.reject(new TypeError('Failed to fetch'))] })
      const store = await init()

      await vi.advanceTimersByTimeAsync(91_000)

      expect(store.restartGaveUp).toBe(true)
      expect(reload).not.toHaveBeenCalled()
    })
  })

  describe('check now', () => {
    it('shows checking, then the new status', async () => {
      let release!: () => void
      serve({
        'GET /api/update': answer(upToDateStatus),
        'POST /api/update/check': () => new Promise<Response>((resolve) => { release = () => resolve(json(availableStatus)) }),
      })
      const store = await init()

      const done = store.check()
      expect(store.checking).toBe(true)
      release()
      await done

      expect(store.checking).toBe(false)
      expect(store.status?.available).toBe(true)
      expect(store.checkMessage).toBe('')
    })

    it('says to wait when checked within a minute', async () => {
      serve({
        'GET /api/update': answer(upToDateStatus),
        'POST /api/update/check': () => json({ message: 'too many', code: 429, retry_after: 42 }, 429),
      })
      const store = await init()

      await store.check()

      expect(store.checkMessage).toBe('Checked less than a minute ago. Try again in 42 s.')
      expect(store.status).toEqual(upToDateStatus)
    })

    it('says why a check failed', async () => {
      serve({
        'GET /api/update': answer(upToDateStatus),
        'POST /api/update/check': () => json({ message: 'GitHub cannot be reached', code: 502 }, 502),
      })
      const store = await init()

      await store.check()

      expect(store.checkMessage).toBe('Could not check: GitHub cannot be reached')
    })
  })

  describe('start', () => {
    it('sends the version and follows the answer', async () => {
      const fetchMock = serve({
        'GET /api/update': answer(availableStatus),
        'POST /api/update': answer(downloadingStatus, 202),
      })
      const store = await init()

      await store.start('2.10.0')

      expect(fetchMock).toHaveBeenLastCalledWith(expect.stringContaining('/api/update'), expect.objectContaining({ body: '{"version":"2.10.0"}' }))
      expect(store.status?.state.phase).toBe('downloading')
      expect(store.actionError).toBe('')
    })

    it.each([
      [409, 'An update is already running. Its progress is shown here.'],
      [400, 'A newer release came out since the last check. Check again, then update.'],
      [403, 'Updating from this page is off: switched off on the server'],
      [500, 'The update did not start: boom'],
    ])('a refused start (%s) says why', async (code, text) => {
      serve({
        'GET /api/update': answer(availableStatus),
        'POST /api/update': () => json({ message: code === 403 ? 'switched off on the server' : 'boom', code }, code),
      })
      const store = await init()

      await store.start('2.10.0')

      expect(store.actionError).toBe(text)
      expect(store.starting).toBe(false)
    })
  })
})
