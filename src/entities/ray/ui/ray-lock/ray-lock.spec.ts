import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import RayLock from './ray-lock.vue'

const cont = vi.fn()
const stop = vi.fn()
vi.mock('@/shared/lib/use-events', () => ({ useEvents: () => ({ rayExecution: { continue: cont, stop } }) }))

const buttons = (w: ReturnType<typeof mount>) => w.findAll('button')
const status = (w: ReturnType<typeof mount>) => w.get('[role=status]').text()

describe('RayLock', () => {
  beforeEach(() => {
    cont.mockReset()
    stop.mockReset()
  })

  it('waits for a click while the pause is active', () => {
    const w = mount(RayLock, { props: { name: 'abc' } })
    expect(status(w)).toContain('Paused')
    expect(buttons(w).every((b) => !b.attributes('disabled'))).toBe(true)
  })

  it('Continue: sends the lock name, then shows «Continued» with both buttons off', async () => {
    cont.mockResolvedValue({ code: 200, data: { status: true, state: 'continued' } })
    const w = mount(RayLock, { props: { name: 'abc' } })
    await buttons(w)[0].trigger('click')
    await flushPromises()
    expect(cont).toHaveBeenCalledWith('abc')
    expect(status(w)).toContain('Continued')
    expect(buttons(w).every((b) => b.attributes('disabled') !== undefined)).toBe(true)
  })

  it('Stop: shows «Stopped»', async () => {
    stop.mockResolvedValue({ code: 200, data: { status: true, state: 'stopped' } })
    const w = mount(RayLock, { props: { name: 'abc' } })
    await buttons(w)[1].trigger('click')
    await flushPromises()
    expect(stop).toHaveBeenCalledWith('abc')
    expect(status(w)).toContain('Stopped')
  })

  it('shows the state the server stored (reload, another tab) with the buttons off', () => {
    const w = mount(RayLock, { props: { name: 'abc', state: 'stopped' } })
    expect(status(w)).toContain('Stopped')
    expect(buttons(w).every((b) => b.attributes('disabled') !== undefined)).toBe(true)
  })

  it('a 404 means the pause is gone: says so, buttons off', async () => {
    cont.mockResolvedValue({ code: 404, data: { status: false, error: 'lock not found' } })
    const w = mount(RayLock, { props: { name: 'abc' } })
    await buttons(w)[0].trigger('click')
    await flushPromises()
    expect(status(w)).toContain('no longer active')
    expect(buttons(w)[0].attributes('disabled')).toBeDefined()
  })

  it('a failed click keeps the buttons on and asks to try again', async () => {
    cont.mockRejectedValue(new Error('offline'))
    const w = mount(RayLock, { props: { name: 'abc' } })
    await buttons(w)[0].trigger('click')
    await flushPromises()
    expect(status(w)).toContain('Try again')
    expect(buttons(w)[0].attributes('disabled')).toBeUndefined()
  })
})
