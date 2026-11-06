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
  beforeEach(() => {
    setActivePinia(createPinia())
    useEventsStore().setActiveProjectKey('default')
    useConnectionStore().addWSConnection()
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response('{}'))))
    rpc.mockClear()
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
