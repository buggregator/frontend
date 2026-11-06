import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useConnectionStore, useEventsStore } from '../../stores'
import { EventTypes } from '../../types'
import { useApiTransport } from './use-api-transport'

const rpc = vi.fn(() => Promise.resolve({ data: { status: true } }))

vi.mock('../io', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../io')>()),
  useCentrifuge: () => ({ centrifuge: { on: vi.fn(), rpc } }),
}))

describe('useApiTransport: delete over WebSocket', () => {
  const fetchMock = vi.fn(() => Promise.resolve(new Response('{}')))

  beforeEach(() => {
    setActivePinia(createPinia())
    useEventsStore().setActiveProjectKey('default')
    useConnectionStore().addWSConnection()
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockClear()
    rpc.mockClear()
  })

  const sentryClearCalls = () =>
    (fetchMock.mock.calls as unknown as [string, RequestInit][])
      .filter(([url]) => url.includes('/api/sentry/all'))
      .map(([url, init]) => `${init.method} ${new URL(url).pathname}${new URL(url).search}`)

  // Pinned events stay on the server, all of them, not only the ones loaded
  // in the browser: the server keeps them with `keep_pinned`.
  it('passes keep_pinned to the server when asked', async () => {
    await useApiTransport().deleteEventsByType(EventTypes.Smtp, { keepPinned: true })
    await useApiTransport().deleteEventsAll({ keepPinned: true })

    expect(rpc).toHaveBeenNthCalledWith(
      1,
      'delete:api/events',
      expect.objectContaining({ type: 'smtp', project: 'default', keep_pinned: true }),
    )
    expect(rpc).toHaveBeenNthCalledWith(
      2,
      'delete:api/events',
      expect.objectContaining({ project: 'default', keep_pinned: true }),
    )
  })

  // `DELETE /api/sentry/all` without a project wipes every project's traces,
  // logs and metrics.
  it('clears the Sentry tables of the current project only, keeping pinned errors', async () => {
    await useApiTransport().deleteEventsByType(EventTypes.Sentry)
    await useApiTransport().deleteEventsAll()

    expect(sentryClearCalls()).toEqual([
      'DELETE /api/sentry/all?project=default&keep_pinned=1',
      'DELETE /api/sentry/all?project=default&keep_pinned=1',
    ])
  })

  // Without `type` the server clears every event of the project.
  it('deleteEventsByType sends the type with the RPC', async () => {
    await useApiTransport().deleteEventsByType(EventTypes.Smtp)

    expect(rpc).toHaveBeenCalledWith(
      'delete:api/events',
      expect.objectContaining({ type: 'smtp', project: 'default' }),
    )
  })

  it('deleteEventsAll sends no type', async () => {
    await useApiTransport().deleteEventsAll()

    expect(rpc).toHaveBeenCalledWith(
      'delete:api/events',
      expect.not.objectContaining({ type: expect.anything() }),
    )
  })
})
