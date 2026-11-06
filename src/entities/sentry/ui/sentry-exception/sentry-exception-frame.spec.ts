import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SentryExceptionFrame from './sentry-exception-frame.vue'

const frame = {
  filename: '/app/src/Cart.php',
  function: 'total',
  lineno: 12,
  pre_context: ['$a = 1;'],
  context_line: 'return $a;',
  post_context: ['}'],
}

// Audit 5.10: a frame opened only by a click on a div.
describe('SentryExceptionFrame: keyboard', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    setActivePinia(createPinia())
  })

  it('opens and closes the code with a button that says its state', async () => {
    const wrapper = mount(SentryExceptionFrame, { props: { frame, isOpen: false } as never })
    const toggle = wrapper.get('button.frame__toggle')
    expect(toggle.attributes('aria-expanded')).toBe('false')
    expect(toggle.attributes('aria-label')).toBe('Show code of Cart.php at line 12')
    expect(wrapper.find('.frame__body').exists()).toBe(false)

    await toggle.trigger('click')
    expect(toggle.attributes('aria-expanded')).toBe('true')
    expect(wrapper.find('.frame__body').exists()).toBe(true)
    expect(toggle.attributes('aria-controls')).toBe(wrapper.get('.frame__body').attributes('id'))

    await toggle.trigger('click')
    expect(wrapper.find('.frame__body').exists()).toBe(false)
  })

  it('has no toggle when there is no code to show', () => {
    const wrapper = mount(SentryExceptionFrame, { props: { frame: { filename: 'a.php', lineno: 1 }, isOpen: false } as never })
    expect(wrapper.find('button.frame__toggle').exists()).toBe(false)
  })
})
