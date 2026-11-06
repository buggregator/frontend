import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useEventsStore } from '../../stores'
import { useEvents } from './use-events'

const rpcAnswer = (code: number) => ({ data: { code, data: null } })

const transport = {
  pinEvent: vi.fn((): Promise<unknown> => Promise.resolve(rpcAnswer(200))),
  unpinEvent: vi.fn((): Promise<unknown> => Promise.resolve(rpcAnswer(200))),
  rayContinueExecution: vi.fn(),
  rayStopExecution: vi.fn(),
}

vi.mock('../use-api-transport', () => ({ useApiTransport: () => transport }))

// Audit 1.3: a pin showed at once and stayed even when the server refused it.
describe('useEvents: pins follow the server', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    setActivePinia(createPinia())
    Object.values(transport).forEach((fn) => fn.mockClear())
  })

  it('keeps a pin the server took', async () => {
    expect(await useEvents().lockedIds.add('a')).toBe(true)
    expect(useEventsStore().lockedIds).toEqual(['a'])
  })

  it('takes a pin back when the server answers 500', async () => {
    transport.pinEvent.mockResolvedValueOnce(rpcAnswer(500))

    expect(await useEvents().lockedIds.add('a')).toBe(false)
    expect(useEventsStore().lockedIds).toEqual([])
  })

  it('puts a pin back when unpinning fails on the network', async () => {
    useEventsStore().addLockedIds('a')
    transport.unpinEvent.mockRejectedValueOnce(new Error('offline'))

    expect(await useEvents().lockedIds.remove('a')).toBe(false)
    expect(useEventsStore().lockedIds).toEqual(['a'])
  })
})
