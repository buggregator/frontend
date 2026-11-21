import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { buildChannelList } from '../../lib'
import { broadcastMocks } from '../../mocks'
import BroadcastChannelList from './broadcast-channel-list.vue'

const channels = buildChannelList(broadcastMocks)

const render = (selectedId: string | null = null) =>
  mount(BroadcastChannelList, {
    props: { channels, selectedId, totalEvents: broadcastMocks.length, totalChannels: channels.length },
    attachTo: document.body
  })

describe('BroadcastChannelList', () => {
  it('lists All channels, then each channel with its kind, count and last event', () => {
    const wrapper = render()
    const rows = wrapper.findAll('[data-channel-row]')
    expect(rows).toHaveLength(channels.length + 1)
    expect(rows[0].text()).toContain('All channels')
    expect(rows[1].find('.bc-channels__kind').text()).toBe('private')
    expect(rows[1].find('.bc-channels__name').text()).toBe('private-orders.42')
    const cart = rows.find((r) => r.text().includes('private-cart'))!
    expect(cart.find('.bc-channels__last--error').text()).toContain('✕')
    expect(rows.some((r) => r.text().includes('products.*'))).toBe(true)
    wrapper.unmount()
  })

  it('one tab stop on the picked row; arrows, Home and End move the focus', async () => {
    const wrapper = render('private-orders.42')
    const rows = () => wrapper.findAll<HTMLButtonElement>('[data-channel-row]')
    expect(rows().map((r) => r.attributes('tabindex'))).toEqual(['-1', '0', ...Array(channels.length - 1).fill('-1')])
    expect(rows()[1].attributes('aria-current')).toBe('true')

    await rows()[1].trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement).toBe(rows()[2].element)
    await rows()[2].trigger('keydown', { key: 'End' })
    expect(document.activeElement).toBe(rows()[channels.length].element)
    await rows()[channels.length].trigger('keydown', { key: 'Home' })
    expect(document.activeElement).toBe(rows()[0].element)
    wrapper.unmount()
  })

  it('picks a row by click (Enter and Space on a button)', async () => {
    const wrapper = render()
    await wrapper.findAll('[data-channel-row]')[0].trigger('click')
    expect(wrapper.emitted('select')).toEqual([['*']])
    wrapper.unmount()
  })

  it('roving tab stop: tabindex 0 follows the focused row', async () => {
    const wrapper = render('private-orders.42')
    const rows = () => wrapper.findAll<HTMLButtonElement>('[data-channel-row]')
    await rows()[1].trigger('keydown', { key: 'ArrowDown' })
    expect(rows().map((r) => r.attributes('tabindex'))).toEqual(['-1', '-1', '0', ...Array(channels.length - 2).fill('-1')])
    // a new pick moves the tab stop to it
    await wrapper.setProps({ selectedId: '*' })
    expect(rows()[0].attributes('tabindex')).toBe('0')
    expect(rows().filter((r) => r.attributes('tabindex') === '0')).toHaveLength(1)
    wrapper.unmount()
  })
})
