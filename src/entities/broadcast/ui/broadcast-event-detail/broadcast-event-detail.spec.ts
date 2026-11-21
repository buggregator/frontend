import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  broadcastInvalidJsonMock,
  broadcastOrderStatusMock,
  broadcastOrderStatusPrevMock
} from '../../mocks'
import type { BroadcastEvent } from '../../types'
import BroadcastEventDetail from './broadcast-event-detail.vue'

const getItem = vi.fn()
vi.mock('@/shared/lib/use-events', () => ({ useEvents: () => ({ events: { getItem } }) }))

const render = (event: BroadcastEvent, previous: BroadcastEvent | null = null) =>
  mount(BroadcastEventDetail, { props: { event, previous, channel: 'private-orders.42' } })

describe('BroadcastEventDetail', () => {
  let warn: ReturnType<typeof vi.spyOn>
  beforeEach(() => {
    getItem.mockReset()
    warn = vi.spyOn(console, 'warn')
  })
  afterEach(() => {
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })

  it('the first event of its name: the payload, nothing to compare', () => {
    const wrapper = render(broadcastOrderStatusPrevMock)
    expect(wrapper.find('[data-test="bc-first"]').text()).toContain('The first OrderStatusUpdated on private-orders.42')
    expect(wrapper.find('.bc-json').text()).toContain('"status": "packed"')
    expect(wrapper.find('.bc-json__line--chg').exists()).toBe(false)
  })

  it('lists what changed since the previous one and marks it in the payload', () => {
    const wrapper = render(broadcastOrderStatusMock, broadcastOrderStatusPrevMock)
    const changes = wrapper.findAll('[data-test="bc-changes"] li').map((li) => li.text().replace(/\s+/g, ' '))
    expect(changes).toEqual([
      '~order.status: "packed" → null',
      '~order.tracking: null → "1Z999AA10123456784"'
    ])
    expect(wrapper.find('.bc-detail__lost').text()).toContain('e.order.status')
    const marked = wrapper.findAll('.bc-json__line--chg').map((l) => l.text())
    expect(marked[0]).toMatch(/~\s+"status": null,\s*was "packed"/)
    expect(wrapper.text()).toContain('Except socket')
    expect(getItem).not.toHaveBeenCalled()
  })

  it('shows data that is not JSON as it came, with the warning', () => {
    const wrapper = render(broadcastInvalidJsonMock)
    expect(wrapper.find('.bc-detail__raw').text()).toBe(broadcastInvalidJsonMock.payload.data)
    expect(wrapper.find('.bc-problems__item--error').text()).toContain('not JSON')
    expect(wrapper.find('.bc-detail__bad').text()).toContain('does not match')
  })

  it('loads the full event when the preview cut its data, and compares that', async () => {
    const data = JSON.stringify({ order: { id: 42, status: 'shipped' }, pad: 'x'.repeat(3000) })
    const cut: BroadcastEvent = {
      ...broadcastOrderStatusMock,
      payload: { ...broadcastOrderStatusMock.payload, data: data.slice(0, 2048), data_json: undefined, size: data.length }
    }
    delete (cut.payload as { data_json?: unknown }).data_json
    getItem.mockResolvedValue({ ...cut, payload: { ...cut.payload, data, data_json: JSON.parse(data) } })

    const wrapper = render(cut, broadcastOrderStatusPrevMock)
    expect(wrapper.text()).toContain('Loading the full events')
    await flushPromises()

    expect(getItem).toHaveBeenCalledWith(cut.uuid)
    const paths = wrapper.findAll('.bc-detail__change-path').map((p) => p.text())
    expect(paths).toEqual(['order.status', 'order.tracking', 'order.items', 'updated_by', 'pad'])
  })

  const cutOf = (e: BroadcastEvent, extra = 3000): BroadcastEvent => {
    const data = JSON.stringify({ ...(e.payload.data_json as object), pad: 'é'.repeat(extra) })
    const payload = { ...e.payload, data: data.slice(0, 2048), size: new TextEncoder().encode(data).length }
    delete (payload as { data_json?: unknown }).data_json
    return { ...e, payload }
  }

  it('says the full event did not load instead of «not JSON», and copies nothing cut', async () => {
    getItem.mockRejectedValue(new Error('down'))
    const wrapper = render(cutOf(broadcastOrderStatusMock), broadcastOrderStatusPrevMock)
    // the load starts in setup: no «not JSON» flash before it
    expect(wrapper.text()).not.toContain('not JSON')
    expect(wrapper.text()).toContain('Loading the full events')
    expect(wrapper.findAll('.bc-detail__btn').every((b) => b.attributes('disabled') !== undefined)).toBe(true)
    await flushPromises()
    expect(wrapper.find('[data-test="bc-load-failed"]').text()).toContain('Could not load the full event')
    expect(wrapper.text()).not.toContain('not JSON')
    expect(wrapper.findAll('.bc-detail__btn').every((b) => b.attributes('disabled') !== undefined)).toBe(true)
  })

  it('counts the shown part of a cut payload in bytes', async () => {
    getItem.mockRejectedValue(new Error('down'))
    const cut = cutOf(broadcastOrderStatusMock)
    const wrapper = render(cut)
    await flushPromises()
    const bytes = new TextEncoder().encode(cut.payload.data).length
    expect(bytes).not.toBe(cut.payload.data.length)
    expect(wrapper.text()).toContain(`The first ${(bytes / 1024).toFixed(1)} KB of`)
  })

  it('loads the full events again when the event or the previous one changes', async () => {
    getItem.mockImplementation(async (id: string) => ({ ...broadcastOrderStatusMock, uuid: id }))
    const wrapper = render(broadcastOrderStatusMock, broadcastOrderStatusPrevMock)
    expect(getItem).not.toHaveBeenCalled()
    const other = { ...cutOf(broadcastOrderStatusMock), uuid: 'bc-other' }
    const prev = { ...cutOf(broadcastOrderStatusPrevMock), uuid: 'bc-prev2' }
    await wrapper.setProps({ event: other, previous: prev })
    await flushPromises()
    expect(getItem.mock.calls.map((c) => c[0]).sort()).toEqual(['bc-other', 'bc-prev2'])
  })
})
