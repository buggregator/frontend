import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import UserAvatar from './user-avatar.vue'

describe('UserAvatar', () => {
  it('shows the picture when there is one', () => {
    const wrapper = mount(UserAvatar, { props: { src: 'https://example.test/a.png', name: 'Ann Smith' } })

    expect(wrapper.get('img').attributes('src')).toBe('https://example.test/a.png')
    expect(wrapper.find('.user-avatar__initials').exists()).toBe(false)
  })

  it('shows initials when the provider sends no picture', () => {
    const wrapper = mount(UserAvatar, { props: { src: null, name: 'Ann Smith' } })

    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.get('.user-avatar__initials').text()).toBe('AS')
  })

  it('falls back to initials when the picture does not load', async () => {
    const wrapper = mount(UserAvatar, { props: { src: 'https://example.test/broken.png', name: 'john.doe@example.test' } })

    await wrapper.get('img').trigger('error')

    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.get('.user-avatar__initials').text()).toBe('JD')
  })

  it('tries a new picture again after a broken one', async () => {
    const wrapper = mount(UserAvatar, { props: { src: 'https://example.test/broken.png', name: 'Ann' } })
    await wrapper.get('img').trigger('error')

    await wrapper.setProps({ src: 'https://example.test/b.png' })

    expect(wrapper.get('img').attributes('src')).toBe('https://example.test/b.png')
  })

  it('is decoration: the control around it names the user', () => {
    const wrapper = mount(UserAvatar, { props: { src: null, name: 'Ann' } })

    expect(wrapper.attributes('aria-hidden')).toBe('true')
    expect(wrapper.attributes('style')).toContain('--ua-size: 28px')
  })
})
