import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ExpandableRow from './expandable-row.vue'

const render = (expanded = false) =>
  mount(ExpandableRow, {
    props: { expanded, 'onUpdate:expanded': () => {} },
    slots: {
      default: '<span class="line">cart started</span>',
      actions: '<a href="#" class="act">trace</a>',
      details: '<p class="details">context</p>'
    }
  })

describe('ExpandableRow', () => {
  it('toggles on a click on the line', async () => {
    const wrapper = render()
    await wrapper.get('.line').trigger('click')
    expect(wrapper.emitted('update:expanded')).toEqual([[true]])
  })

  it('toggles with Enter and Space on the focused line', async () => {
    const wrapper = render()
    const toggle = wrapper.get('[data-test="expandable-row-toggle"]')
    expect(toggle.attributes('tabindex')).toBe('0')
    expect(toggle.attributes('role')).toBe('button')
    await toggle.trigger('keydown', { key: 'Enter' })
    await toggle.trigger('keydown', { key: ' ' })
    expect(wrapper.emitted('update:expanded')?.length).toBe(2)
  })

  it('shows the details only when expanded, and says so', async () => {
    const closed = render(false)
    expect(closed.find('.details').exists()).toBe(false)
    expect(closed.get('[data-test="expandable-row-toggle"]').attributes('aria-expanded')).toBe(
      'false'
    )

    const open = render(true)
    const toggle = open.get('[data-test="expandable-row-toggle"]')
    expect(toggle.attributes('aria-expanded')).toBe('true')
    expect(open.get('.details').element.parentElement?.id).toBe(toggle.attributes('aria-controls'))
  })

  it('a click in the actions or the details does not toggle', async () => {
    const wrapper = render(true)
    await wrapper.get('.act').trigger('click')
    await wrapper.get('.details').trigger('click')
    expect(wrapper.emitted('update:expanded')).toBeUndefined()
  })
})
