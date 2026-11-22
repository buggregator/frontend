import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import FacetPicker from './facet-picker.vue'

const options = [
  { value: 'app', count: 12 },
  { value: 'payments', count: 4 },
  { value: 'mail', count: 1 }
]

const render = (modelValue: string[] = []) =>
  mount(FacetPicker, {
    props: { label: 'Channel', options, modelValue, 'onUpdate:modelValue': () => {} },
    attachTo: document.body
  })

describe('FacetPicker', () => {
  it('sums up the pick on the button', () => {
    const label = (picked: string[]) =>
      render(picked).get('[data-test="facet-picker-button"]').attributes('aria-label')
    expect(label([])).toBe('Channel: all 3')
    expect(label(['payments'])).toBe('Channel: payments')
    expect(label(['app', 'mail'])).toBe('Channel: 2 of 3')
  })

  it('opens a list of values with counts and toggles one', async () => {
    const wrapper = render(['app'])
    await wrapper.get('[data-test="facet-picker-button"]').trigger('click')
    const boxes = wrapper.findAll('input[type="checkbox"]')
    expect(wrapper.findAll('.facet-picker__option').map((o) => o.text())).toEqual([
      'app12',
      'payments4',
      'mail1'
    ])
    expect(boxes.map((b) => (b.element as HTMLInputElement).checked)).toEqual([true, false, false])
    expect(document.activeElement).toBe(boxes[0].element)

    await boxes[1].trigger('change')
    await boxes[0].trigger('change')
    expect(wrapper.emitted('update:modelValue')).toEqual([[['app', 'payments']], [[]]])
    wrapper.unmount()
  })

  it('keeps a picked value the counts lost, and resets to all', async () => {
    const wrapper = render(['old'])
    await wrapper.get('[data-test="facet-picker-button"]').trigger('click')
    expect(wrapper.findAll('.facet-picker__name').map((n) => n.text())).toContain('old')
    await wrapper.get('.facet-picker__all').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[[]]])
    wrapper.unmount()
  })

  it('closes on Esc and gives the focus back to the button', async () => {
    const wrapper = render()
    const button = wrapper.get('[data-test="facet-picker-button"]')
    await button.trigger('click')
    await wrapper.get('input').trigger('keydown', { key: 'Escape' })
    await new Promise((r) => setTimeout(r))
    expect(wrapper.find('[data-test="facet-picker-panel"]').exists()).toBe(false)
    expect(document.activeElement).toBe(button.element)
    wrapper.unmount()
  })
})
