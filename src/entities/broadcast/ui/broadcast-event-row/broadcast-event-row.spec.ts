import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { broadcastInvalidJsonMock, broadcastMultiChannelMock } from '../../mocks'
import BroadcastEventRow from './broadcast-event-row.vue'

describe('BroadcastEventRow', () => {
  it('says a problem in words for screen readers, the icon is hidden', () => {
    const wrapper = mount(BroadcastEventRow, { props: { event: broadcastInvalidJsonMock } })
    const icon = wrapper.find('.bc-row__problem')
    expect(icon.attributes('aria-hidden')).toBe('true')
    expect(icon.attributes('aria-label')).toBeUndefined()
    expect(wrapper.find('.bc-row__data .sr-only').text()).toBe('error:')
  })

  it('a row without problems has no problem text', () => {
    const wrapper = mount(BroadcastEventRow, { props: { event: broadcastMultiChannelMock } })
    expect(wrapper.find('.bc-row__problem').exists()).toBe(false)
    expect(wrapper.find('.bc-row__more').text()).toBe('+3')
  })
})
