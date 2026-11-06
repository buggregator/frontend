import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { AddressFlow } from '.'

// Audit 1.14: the «from → to» row the SMS and SMTP cards both drew.
describe('AddressFlow', () => {
  it('shows sender, arrow and recipient', () => {
    const wrapper = mount(AddressFlow, { props: { from: '+100', to: '+200' } })
    expect(wrapper.findAll('.address-flow__pill').map((p) => p.text())).toEqual(['+100', '+200'])
    expect(wrapper.find('svg').attributes('aria-hidden')).toBe('true')
  })

  it('leaves out the arrow when one side is missing', () => {
    const wrapper = mount(AddressFlow, { props: { from: null, to: 'a@b.c' } })
    expect(wrapper.findAll('.address-flow__pill').map((p) => p.text())).toEqual(['a@b.c'])
    expect(wrapper.find('svg').exists()).toBe(false)
  })
})
