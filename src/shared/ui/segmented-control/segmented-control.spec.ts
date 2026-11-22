import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import SegmentedControl from './segmented-control.vue'
import type { SegmentedOption } from './types'

const options: SegmentedOption[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first', count: 3, title: 'Oldest events first' },
  { value: 'off', label: 'Off', disabled: true }
]

const render = (props: Record<string, unknown> = {}) =>
  mount(SegmentedControl, { props: { options, modelValue: 'newest', label: 'Order', ...props } })

describe('SegmentedControl', () => {
  it('a named group of buttons; the chosen one is pressed', () => {
    const w = render()
    expect(w.get('[role="group"]').attributes('aria-label')).toBe('Order')
    const all = w.findAll('button')
    expect(all.map((b) => b.attributes('aria-pressed'))).toEqual(['true', 'false', 'false'])
    expect(all.map((b) => b.attributes('type'))).toEqual(['button', 'button', 'button'])
    expect(all[1].get('.ui-seg__count').text()).toBe('3')
    expect(all[1].attributes('title')).toBe('Oldest events first')
  })

  it('a click picks the option through v-model; a disabled one is aria-disabled and stays', async () => {
    const w = render()
    const all = w.findAll('button')
    await all[1].trigger('click')
    expect(w.emitted('update:modelValue')).toEqual([['oldest']])
    expect(all[2].attributes('aria-disabled')).toBe('true')
    await all[2].trigger('click')
    expect(w.emitted('update:modelValue')).toHaveLength(1)
  })

  it('size, variant and block are classes; aria-labelledby passes through', () => {
    const w = mount(SegmentedControl, {
      props: { options, modelValue: 'oldest', size: 'sm', variant: 'outline', block: true },
      attrs: { 'aria-labelledby': 'lbl' }
    })
    const group = w.get('[role="group"]')
    expect(group.classes()).toEqual(expect.arrayContaining(['ui-seg--sm', 'ui-seg--outline', 'ui-seg--block']))
    expect(group.attributes('aria-labelledby')).toBe('lbl')
    expect(group.attributes('aria-label')).toBeUndefined()
  })

  it('icon-only on a phone: the label stays the button name', () => {
    const w = render({
      iconOnlyOnPhone: true,
      options: [{ value: 'mobile', label: 'Mobile', icon: 'mobile-device' }]
    })
    const button = w.get('button')
    expect(button.attributes('aria-label')).toBe('Mobile')
    expect(button.find('.ui-seg__icon').exists()).toBe(true)
    expect(w.get('[role="group"]').classes()).toContain('ui-seg--icon-phone')
  })

  it('values may be booleans; testPrefix names the options for tests', async () => {
    const w = mount(SegmentedControl, {
      props: {
        options: [
          { value: false, label: 'All' },
          { value: true, label: 'Needs attention' }
        ],
        modelValue: false,
        testPrefix: 'only-'
      }
    })
    await w.get('[data-test="only-true"]').trigger('click')
    expect(w.emitted('update:modelValue')).toEqual([[true]])
  })
})
