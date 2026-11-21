import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { CodeSnippet } from './index'

describe('CodeSnippet', () => {
  it('shows Copy by default and prints objects as JSON', () => {
    const wrapper = mount(CodeSnippet, { props: { code: { a: 1 }, language: 'json' } })

    expect(wrapper.find('.code-snippet__copy').exists()).toBe(true)
    expect(wrapper.text()).toContain('"a": 1')
  })

  it('hides Copy when not copyable', () => {
    const wrapper = mount(CodeSnippet, { props: { code: 'x', copyable: false } })

    expect(wrapper.find('.code-snippet__copy').exists()).toBe(false)
  })

  it('caps the height so long code scrolls inside', () => {
    const wrapper = mount(CodeSnippet, { props: { code: 'x', maxHeight: '420px' } })
    const style = wrapper.find('pre').attributes('style') ?? ''

    expect(style).toContain('max-height: 420px')
    expect(style).toContain('overflow: auto')
  })
})
