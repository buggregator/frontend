import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { pixelBug } from '../../lib/project-avatar'
import ProjectAvatar from './project-avatar.vue'

describe('ProjectAvatar', () => {
  it('draws the key’s bug at the given size, hidden from screen readers', () => {
    const wrapper = mount(ProjectAvatar, { props: { projectKey: 'shop', size: 40 } })
    const svg = wrapper.get('svg')

    expect(svg.attributes('width')).toBe('40')
    expect(svg.attributes('aria-hidden')).toBe('true')
    // One square per filled cell in the body path, two in the eyes path.
    expect(wrapper.get('.project-avatar__ink').attributes('d')!.match(/z/g)).toHaveLength(
      pixelBug('shop').cells.length
    )
    expect(wrapper.get('.project-avatar__eye').attributes('d')!.match(/z/g)).toHaveLength(2)
  })

  it('carries both themes’ colours of the key’s hue', () => {
    const { hue } = pixelBug('billing')
    const style = mount(ProjectAvatar, { props: { projectKey: 'billing' } }).get('svg').attributes('style')

    expect(style).toContain(`--pa-tile-light: ${hue.light.tile}`)
    expect(style).toContain(`--pa-ink-light: ${hue.light.ink}`)
    expect(style).toContain(`--pa-tile-dark: ${hue.dark.tile}`)
    expect(style).toContain(`--pa-ink-dark: ${hue.dark.ink}`)
  })

  it('redraws when the key changes', async () => {
    const wrapper = mount(ProjectAvatar, { props: { projectKey: 'default' } })
    const before = wrapper.html()
    await wrapper.setProps({ projectKey: 'shop' })

    expect(wrapper.html()).not.toBe(before)
    expect(wrapper.get('svg').attributes('width')).toBe('28')
  })
})
