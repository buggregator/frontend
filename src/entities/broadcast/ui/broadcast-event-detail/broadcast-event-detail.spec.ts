import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
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
    await nextTick()
    expect(wrapper.text()).toContain('Loading the full events')
    await flushPromises()

    expect(getItem).toHaveBeenCalledWith(cut.uuid)
    const paths = wrapper.findAll('.bc-detail__change-path').map((p) => p.text())
    expect(paths).toEqual(['order.status', 'order.tracking', 'order.items', 'updated_by', 'pad'])
  })
})
